import { v } from "convex/values";
import { query, type QueryCtx, type MutationCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { isAdminEmail as matchesAdminEmail, normalizeEmail } from "../shared/adminEmails";

type DbCtx = QueryCtx | MutationCtx;

export { matchesAdminEmail };

export async function requireAdmin(ctx: DbCtx): Promise<{ userId: string; email: string }> {
  const { userId, email } = await requireSignedIn(ctx);

  if (!matchesAdminEmail(email)) {
    throw new Error("Not authorized");
  }

  return { userId: String(userId), email };
}

export async function requireSignedIn(ctx: DbCtx): Promise<{ userId: string; email: string }> {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Not signed in");
  }

  const user = await ctx.db.get(userId);
  const email = normalizeEmail((user as { email?: string | null } | null)?.email);

  if (!email) {
    throw new Error("Signed-in user has no email");
  }

  return { userId: String(userId), email };
}

export async function getClientNotionIdsForEmail(ctx: QueryCtx, email: string): Promise<string[]> {
  const normalized = normalizeEmail(email);
  if (!normalized) return [];

  const clients = await ctx.db
    .query("clients")
    .withIndex("by_emailNormalized", (q) => q.eq("emailNormalized", normalized))
    .collect();

  return clients.map((client) => client.notionId);
}

export async function requirePortalUser(ctx: QueryCtx): Promise<{
  userId: string;
  email: string;
  isAdmin: boolean;
  clientIds: string[];
}> {
  const { userId, email } = await requireSignedIn(ctx);
  const isAdmin = matchesAdminEmail(email);
  const clientIds = isAdmin ? [] : await getClientNotionIdsForEmail(ctx, email);
  return { userId, email, isAdmin, clientIds };
}

// Public helper used by the Link sign-in UI to avoid sending OTP codes to
// addresses that cannot access the admin surface anyway.
export const isAdminEmail = query({
  args: { email: v.string() },
  handler: async (_ctx, args) => matchesAdminEmail(args.email),
});
