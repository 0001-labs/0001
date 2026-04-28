import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const enqueueFromMetaCallback = mutation({
  args: {
    confirmationCode: v.string(),
    metaUserId: v.string(),
    requestedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("dataDeletionRequests")
      .withIndex("by_confirmationCode", (q) => q.eq("confirmationCode", args.confirmationCode))
      .unique();

    if (existing) {
      return {
        id: existing._id,
        confirmationCode: existing.confirmationCode,
        status: existing.status,
      };
    }

    const id = await ctx.db.insert("dataDeletionRequests", {
      confirmationCode: args.confirmationCode,
      metaUserId: args.metaUserId,
      source: "meta_callback",
      status: "queued",
      requestedAt: args.requestedAt,
      updatedAt: args.requestedAt,
    });

    return {
      id,
      confirmationCode: args.confirmationCode,
      status: "queued",
    };
  },
});

export const getByConfirmationCode = query({
  args: {
    confirmationCode: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("dataDeletionRequests")
      .withIndex("by_confirmationCode", (q) => q.eq("confirmationCode", args.confirmationCode))
      .unique();
  },
});
