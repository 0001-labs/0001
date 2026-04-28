import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  clients: defineTable({
    notionId: v.string(),
    name: v.string(),
    status: v.optional(v.string()),
    stage: v.optional(v.string()),
    company: v.optional(v.string()),
    email: v.optional(v.string()),
    emailNormalized: v.optional(v.string()),
    allowedDomain: v.optional(v.string()),
    domainAccessEnabled: v.optional(v.boolean()),
    startedAt: v.optional(v.number()),
    lastUpdatedAt: v.optional(v.number()),
    raw: v.any(),
  })
    .index("by_notionId", ["notionId"])
    .index("by_emailNormalized", ["emailNormalized"])
    .index("by_allowedDomain", ["allowedDomain"])
    .index("by_status", ["status"]),

  projects: defineTable({
    notionId: v.string(),
    name: v.string(),
    clientId: v.optional(v.string()),
    status: v.optional(v.string()),
    users: v.optional(v.number()),
    retention: v.optional(v.number()),
    website: v.optional(v.string()),
    github: v.optional(v.string()),
    active: v.optional(v.boolean()),
    content: v.optional(v.any()),
    raw: v.any(),
  })
    .index("by_notionId", ["notionId"])
    .index("by_clientId", ["clientId"]),

  sows: defineTable({
    notionId: v.string(),
    clientId: v.optional(v.string()),
    title: v.string(),
    status: v.optional(v.string()),
    value: v.optional(v.number()),
    signedAt: v.optional(v.number()),
    url: v.optional(v.string()),
    raw: v.any(),
  })
    .index("by_notionId", ["notionId"])
    .index("by_clientId", ["clientId"]),

  contracts: defineTable({
    notionId: v.string(),
    clientId: v.optional(v.string()),
    title: v.string(),
    status: v.optional(v.string()),
    signedAt: v.optional(v.number()),
    url: v.optional(v.string()),
    raw: v.any(),
  })
    .index("by_notionId", ["notionId"])
    .index("by_clientId", ["clientId"]),

  backOffice: defineTable({
    notionId: v.string(),
    type: v.optional(v.string()),
    title: v.string(),
    status: v.optional(v.string()),
    raw: v.any(),
  }).index("by_notionId", ["notionId"]),

  accounts: defineTable({
    notionId: v.string(),
    name: v.string(),
    clientId: v.optional(v.string()),
    email: v.optional(v.string()),
    emailNormalized: v.optional(v.string()),
    role: v.optional(v.string()),
    status: v.optional(v.string()),
    raw: v.any(),
  })
    .index("by_notionId", ["notionId"])
    .index("by_clientId", ["clientId"])
    .index("by_emailNormalized", ["emailNormalized"])
    .index("by_role", ["role"]),

  portalAccessGrants: defineTable({
    clientId: v.string(),
    emailNormalized: v.string(),
    role: v.string(),
    active: v.boolean(),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clientId", ["clientId"])
    .index("by_emailNormalized", ["emailNormalized"])
    .index("by_client_email", ["clientId", "emailNormalized"]),

  syncRuns: defineTable({
    startedAt: v.number(),
    finishedAt: v.optional(v.number()),
    database: v.string(),
    added: v.number(),
    updated: v.number(),
    errors: v.array(v.string()),
  }).index("by_startedAt", ["startedAt"]),

  dataDeletionRequests: defineTable({
    confirmationCode: v.string(),
    metaUserId: v.string(),
    source: v.union(v.literal("meta_callback")),
    status: v.union(
      v.literal("queued"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    requestedAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_confirmationCode", ["confirmationCode"])
    .index("by_metaUserId", ["metaUserId"])
    .index("by_status", ["status"]),
});
