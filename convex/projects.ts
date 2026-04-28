import { query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./admin";
import { requirePortalUser } from "./portalAccess";

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const projects = await ctx.db.query("projects").collect();
    return projects.filter(isTopLevelProject);
  },
});

export const getById = query({
  args: { id: v.id("projects") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    return await ctx.db.get(id);
  },
});

export const byClient = query({
  args: { clientId: v.string() },
  handler: async (ctx, { clientId }) => {
    await requireAdmin(ctx);
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_clientId", (q) => q.eq("clientId", clientId))
      .collect();
    return projects.filter(isTopLevelProject);
  },
});

export const detail = query({
  args: { id: v.id("projects") },
  handler: async (ctx, { id }) => {
    const user = await requirePortalUser(ctx);
    const project = await ctx.db.get(id);
    if (!project) return null;

    if (!user.isAdmin && (!project.clientId || !user.clientIds.includes(project.clientId))) {
      throw new Error("Not authorized");
    }

    const projects = user.isAdmin
      ? await ctx.db.query("projects").collect()
      : (
          await Promise.all(
            user.clientIds.map((clientId) =>
              ctx.db
                .query("projects")
                .withIndex("by_clientId", (q) => q.eq("clientId", clientId))
                .collect(),
            ),
          )
        ).flat();

    return { project, projects };
  },
});

function isTopLevelProject(project: { name: string; raw: any }) {
  if (hasParentRelation(project.raw)) return false;
  return !/^(stage\s*\d+|qa\s+for\s+)/i.test(project.name.trim());
}

function hasParentRelation(raw: unknown) {
  const properties = raw as Record<string, any> | null | undefined;
  if (!properties) return false;

  return Object.entries(properties).some(([key, value]) => {
    const normalizedKey = key.toLowerCase();
    return (
      normalizedKey.includes("parent") &&
      Array.isArray(value?.relation) &&
      value.relation.length > 0
    );
  });
}
