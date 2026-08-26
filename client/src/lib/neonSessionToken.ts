type SessionResponse = { data?: { session?: unknown | null } | null } | null;
type TokenResponse = { data?: { token?: string | null } | null } | null;

export type NeonSessionClient = {
  getSession: () => Promise<SessionResponse>;
  token: () => Promise<TokenResponse>;
};

export async function getNeonSessionToken(client: NeonSessionClient, timeoutMs = 1_500) {
  try {
    const timeout = new Promise<null>(resolve => window.setTimeout(() => resolve(null), timeoutMs));
    const session = await Promise.race([client.getSession(), timeout]);
    if (!session?.data?.session) return null;

    const token = await client.token();
    return token?.data?.token ?? null;
  } catch {
    return null;
  }
}
