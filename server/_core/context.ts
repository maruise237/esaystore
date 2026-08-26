import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { getAuthenticatedUser } from "../auth";
import { getNeonAuthenticatedUser } from "../neonAuth";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
  const neonUser = await getNeonAuthenticatedUser(opts.req);
  if (neonUser) return { req: opts.req, res: opts.res, user: neonUser };

  const user = await getAuthenticatedUser(opts.req);
  return { req: opts.req, res: opts.res, user };
}
