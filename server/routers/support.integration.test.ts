import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getSql } from "../db";
import { supportRouter } from "./support";

const sql = getSql();
let adminId = "";
let userId = "";
let outsiderId = "";
let shopId = "";

function context(user: { id: string; role: "user" | "admin"; email: string }) {
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.role === "admin" ? "Support admin" : "Utilisateur support",
      passwordHash: "not-used",
      loginMethod: "password",
      role: user.role,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      openId: null,
    },
    req: {} as never,
    res: {} as never,
  };
}

beforeEach(async () => {
  adminId = crypto.randomUUID();
  userId = crypto.randomUUID();
  outsiderId = crypto.randomUUID();
  shopId = crypto.randomUUID();
  await sql`
    INSERT INTO users (id, email, name, password_hash, role)
    VALUES
      (${adminId}, ${`admin-support-${adminId}@example.invalid`}, 'Support admin', 'not-used', 'admin'),
      (${userId}, ${`user-support-${userId}@example.invalid`}, 'Utilisateur support', 'not-used', 'user'),
      (${outsiderId}, ${`outsider-support-${outsiderId}@example.invalid`}, 'Autre utilisateur', 'not-used', 'user')
  `;
  await sql`
    INSERT INTO shops (id, name, slug, currency, country, created_by)
    VALUES (${shopId}, 'Boutique support', ${`boutique-support-${shopId.slice(0, 8)}`}, 'XAF', 'CMR', ${userId})
  `;
  await sql`INSERT INTO shop_members (shop_id, user_id, role) VALUES (${shopId}, ${userId}, 'owner')`;
});

afterEach(async () => {
  await sql`DELETE FROM support_messages WHERE author_id IN (${adminId}, ${userId}, ${outsiderId})`;
  await sql`DELETE FROM support_tickets WHERE user_id IN (${userId}, ${outsiderId})`;
  await sql`DELETE FROM shop_members WHERE shop_id = ${shopId}`;
  await sql`DELETE FROM shops WHERE id = ${shopId}`;
  await sql`DELETE FROM users WHERE id IN (${adminId}, ${userId}, ${outsiderId})`;
});

describe("espace de support avec Neon", () => {
  it("isole les demandes, permet une réponse support et conserve le cycle de clôture", async () => {
    const userCaller = supportRouter.createCaller(
      context({
        id: userId,
        role: "user",
        email: `user-support-${userId}@example.invalid`,
      })
    );
    const adminCaller = supportRouter.createCaller(
      context({
        id: adminId,
        role: "admin",
        email: `admin-support-${adminId}@example.invalid`,
      })
    );
    const outsiderCaller = supportRouter.createCaller(
      context({
        id: outsiderId,
        role: "user",
        email: `outsider-support-${outsiderId}@example.invalid`,
      })
    );

    const ticket = await userCaller.create({
      shopId,
      category: "technical",
      subject: "La caisse ne charge pas",
      message: "La page reste vide lorsque j’ouvre la caisse.",
    });
    expect(ticket.ticketNumber).toMatch(/^SUP-/);
    await expect(
      outsiderCaller.detail({ ticketId: ticket.id })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    const mine = await userCaller.mine({ status: "all" });
    expect(mine).toHaveLength(1);
    expect(mine[0]).toMatchObject({
      id: ticket.id,
      status: "open",
      priority: "medium",
      shopName: "Boutique support",
    });

    const adminList = await adminCaller.adminList({
      query: ticket.ticketNumber,
      status: "all",
      limit: 10,
    });
    expect(adminList).toHaveLength(1);
    await adminCaller.adminSetPriority({
      ticketId: ticket.id,
      priority: "high",
    });
    const highPriorityTickets = await adminCaller.adminList({
      query: ticket.ticketNumber,
      status: "all",
      priority: "high",
      limit: 10,
    });
    expect(highPriorityTickets).toHaveLength(1);
    expect(highPriorityTickets[0].priority).toBe("high");
    await adminCaller.adminSetStatus({
      ticketId: ticket.id,
      status: "in_progress",
    });
    await adminCaller.adminReply({
      ticketId: ticket.id,
      body: "Pouvez-vous confirmer si vous voyez un message d’erreur ?",
    });

    let detail = await userCaller.detail({ ticketId: ticket.id });
    expect(detail.ticket.status).toBe("waiting_user");
    expect(detail.messages.map(message => message.authorType)).toEqual([
      "user",
      "admin",
    ]);

    await userCaller.reply({
      ticketId: ticket.id,
      body: "Oui, la connexion est revenue après actualisation.",
    });
    detail = await userCaller.detail({ ticketId: ticket.id });
    expect(detail.ticket.status).toBe("open");
    expect(detail.messages).toHaveLength(3);

    await adminCaller.adminSetStatus({
      ticketId: ticket.id,
      status: "resolved",
    });
    await userCaller.close({ ticketId: ticket.id });
    detail = await userCaller.detail({ ticketId: ticket.id });
    expect(detail.ticket.status).toBe("closed");
  });
});
