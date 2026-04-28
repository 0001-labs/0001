import { query } from "./_generated/server";
import { requireAdmin } from "./admin";

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const accounts = await ctx.db.query("accounts").collect();
    return accounts.sort((a, b) => {
      const role = (a.role ?? "").localeCompare(b.role ?? "");
      if (role !== 0) return role;
      return a.name.localeCompare(b.name);
    });
  },
});
