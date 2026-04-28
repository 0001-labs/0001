import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { matchesAdminEmail, requireSignedIn } from "./admin";
import { normalizeEmail } from "../shared/adminEmails";

type DbCtx = QueryCtx | MutationCtx;
type ClientRole = "Client" | "Client admin";

export type PortalAccess = {
  isAdmin: boolean;
  isClientAdmin: boolean;
  clientIds: string[];
  clientRoles: Array<{ clientId: string; role: ClientRole; source: "email" | "domain" | "grant" | "account" }>;
};

export async function requirePortalUser(ctx: QueryCtx): Promise<{
  userId: string;
  email: string;
  isAdmin: boolean;
  isClientAdmin: boolean;
  clientIds: string[];
  clientRoles: PortalAccess["clientRoles"];
}> {
  const { userId, email } = await requireSignedIn(ctx);
  const access = await resolvePortalAccess(ctx, email);
  return { userId, email, ...access };
}

export const canRequestOtp = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    return await canEmailAccessPortal(ctx, email);
  },
});

export const settings = query({
  args: {},
  handler: async (ctx) => {
    const { email } = await requireSignedIn(ctx);
    const access = await resolvePortalAccess(ctx, email);
    const adminClientIds = access.clientRoles
      .filter((role) => role.role === "Client admin")
      .map((role) => role.clientId);

    if (!access.isAdmin && adminClientIds.length === 0) {
      return { clients: [] };
    }

    const clients = access.isAdmin
      ? await ctx.db.query("clients").collect()
      : await collectClientsByNotionIds(ctx, adminClientIds);

    const clientSettings = await Promise.all(
      clients.map(async (client) => {
        const accounts = await ctx.db
          .query("accounts")
          .withIndex("by_clientId", (q) => q.eq("clientId", client.notionId))
          .collect();
        const grants = (
          await ctx.db
            .query("portalAccessGrants")
            .withIndex("by_clientId", (q) => q.eq("clientId", client.notionId))
            .collect()
        ).sort((a, b) => a.emailNormalized.localeCompare(b.emailNormalized));

        return {
          client,
          accounts: accounts.sort((a, b) => (a.emailNormalized ?? a.name).localeCompare(b.emailNormalized ?? b.name)),
          grants,
        };
      }),
    );

    return { clients: clientSettings };
  },
});

export const updateClientDomain = mutation({
  args: {
    clientId: v.string(),
    allowedDomain: v.string(),
    domainAccessEnabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireClientAdminFor(ctx, args.clientId);
    const client = await findClientByNotionId(ctx, args.clientId);
    if (!client) throw new Error("Client not found");

    const allowedDomain = normalizeDomain(args.allowedDomain);
    if (args.domainAccessEnabled && !allowedDomain) {
      throw new Error("A valid domain is required to enable domain access");
    }

    await ctx.db.patch(client._id, {
      allowedDomain,
      domainAccessEnabled: args.domainAccessEnabled,
    });
  },
});

export const addGrant = mutation({
  args: {
    clientId: v.string(),
    email: v.string(),
    role: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const requester = await requireClientAdminFor(ctx, args.clientId);
    const client = await findClientByNotionId(ctx, args.clientId);
    if (!client) throw new Error("Client not found");

    const emailNormalized = normalizeEmail(args.email);
    if (!emailNormalized || !emailNormalized.includes("@")) {
      throw new Error("A valid email is required");
    }

    const domain = emailDomain(emailNormalized);
    const allowedDomain = normalizeDomain(client.allowedDomain) ?? emailDomain(client.emailNormalized ?? client.email);
    if (!domain || !allowedDomain || domain !== allowedDomain) {
      throw new Error("Invited users must use the client's allowed domain");
    }

    const role = normalizeRole(args.role);
    if (role === "Client admin" && !requester.isAdmin) {
      throw new Error("Only the system admin can create client admin grants");
    }

    const existing = await ctx.db
      .query("portalAccessGrants")
      .withIndex("by_client_email", (q) => q.eq("clientId", args.clientId).eq("emailNormalized", emailNormalized))
      .first();
    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        role,
        active: true,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("portalAccessGrants", {
      clientId: args.clientId,
      emailNormalized,
      role,
      active: true,
      createdBy: requester.email,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const setGrantActive = mutation({
  args: {
    grantId: v.id("portalAccessGrants"),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    const grant = await ctx.db.get(args.grantId);
    if (!grant) throw new Error("Access grant not found");
    await requireClientAdminFor(ctx, grant.clientId);
    await ctx.db.patch(args.grantId, { active: args.active, updatedAt: Date.now() });
  },
});

export async function canEmailAccessPortal(ctx: QueryCtx, email: string): Promise<boolean> {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  if (matchesAdminEmail(normalized)) return true;
  const access = await resolvePortalAccess(ctx, normalized);
  return access.clientIds.length > 0;
}

export async function resolvePortalAccess(ctx: DbCtx, email: string): Promise<PortalAccess> {
  const normalized = normalizeEmail(email);
  const isAdmin = matchesAdminEmail(normalized);
  if (!normalized || isAdmin) {
    return { isAdmin, isClientAdmin: false, clientIds: [], clientRoles: [] };
  }

  const roles = new Map<string, PortalAccess["clientRoles"][number]>();
  const assign = (clientId: string | undefined, role: ClientRole, source: PortalAccess["clientRoles"][number]["source"]) => {
    if (!clientId) return;
    const existing = roles.get(clientId);
    if (!existing || roleRank(role) > roleRank(existing.role)) {
      roles.set(clientId, { clientId, role, source });
    }
  };

  const exactClients = await ctx.db
    .query("clients")
    .withIndex("by_emailNormalized", (q) => q.eq("emailNormalized", normalized))
    .collect();
  const accounts = await accountsForEmail(ctx, normalized);
  for (const client of exactClients) {
    const account = accounts.find((row) => row.clientId === client.notionId);
    assign(client.notionId, isClientAdminRole(account?.role) ? "Client admin" : "Client", account ? "account" : "email");
  }

  for (const account of accounts) {
    assign(account.clientId, normalizeRole(account.role), "account");
  }

  const grants = await ctx.db
    .query("portalAccessGrants")
    .withIndex("by_emailNormalized", (q) => q.eq("emailNormalized", normalized))
    .collect();
  for (const grant of grants) {
    if (grant.active) assign(grant.clientId, normalizeRole(grant.role), "grant");
  }

  const domain = emailDomain(normalized);
  if (domain) {
    const domainClients = await ctx.db
      .query("clients")
      .withIndex("by_allowedDomain", (q) => q.eq("allowedDomain", domain))
      .collect();
    for (const client of domainClients) {
      if (client.domainAccessEnabled) assign(client.notionId, "Client", "domain");
      const account = accounts.find((row) => row.clientId === client.notionId);
      if (account) assign(client.notionId, normalizeRole(account.role), "account");
    }
  }

  const clientRoles = [...roles.values()];
  return {
    isAdmin: false,
    isClientAdmin: clientRoles.some((role) => role.role === "Client admin"),
    clientIds: clientRoles.map((role) => role.clientId),
    clientRoles,
  };
}

async function requireClientAdminFor(ctx: MutationCtx, clientId: string): Promise<{ email: string; isAdmin: boolean }> {
  const { email } = await requireSignedIn(ctx);
  if (matchesAdminEmail(email)) return { email, isAdmin: true };

  const access = await resolvePortalAccess(ctx, email);
  if (!access.clientRoles.some((role) => role.clientId === clientId && role.role === "Client admin")) {
    throw new Error("Not authorized");
  }
  return { email, isAdmin: false };
}

async function collectClientsByNotionIds(ctx: QueryCtx, notionIds: string[]) {
  const unique = [...new Set(notionIds)];
  const rows = await Promise.all(unique.map((notionId) => findClientByNotionId(ctx, notionId)));
  return rows.filter((row) => row !== null);
}

async function findClientByNotionId(ctx: DbCtx, notionId: string) {
  return await ctx.db
    .query("clients")
    .withIndex("by_notionId", (q) => q.eq("notionId", notionId))
    .first();
}

async function accountsForEmail(ctx: DbCtx, emailNormalized: string) {
  return await ctx.db
    .query("accounts")
    .withIndex("by_emailNormalized", (q) => q.eq("emailNormalized", emailNormalized))
    .collect();
}

function isClientAdminRole(role: string | undefined) {
  return normalizeRoleKey(role) === "clientadmin";
}

function normalizeRole(role: string | undefined): ClientRole {
  return isClientAdminRole(role) ? "Client admin" : "Client";
}

function normalizeRoleKey(role: string | undefined) {
  return (role ?? "").trim().toLowerCase().replace(/[^a-z]/g, "");
}

function roleRank(role: ClientRole) {
  return role === "Client admin" ? 2 : 1;
}

function emailDomain(email: string | undefined) {
  const normalized = normalizeEmail(email);
  const at = normalized.lastIndexOf("@");
  return at === -1 ? undefined : normalizeDomain(normalized.slice(at + 1));
}

function normalizeDomain(value: string | undefined) {
  const normalized = (value ?? "").trim().toLowerCase().replace(/^@+/, "");
  return normalized.includes(".") ? normalized : undefined;
}
