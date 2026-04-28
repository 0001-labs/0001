import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { normalizeEmail } from "../../shared/adminEmails";

type DbKey = keyof typeof import("./pull").DB_IDS | "accounts" | "backOffice" | "sows" | "contracts";

export const upsertBatch = internalMutation({
  args: {
    database: v.string(),
    rows: v.array(
      v.object({
        notionId: v.string(),
        name: v.string(),
        fields: v.any(),
        raw: v.any(),
      }),
    ),
  },
  handler: async (ctx, { database, rows }) => {
    let added = 0;
    let updated = 0;

    const table = tableFor(database as DbKey);

    for (const row of rows) {
      const existing = await ctx.db
        .query(table)
        .withIndex("by_notionId", (q) => q.eq("notionId", row.notionId))
        .first();

      const doc = projectRow(database as DbKey, row);

      if (existing) {
        await ctx.db.patch(existing._id, doc as any);
        updated++;
      } else {
        await ctx.db.insert(table, doc as any);
        added++;
      }
    }

    const syncedNotionIds = new Set(rows.map((row) => row.notionId));
    const existingRows = await ctx.db.query(table).collect();
    for (const existing of existingRows) {
      if (!syncedNotionIds.has(existing.notionId)) {
        await ctx.db.delete(existing._id);
      }
    }

    return { added, updated };
  },
});

export const recordRun = internalMutation({
  args: {
    startedAt: v.number(),
    finishedAt: v.number(),
    database: v.string(),
    added: v.number(),
    updated: v.number(),
    errors: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("syncRuns", args);
  },
});

function tableFor(
  key: DbKey,
): "accounts" | "clients" | "backOffice" | "projects" | "sows" | "contracts" {
  switch (key) {
    case "accounts":
      return "accounts";
    case "clients":
      return "clients";
    case "backOffice":
      return "backOffice";
    case "products":
      return "projects";
    case "sows":
      return "sows";
    case "contracts":
      return "contracts";
  }
}

function projectRow(
  key: DbKey,
  row: { notionId: string; name: string; fields: Record<string, any>; raw: any },
): Record<string, any> {
  const base = { notionId: row.notionId, raw: row.raw };
  if (key === "clients") {
    return {
      ...base,
      name: row.name,
      status: row.fields.status,
      stage: row.fields.stage,
      company: row.fields.company,
      email: row.fields.email,
      emailNormalized: normalizeEmail(row.fields.email),
      startedAt: row.fields.startedAt,
      lastUpdatedAt: row.fields.lastUpdatedAt,
    };
  }
  if (key === "accounts") {
    return {
      ...base,
      name: row.name,
      clientId: row.fields.clientId,
      email: row.fields.email,
      emailNormalized: normalizeEmail(row.fields.email),
      role: row.fields.role,
      status: row.fields.status,
    };
  }
  if (key === "products") {
    return {
      ...base,
      name: row.name,
      clientId: row.fields.clientId,
      status: row.fields.status,
      users: row.fields.users,
      retention: row.fields.retention,
      website: row.fields.website,
      github: row.fields.github,
      active: row.fields.active ?? true,
      content: row.fields.content,
    };
  }
  if (key === "sows") {
    return {
      ...base,
      clientId: row.fields.clientId,
      title: row.name,
      status: row.fields.status,
      value: row.fields.value,
      signedAt: row.fields.signedAt,
      url: row.fields.url,
    };
  }
  if (key === "contracts") {
    return {
      ...base,
      clientId: row.fields.clientId,
      title: row.name,
      status: row.fields.status,
      signedAt: row.fields.signedAt,
      url: row.fields.url,
    };
  }
  if (key === "backOffice") {
    return {
      ...base,
      title: row.name,
      type: row.fields.type,
      status: row.fields.status,
    };
  }
  return base;
}
