"use node";

import { Client } from "@notionhq/client";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import {
  findProp,
  getDateStart,
  getEmail,
  getFirstFileUrl,
  getCheckbox,
  getNumber,
  getPeopleEmails,
  getPeopleNames,
  getRelationIds,
  getRichText,
  getRollupEmail,
  getRollupRichText,
  getStatus,
  getSelect,
  getTitle,
  getUrl,
} from "./properties";

export const DB_IDS = {
  clients: "33389c2fcf7680539481e327caf5c8da",
  products: "2dc89c2fcf7680fa8ad1ec62ca745023",
} as const;

type DbKey = keyof typeof DB_IDS;
type OptionalDbKey = "accounts" | "backOffice" | "sows" | "contracts";
type SyncKey = DbKey | OptionalDbKey;

function notion(): Client {
  return new Client({ auth: process.env.NOTION_API_KEY });
}

async function queryAll(client: Client, databaseId: string): Promise<any[]> {
  const pages: any[] = [];
  let cursor: string | undefined = undefined;
  do {
    const res: any = await client.databases.query({
      database_id: databaseId,
      start_cursor: cursor,
      page_size: 100,
    });
    pages.push(...res.results);
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);
  return pages;
}

export const run = internalAction({
  args: { databaseId: v.optional(v.string()) },
  handler: async (ctx, { databaseId }) => {
    const client = notion();
    const dbIds = getConfiguredDbIds();
    const targets: Array<{ key: SyncKey; id: string }> = databaseId
      ? (() => {
          const key = Object.entries(dbIds).find(([, id]) => id === databaseId)?.[0] as
            | SyncKey
            | undefined;
          if (!key) throw new Error(`Unknown databaseId ${databaseId}`);
          return [{ key, id: databaseId }];
        })()
      : (Object.entries(dbIds) as Array<[SyncKey, string]>).map(([key, id]) => ({ key, id }));

    for (const { key, id } of targets) {
      const startedAt = Date.now();
      const errors: string[] = [];
      let added = 0;
      let updated = 0;

      try {
        const pages = await queryAll(client, id);
        const clientNameToNotionId =
          key === "products" ? await getClientNameToNotionId(client, dbIds.clients) : new Map<string, string>();
        const rows = await Promise.all(pages.map((p) => mapPage(client, key, p, clientNameToNotionId)));
        const counts = await ctx.runMutation(internal.notion.store.upsertBatch, {
          database: key,
          rows,
        });
        added = counts.added;
        updated = counts.updated;
      } catch (err) {
        errors.push(err instanceof Error ? err.message : String(err));
      }

      await ctx.runMutation(internal.notion.store.recordRun, {
        startedAt,
        finishedAt: Date.now(),
        database: key,
        added,
        updated,
        errors,
      });
    }
  },
});

function getConfiguredDbIds(): Record<DbKey, string> & Partial<Record<OptionalDbKey, string>> {
  const required = { ...DB_IDS };
  return {
    ...required,
    ...(process.env.NOTION_BACK_OFFICE_DATABASE_ID
      ? { backOffice: process.env.NOTION_BACK_OFFICE_DATABASE_ID }
      : {}),
    ...(process.env.NOTION_ACCOUNTS_DATABASE_ID ? { accounts: process.env.NOTION_ACCOUNTS_DATABASE_ID } : {}),
    ...(process.env.NOTION_SOWS_DATABASE_ID ? { sows: process.env.NOTION_SOWS_DATABASE_ID } : {}),
    ...(process.env.NOTION_CONTRACTS_DATABASE_ID
      ? { contracts: process.env.NOTION_CONTRACTS_DATABASE_ID }
      : {}),
  };
}

function firstRelationId(props: Record<string, any>): string | undefined {
  return getRelationIds(findProp(props, "Client", "Clients", "Relation"))[0];
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

async function getClientNameToNotionId(client: Client, databaseId: string): Promise<Map<string, string>> {
  const pages = await queryAll(client, databaseId);
  return new Map(
    pages.map((page) => {
      const props = page.properties ?? {};
      const name = getTitle(findProp(props, "Company name", "Name", "Client", "Company")) || "Untitled";
      return [normalizeName(name), page.id] as const;
    }),
  );
}

async function resolveClientRelationId(
  client: Client,
  props: Record<string, any>,
  clientNameToNotionId: Map<string, string>,
): Promise<string | undefined> {
  const relationId = firstRelationId(props);
  if (!relationId) return undefined;

  const page = await client.pages.retrieve({ page_id: relationId });
  const relationProps = (page as any).properties ?? {};
  const relationName =
    getTitle(findProp(relationProps, "Company name", "Name", "Client", "Company")) || "";

  return clientNameToNotionId.get(normalizeName(relationName)) ?? relationId;
}

type ProjectContentBlock =
  | { type: "heading_2"; text: string }
  | { type: "paragraph"; text: string; links: Array<{ text: string; href: string }> }
  | { type: "child_page"; title: string; id: string; content: ProjectContentBlock[] }
  | { type: "child_database"; title: string; id: string }
  | { type: "to_do"; text: string; checked: boolean }
  | { type: "table"; rows: string[][] }
  | { type: "divider" };

async function getProjectContent(client: Client, pageId: string, depth = 0): Promise<ProjectContentBlock[]> {
  const children = await listBlockChildren(client, pageId);
  const blocks: ProjectContentBlock[] = [];

  for (const block of children) {
    switch (block.type) {
      case "heading_2":
        blocks.push({ type: "heading_2", text: richTextPlain(block.heading_2?.rich_text) });
        break;
      case "paragraph":
        blocks.push({
          type: "paragraph",
          text: richTextPlain(block.paragraph?.rich_text),
          links: richTextLinks(block.paragraph?.rich_text),
        });
        break;
      case "child_page":
        blocks.push({
          type: "child_page",
          title: block.child_page?.title ?? "Untitled",
          id: block.id,
          content: depth < 2 && block.has_children ? await getProjectContent(client, block.id, depth + 1) : [],
        });
        break;
      case "child_database":
        blocks.push({ type: "child_database", title: block.child_database?.title ?? "Untitled", id: block.id });
        break;
      case "to_do":
        blocks.push({
          type: "to_do",
          text: richTextPlain(block.to_do?.rich_text),
          checked: Boolean(block.to_do?.checked),
        });
        break;
      case "table": {
        const rows = await listBlockChildren(client, block.id);
        blocks.push({
          type: "table",
          rows: rows
            .filter((row) => row.type === "table_row")
            .map((row) =>
              (row.table_row?.cells ?? []).map((cell: any[]) => richTextPlain(cell)),
            ),
        });
        break;
      }
      case "divider":
        blocks.push({ type: "divider" });
        break;
    }
  }

  return blocks.filter((block) => block.type !== "paragraph" || block.text || block.links.length > 0);
}

async function listBlockChildren(client: Client, blockId: string): Promise<any[]> {
  const blocks: any[] = [];
  let cursor: string | undefined = undefined;
  do {
    const res: any = await client.blocks.children.list({
      block_id: blockId,
      start_cursor: cursor,
      page_size: 100,
    });
    blocks.push(...res.results);
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);
  return blocks;
}

function richTextPlain(items: any[] | undefined): string {
  return Array.isArray(items) ? items.map((item) => item.plain_text ?? "").join("") : "";
}

function richTextLinks(items: any[] | undefined): Array<{ text: string; href: string }> {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => ({
      text: item.plain_text ?? "",
      href: item.href ?? item.text?.link?.url ?? "",
    }))
    .filter((item) => item.text && item.href);
}

async function mapPage(client: Client, key: SyncKey, page: any, clientNameToNotionId: Map<string, string>): Promise<{
  notionId: string;
  name: string;
  fields: Record<string, any>;
  raw: any;
}> {
  const props = page.properties ?? {};

  if (key === "products") {
    const clientId = await resolveClientRelationId(client, props, clientNameToNotionId);
    const content = await getProjectContent(client, page.id);
    return {
      notionId: page.id,
      name: getTitle(findProp(props, "Name")) || "Untitled",
      fields: {
        clientId,
        content,
        users: getNumber(findProp(props, "Users")),
        retention: getNumber(findProp(props, "Retention")),
        status: getStatus(findProp(props, "Status")),
        website: getRichText(findProp(props, "Website")),
        github: getUrl(findProp(props, "Github")),
        active: getCheckbox(findProp(props, "Include on website")),
      },
      raw: props,
    };
  }

  if (key === "sows") {
    return {
      notionId: page.id,
      name: getTitle(findProp(props, "Name", "Title", "SOW")) || "Untitled",
      fields: {
        clientId: firstRelationId(props),
        status: getStatus(findProp(props, "Status")) ?? getSelect(findProp(props, "Status")),
        value: getNumber(findProp(props, "Value", "Amount", "Fee")),
        signedAt: getDateStart(findProp(props, "Signed", "Signed date", "Signed at")),
        url: getUrl(findProp(props, "URL", "Link")) ?? getFirstFileUrl(findProp(props, "Files")),
      },
      raw: props,
    };
  }

  if (key === "contracts") {
    return {
      notionId: page.id,
      name: getTitle(findProp(props, "Name", "Title", "Contract")) || "Untitled",
      fields: {
        clientId: firstRelationId(props),
        status: getStatus(findProp(props, "Status")) ?? getSelect(findProp(props, "Status")),
        signedAt: getDateStart(findProp(props, "Signed", "Signed date", "Signed at")),
        url: getUrl(findProp(props, "URL", "Link")) ?? getFirstFileUrl(findProp(props, "Files")),
      },
      raw: props,
    };
  }

  if (key === "clients") {
    return {
      notionId: page.id,
      name: getTitle(findProp(props, "Company name", "Name", "Client", "Company")) || "Untitled",
      fields: {
        status: getStatus(findProp(props, "Status")),
        stage: getSelect(findProp(props, "Lead Source", "Stage", "Pipeline")) ?? getStatus(findProp(props, "Stage", "Pipeline")),
        company: getTitle(findProp(props, "Company name", "Name", "Client", "Company")),
        email:
          getEmail(findProp(props, "Email")) ??
          getRollupEmail(findProp(props, "Email")) ??
          getRichText(findProp(props, "Email")),
        contact: getRollupRichText(findProp(props, "Contact")) || getRichText(findProp(props, "Contact")),
        market: getRollupRichText(findProp(props, "Market")) || getSelect(findProp(props, "Market")),
        startedAt:
          getDateStart(findProp(props, "Started", "Start date", "Start")) ??
          (Date.parse(page.created_time ?? "") || undefined),
        lastUpdatedAt: Date.parse(page.last_edited_time ?? "") || undefined,
      },
      raw: props,
    };
  }

  if (key === "accounts") {
    const personEmails = getPeopleEmails(findProp(props, "Person", "User", "People"));
    const personNames = getPeopleNames(findProp(props, "Person", "User", "People"));
    const email =
      getEmail(findProp(props, "Email", "E-mail")) ??
      personEmails[0] ??
      getRichText(findProp(props, "Email", "E-mail"));
    const name =
      getTitle(findProp(props, "Name", "Person", "User", "Account")) ??
      getRichText(findProp(props, "Name", "Person", "User", "Account")) ??
      personNames[0] ??
      email ??
      "Untitled";

    return {
      notionId: page.id,
      name,
      fields: {
        clientId: firstRelationId(props),
        email,
        role:
          getStatus(findProp(props, "Role", "Access", "Type", "Permissions")) ??
          getSelect(findProp(props, "Role", "Access", "Type", "Permissions")),
        status:
          getStatus(findProp(props, "Status", "State")) ??
          getSelect(findProp(props, "Status", "State")),
      },
      raw: props,
    };
  }

  if (key === "backOffice") {
    return {
      notionId: page.id,
      name: getTitle(findProp(props, "Name", "Title")) || "Untitled",
      fields: {
        type: getSelect(findProp(props, "Type", "Category")) ?? getStatus(findProp(props, "Type", "Category")),
        status: getStatus(findProp(props, "Status")) ?? getSelect(findProp(props, "Status")),
      },
      raw: props,
    };
  }

  // Optional back-office mapping.
  return {
    notionId: page.id,
    name: getTitle(findProp(props, "Name", "Title")) || "Untitled",
    fields: {
      status: getStatus(findProp(props, "Status")) ?? getSelect(findProp(props, "Status")),
      url: getUrl(findProp(props, "URL", "Link")) ?? getFirstFileUrl(findProp(props, "Files")),
      relations: getRelationIds(findProp(props, "Client", "Relation")),
    },
    raw: props,
  };
}
