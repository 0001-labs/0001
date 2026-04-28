import { query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./admin";

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("backOffice").collect();
  },
});

export const getById = query({
  args: { id: v.id("backOffice") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    return await ctx.db.get(id);
  },
});
