import { query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import { requirePortalUser } from "./portalAccess";

export const dashboard = query({
  args: {},
  handler: async (ctx) => {
    const user = await requirePortalUser(ctx);

    if (user.isAdmin) {
      return {
        email: user.email,
        isAdmin: true,
        isClientAdmin: user.isClientAdmin,
        clients: [],
        projects: [],
        sows: [],
        contracts: [],
      };
    }

    if (user.clientIds.length === 0) {
      return {
        email: user.email,
        isAdmin: false,
        isClientAdmin: false,
        clients: [],
        projects: [],
        sows: [],
        contracts: [],
      };
    }

    const [clients, projects, sows, contracts] = await Promise.all([
      collectClientsByNotionIds(ctx, user.clientIds),
      collectProjects(ctx, user.clientIds),
      collectSows(ctx, user.clientIds),
      collectContracts(ctx, user.clientIds),
    ]);

    return {
      email: user.email,
      isAdmin: false,
      isClientAdmin: user.isClientAdmin,
      clients,
      projects,
      sows,
      contracts,
    };
  },
});

async function collectClientsByNotionIds(
  ctx: QueryCtx,
  notionIds: string[],
) {
  const rows = await Promise.all(
    notionIds.map((notionId) =>
      ctx.db
        .query("clients")
        .withIndex("by_notionId", (q) => q.eq("notionId", notionId))
        .first(),
    ),
  );
  return rows.filter((row) => row !== null);
}

async function collectProjects(ctx: QueryCtx, clientIds: string[]) {
  const rows = await Promise.all(
    clientIds.map((clientId) =>
      ctx.db
        .query("projects")
        .withIndex("by_clientId", (q) => q.eq("clientId", clientId))
        .collect(),
    ),
  );
  return rows.flat().filter(isTopLevelProject);
}

async function collectSows(ctx: QueryCtx, clientIds: string[]) {
  const rows = await Promise.all(
    clientIds.map((clientId) =>
      ctx.db
        .query("sows")
        .withIndex("by_clientId", (q) => q.eq("clientId", clientId))
        .collect(),
    ),
  );
  return rows.flat();
}

async function collectContracts(ctx: QueryCtx, clientIds: string[]) {
  const rows = await Promise.all(
    clientIds.map((clientId) =>
      ctx.db
        .query("contracts")
        .withIndex("by_clientId", (q) => q.eq("clientId", clientId))
        .collect(),
    ),
  );
  return rows.flat();
}

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
