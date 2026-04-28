import { mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireAdmin } from "./admin";

export const run = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    await ctx.scheduler.runAfter(0, internal.notion.pull.run, {});
    return { ok: true };
  },
});
