// Parsers for Notion property payloads. Duplicated in shape from
// scripts/fetch-notion.ts because the build-time script runs under Bun
// and this module runs in the Convex runtime — they cannot share code
// across that boundary yet. Unify in a future refactor.

type AnyProp = Record<string, any> | undefined | null;

export function getTitle(prop: AnyProp): string {
  if (!prop?.title || !Array.isArray(prop.title)) return "";
  return prop.title.map((t: any) => t.plain_text ?? "").join("");
}

export function getRichText(prop: AnyProp): string {
  if (!prop?.rich_text || !Array.isArray(prop.rich_text)) return "";
  return prop.rich_text.map((t: any) => t.plain_text ?? "").join("");
}

export function getStatus(prop: AnyProp): string | undefined {
  return prop?.status?.name ?? undefined;
}

export function getSelect(prop: AnyProp): string | undefined {
  return prop?.select?.name ?? undefined;
}

export function getMultiSelect(prop: AnyProp): string[] {
  if (!prop?.multi_select || !Array.isArray(prop.multi_select)) return [];
  return prop.multi_select.map((s: any) => s.name).filter(Boolean);
}

export function getNumber(prop: AnyProp): number | undefined {
  const n = prop?.number;
  return typeof n === "number" ? n : undefined;
}

export function getCheckbox(prop: AnyProp): boolean {
  return Boolean(prop?.checkbox);
}

export function getUrl(prop: AnyProp): string | undefined {
  return typeof prop?.url === "string" ? prop.url : undefined;
}

export function getEmail(prop: AnyProp): string | undefined {
  return typeof prop?.email === "string" ? prop.email : undefined;
}

export function getPeopleEmails(prop: AnyProp): string[] {
  if (!prop?.people || !Array.isArray(prop.people)) return [];
  return prop.people
    .map((person: any) => person?.person?.email)
    .filter((email: unknown): email is string => typeof email === "string" && email.length > 0);
}

export function getPeopleNames(prop: AnyProp): string[] {
  if (!prop?.people || !Array.isArray(prop.people)) return [];
  return prop.people
    .map((person: any) => person?.name)
    .filter((name: unknown): name is string => typeof name === "string" && name.length > 0);
}

export function getRollupEmail(prop: AnyProp): string | undefined {
  if (prop?.rollup?.type !== "array" || !Array.isArray(prop.rollup.array)) return undefined;
  for (const item of prop.rollup.array) {
    if (typeof item?.email === "string" && item.email) return item.email;
  }
  return undefined;
}

export function getRollupRichText(prop: AnyProp): string {
  if (prop?.rollup?.type !== "array" || !Array.isArray(prop.rollup.array)) return "";
  return prop.rollup.array
    .map((item: any) => {
      if (Array.isArray(item?.rich_text)) {
        return item.rich_text.map((t: any) => t.plain_text ?? "").join("");
      }
      if (item?.select?.name) return item.select.name;
      if (typeof item?.email === "string") return item.email;
      return "";
    })
    .filter(Boolean)
    .join(", ");
}

export function getDateStart(prop: AnyProp): number | undefined {
  const raw = prop?.date?.start;
  if (!raw) return undefined;
  const n = Date.parse(raw);
  return Number.isFinite(n) ? n : undefined;
}

export function getRelationIds(prop: AnyProp): string[] {
  if (!prop?.relation || !Array.isArray(prop.relation)) return [];
  return prop.relation.map((r: any) => r.id).filter(Boolean);
}

export function getFirstFileUrl(prop: AnyProp): string | undefined {
  const f = prop?.files?.[0];
  if (!f) return undefined;
  return f.external?.url ?? f.file?.url ?? undefined;
}

export function findProp(props: Record<string, any>, ...names: string[]): any | undefined {
  const lower = Object.fromEntries(Object.entries(props).map(([k, v]) => [k.toLowerCase(), v]));
  for (const name of names) {
    const hit = lower[name.toLowerCase()];
    if (hit !== undefined) return hit;
  }
  return undefined;
}
