type SessionResponse = { data?: { session?: unknown | null } | null } | null;
type TokenResponse = { data?: { token?: string | null } | null } | null;
type NeonFetchOptions = { fetchOptions?: { credentials?: RequestCredentials } };

export type NeonSessionClient = {
  getSession: (options?: NeonFetchOptions) => Promise<SessionResponse>;
  token: (options?: NeonFetchOptions) => Promise<TokenResponse>;
};

export async function getNeonSessionToken(client: NeonSessionClient, timeoutMs = 1_500) {
  try {
    const timeout = new Promise<null>(resolve => window.setTimeout(() => resolve(null), timeoutMs));
    const session = await Promise.race([
      client.getSession({ fetchOptions: { credentials: "include" } }),
      timeout,
    ]);
    if (!session?.data?.session) return null;

    const token = await client.token({ fetchOptions: { credentials: "include" } });
    return token?.data?.token ?? null;
  } catch {
    return null;
  }
}
