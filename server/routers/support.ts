import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { z } from "zod";
import {
  shops,
  supportMessages,
  supportTickets,
  users,
} from "../../drizzle/schema";
import { getDb, getMembership } from "../db";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";

const ticketStatus = z.enum([
  "open",
  "in_progress",
  "waiting_user",
  "resolved",
  "closed",
]);
const ticketCategory = z.enum([
  "account",
  "technical",
  "data",
  "payment",
  "feature",
  "other",
]);
const ticketPriority = z.enum(["low", "medium", "high"]);

const messageInput = z.object({
  ticketId: z.string().uuid(),
  body: z.string().trim().min(2).max(5000),
});

function makeTicketNumber() {
  return `SUP-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${crypto
    .randomUUID()
    .slice(0, 6)
    .toUpperCase()}`;
}

async function getUserTicket(ticketId: string, userId: string) {
  const [ticket] = await getDb()
    .select({
      id: supportTickets.id,
      ticketNumber: supportTickets.ticketNumber,
      priority: supportTickets.priority,
      status: supportTickets.status,
      userId: supportTickets.userId,
    })
    .from(supportTickets)
    .where(
      and(eq(supportTickets.id, ticketId), eq(supportTickets.userId, userId))
    )
    .limit(1);
  if (!ticket) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Demande de support introuvable.",
    });
  }
  return ticket;
}

async function getAnyTicket(ticketId: string) {
  const [ticket] = await getDb()
    .select({
      id: supportTickets.id,
      ticketNumber: supportTickets.ticketNumber,
      priority: supportTickets.priority,
      status: supportTickets.status,
      userId: supportTickets.userId,
    })
    .from(supportTickets)
    .where(eq(supportTickets.id, ticketId))
    .limit(1);
  if (!ticket) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Demande de support introuvable.",
    });
  }
  return ticket;
}

async function listMessages(ticketId: string) {
  return getDb()
    .select({
      id: supportMessages.id,
      body: supportMessages.body,
      authorType: supportMessages.authorType,
      createdAt: supportMessages.createdAt,
      authorName: users.name,
      authorEmail: users.email,
    })
    .from(supportMessages)
    .innerJoin(users, eq(supportMessages.authorId, users.id))
    .where(eq(supportMessages.ticketId, ticketId))
    .orderBy(supportMessages.createdAt);
}

const adminListInput = z.object({
  query: z.string().trim().max(160).default(""),
  status: z.union([ticketStatus, z.literal("all")]).default("all"),
  priority: z.union([ticketPriority, z.literal("all")]).default("all"),
  limit: z.number().int().min(1).max(100).default(50),
});

export const supportRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        shopId: z.string().uuid().optional(),
        category: ticketCategory,
        priority: ticketPriority.default("medium"),
        subject: z.string().trim().min(3).max(180),
        message: z.string().trim().min(5).max(5000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.shopId && !(await getMembership(ctx.user.id, input.shopId))) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Vous ne pouvez pas associer cette boutique à votre demande.",
        });
      }
      const ticketId = crypto.randomUUID();
      const ticketNumber = makeTicketNumber();
      const now = new Date();
      await getDb().insert(supportTickets).values({
        id: ticketId,
        ticketNumber,
        userId: ctx.user.id,
        shopId: input.shopId,
        category: input.category,
        priority: input.priority,
        subject: input.subject,
        lastMessageAt: now,
        lastMessageBy: "user",
      });
      await getDb().insert(supportMessages).values({
        ticketId,
        authorId: ctx.user.id,
        authorType: "user",
        body: input.message,
      });
      return { id: ticketId, ticketNumber };
    }),

  mine: protectedProcedure
    .input(
      z.object({
        status: z.union([ticketStatus, z.literal("all")]).default("all"),
      })
    )
    .query(async ({ ctx, input }) => {
      const statusCondition =
        input.status === "all"
          ? undefined
          : eq(supportTickets.status, input.status);
      return getDb()
        .select({
          id: supportTickets.id,
          ticketNumber: supportTickets.ticketNumber,
          category: supportTickets.category,
          priority: supportTickets.priority,
          subject: supportTickets.subject,
          status: supportTickets.status,
          lastMessageAt: supportTickets.lastMessageAt,
          lastMessageBy: supportTickets.lastMessageBy,
          closedAt: supportTickets.closedAt,
          shopName: shops.name,
        })
        .from(supportTickets)
        .leftJoin(shops, eq(supportTickets.shopId, shops.id))
        .where(and(eq(supportTickets.userId, ctx.user.id), statusCondition))
        .orderBy(desc(supportTickets.lastMessageAt));
    }),

  detail: protectedProcedure
    .input(z.object({ ticketId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const ticket = await getUserTicket(input.ticketId, ctx.user.id);
      return { ticket, messages: await listMessages(input.ticketId) };
    }),

  reply: protectedProcedure
    .input(messageInput)
    .mutation(async ({ ctx, input }) => {
      const ticket = await getUserTicket(input.ticketId, ctx.user.id);
      if (ticket.status === "closed") {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "Cette demande est clôturée. Créez une nouvelle demande si le problème persiste.",
        });
      }
      const now = new Date();
      await getDb().insert(supportMessages).values({
        ticketId: ticket.id,
        authorId: ctx.user.id,
        authorType: "user",
        body: input.body,
      });
      await getDb()
        .update(supportTickets)
        .set({
          status: "open",
          closedAt: null,
          lastMessageAt: now,
          lastMessageBy: "user",
          updatedAt: now,
        })
        .where(eq(supportTickets.id, ticket.id));
      return { id: ticket.id, status: "open" as const };
    }),

  close: protectedProcedure
    .input(z.object({ ticketId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const ticket = await getUserTicket(input.ticketId, ctx.user.id);
      const now = new Date();
      await getDb()
        .update(supportTickets)
        .set({ status: "closed", closedAt: now, updatedAt: now })
        .where(eq(supportTickets.id, ticket.id));
      return { id: ticket.id, status: "closed" as const };
    }),

  adminSummary: adminProcedure.query(async () => {
    const [result] = await getDb()
      .select({
        open: sql<number>`count(*) filter (where ${supportTickets.status} = 'open')`,
        inProgress: sql<number>`count(*) filter (where ${supportTickets.status} = 'in_progress')`,
        waitingUser: sql<number>`count(*) filter (where ${supportTickets.status} = 'waiting_user')`,
        resolved: sql<number>`count(*) filter (where ${supportTickets.status} = 'resolved')`,
        pending: sql<number>`count(*) filter (where ${supportTickets.status} in ('open', 'in_progress'))`,
      })
      .from(supportTickets);
    return {
      open: Number(result?.open ?? 0),
      inProgress: Number(result?.inProgress ?? 0),
      waitingUser: Number(result?.waitingUser ?? 0),
      resolved: Number(result?.resolved ?? 0),
      pending: Number(result?.pending ?? 0),
    };
  }),

  adminList: adminProcedure.input(adminListInput).query(async ({ input }) => {
    const search = input.query ? `%${input.query}%` : undefined;
    const statusCondition =
      input.status === "all"
        ? undefined
        : eq(supportTickets.status, input.status);
    const priorityCondition =
      input.priority === "all"
        ? undefined
        : eq(supportTickets.priority, input.priority);
    const searchCondition = search
      ? or(
          ilike(supportTickets.ticketNumber, search),
          ilike(supportTickets.subject, search),
          ilike(users.email, search),
          ilike(users.name, search)
        )
      : undefined;
    return getDb()
      .select({
        id: supportTickets.id,
        ticketNumber: supportTickets.ticketNumber,
        category: supportTickets.category,
        priority: supportTickets.priority,
        subject: supportTickets.subject,
        status: supportTickets.status,
        assignedAdminId: supportTickets.assignedAdminId,
        lastMessageAt: supportTickets.lastMessageAt,
        lastMessageBy: supportTickets.lastMessageBy,
        createdAt: supportTickets.createdAt,
        requesterName: users.name,
        requesterEmail: users.email,
        shopName: shops.name,
      })
      .from(supportTickets)
      .innerJoin(users, eq(supportTickets.userId, users.id))
      .leftJoin(shops, eq(supportTickets.shopId, shops.id))
      .where(and(statusCondition, priorityCondition, searchCondition))
      .orderBy(
        sql`case ${supportTickets.priority} when 'high' then 3 when 'medium' then 2 else 1 end desc`,
        desc(supportTickets.lastMessageAt)
      )
      .limit(input.limit);
  }),

  adminDetail: adminProcedure
    .input(z.object({ ticketId: z.string().uuid() }))
    .query(async ({ input }) => {
      const ticket = await getAnyTicket(input.ticketId);
      return { ticket, messages: await listMessages(input.ticketId) };
    }),

  adminReply: adminProcedure
    .input(messageInput)
    .mutation(async ({ ctx, input }) => {
      const ticket = await getAnyTicket(input.ticketId);
      if (ticket.status === "closed") {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Cette demande est déjà clôturée.",
        });
      }
      const now = new Date();
      await getDb().insert(supportMessages).values({
        ticketId: ticket.id,
        authorId: ctx.user.id,
        authorType: "admin",
        body: input.body,
      });
      await getDb()
        .update(supportTickets)
        .set({
          status: "waiting_user",
          assignedAdminId: ctx.user.id,
          lastMessageAt: now,
          lastMessageBy: "admin",
          updatedAt: now,
        })
        .where(eq(supportTickets.id, ticket.id));
      return { id: ticket.id, status: "waiting_user" as const };
    }),

  adminSetStatus: adminProcedure
    .input(z.object({ ticketId: z.string().uuid(), status: ticketStatus }))
    .mutation(async ({ ctx, input }) => {
      const ticket = await getAnyTicket(input.ticketId);
      const now = new Date();
      await getDb()
        .update(supportTickets)
        .set({
          status: input.status,
          assignedAdminId: ctx.user.id,
          closedAt: input.status === "closed" ? now : null,
          updatedAt: now,
        })
        .where(eq(supportTickets.id, ticket.id));
      return { id: ticket.id, status: input.status };
    }),

  adminSetPriority: adminProcedure
    .input(z.object({ ticketId: z.string().uuid(), priority: ticketPriority }))
    .mutation(async ({ ctx, input }) => {
      const ticket = await getAnyTicket(input.ticketId);
      const now = new Date();
      await getDb()
        .update(supportTickets)
        .set({
          priority: input.priority,
          assignedAdminId: ctx.user.id,
          updatedAt: now,
        })
        .where(eq(supportTickets.id, ticket.id));
      return { id: ticket.id, priority: input.priority };
    }),
});
