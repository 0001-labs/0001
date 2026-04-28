import { query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./admin";

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("contracts").collect();
  },
});

export const byClient = query({
  args: { clientId: v.string() },
  handler: async (ctx, { clientId }) => {
    await requireAdmin(ctx);
    return await ctx.db
      .query("contracts")
      .withIndex("by_clientId", (q) => q.eq("clientId", clientId))
      .collect();
  },
});

export const getById = query({
  args: { id: v.id("contracts") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    return await ctx.db.get(id);
  },
});
