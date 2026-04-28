import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { resolvePortalAccess } from "./portalAccess";
import { normalizeEmail } from "../shared/adminEmails";

export const whoami = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    const email = normalizeEmail((user as { email?: string | null } | null)?.email);
    const access = await resolvePortalAccess(ctx, email);

    return {
      userId: String(userId),
      email,
      ...access,
    };
  },
});
