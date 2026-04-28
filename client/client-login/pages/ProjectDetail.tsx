import { useQuery } from "convex/react";
import type { CSSProperties, ReactNode } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { PropertyTable } from "../components/PropertyTable";

type ProjectContentBlock =
  | { type: "heading_2"; text: string }
  | { type: "paragraph"; text: string; links?: Array<{ text: string; href: string }> }
  | { type: "child_page"; title: string; id: string; content?: ProjectContentBlock[] }
  | { type: "child_database"; title: string; id: string }
  | { type: "to_do"; text: string; checked: boolean }
  | { type: "table"; rows: string[][] }
  | { type: "divider" };

type ProjectSummary = {
  _id: string;
  notionId: string;
  name: string;
  status?: string;
};

type ProjectDetailDoc = ProjectSummary & {
  raw: Record<string, any>;
  content?: ProjectContentBlock[];
};

type ProjectSection = {
  title: string;
  blocks: ProjectContentBlock[];
};

type ProjectTocItem = {
  id: string;
  title: string;
};

export function ProjectDetail({ id, pageId }: { id: string; pageId?: string }) {
  const detail = useQuery(api.projects.detail, { id: id as Id<"projects"> });
  const me = useQuery(api.users.whoami);

  if (detail === undefined) {
    return (
      <ProjectFrame title="Loading..." email={me?.email}>
        <p className="project-dossier__muted">Loading project...</p>
      </ProjectFrame>
    );
  }

  if (detail === null) {
    return (
      <ProjectFrame title="Project not found" email={me?.email}>
        <p className="project-dossier__muted">Project not found.</p>
      </ProjectFrame>
    );
  }

  const project = detail.project as ProjectDetailDoc;
  const projectContent = normalizeContent(project.content);
  const childPage = pageId ? findChildPage(projectContent, pageId) : undefined;
  const content = childPage ? normalizeContent(childPage.content) : projectContent;
  const title = childPage?.title ?? project.name;

  if (content.length === 0) {
    return (
      <ProjectFrame
        title={title}
        status={project.status}
        delivery={formatDelivery(project.raw)}
        email={me?.email}
      >
        {childPage ? (
          <p className="project-dossier__muted">This Notion page has no synced body content yet.</p>
        ) : (
          <FallbackProjectDetail project={project} projects={detail.projects as ProjectSummary[]} />
        )}
      </ProjectFrame>
    );
  }

  const footerLinks = extractFooterLinks(content);
  const sections = groupSections(removeFooterBlocks(content));
  const tocItems = sections.map((section, index) => ({ id: sectionId(section.title, index), title: section.title }));

  return (
    <ProjectFrame
      title={title}
      status={project.status}
      delivery={formatDelivery(project.raw)}
      email={me?.email}
      tocItems={tocItems}
    >
      <div className="project-dossier__stack">
        {sections.map((section, index) => (
          <ProjectContentSection key={`${section.title}-${index}`} id={tocItems[index].id} section={section} projectId={id} />
        ))}
        {footerLinks.length > 0 ? <FooterLinks links={footerLinks} /> : null}
      </div>
    </ProjectFrame>
  );
}

function ProjectFrame({
  title,
  status,
  delivery,
  email,
  tocItems,
  children,
}: {
  title: string;
  status?: string;
  delivery?: string;
  email?: string;
  tocItems?: ProjectTocItem[];
  children: ReactNode;
}) {
  return (
    <div className="project-dossier">
      <header className="project-dossier__header">
        <a className="project-dossier__brand" href="#/" aria-label="0001">
          0001
        </a>
        <div className="project-dossier__title-block">
          <p>{title}</p>
          {status ? <span>{status}</span> : null}
        </div>
        <div className="project-dossier__meta">
          <span>{delivery ?? "Delivery date pending"}</span>
          <a href="#/account" title={email ? `Account ${email}` : "Account"}>
            Account
          </a>
        </div>
      </header>
      <main className="project-dossier__sheet">
        {tocItems && tocItems.length > 0 ? <ProjectLogToc items={tocItems} /> : null}
        <div className="project-dossier__content">{children}</div>
      </main>
    </div>
  );
}

function ProjectLogToc({ items }: { items: ProjectTocItem[] }) {
  return (
    <nav className="project-dossier__toc" aria-label="Page log">
      <a className="project-dossier__toc-head" href={`#${items[0].id}`}>
        <span>Log</span>
        <span className="project-dossier__toc-rail" aria-hidden="true">
          {Array.from({ length: 5 }, (_, index) => (
            <span
              key={index}
              className={index === 0 ? "project-dossier__toc-mark project-dossier__toc-mark--active" : "project-dossier__toc-mark"}
              style={{ "--log-mark-opacity": `${1 - index * 0.16}` } as CSSProperties}
            />
          ))}
        </span>
      </a>
      <div className="project-dossier__toc-links">
        {items.map((item) => (
          <a key={item.id} href={`#${item.id}`}>
            {item.title}
          </a>
        ))}
      </div>
    </nav>
  );
}

function ProjectContentSection({ id, section, projectId }: { id: string; section: ProjectSection; projectId: string }) {
  const visibleBlocks = section.blocks.filter((block) => !isFooterBlock(block));

  if (visibleBlocks.length === 0) return null;

  return (
    <section className="project-dossier__section" id={id}>
      <h1>{section.title}</h1>
      <div className="project-dossier__items">
        {visibleBlocks.map((block, index) => (
          <ProjectBlock key={`${section.title}-${index}`} block={block} projectId={projectId} />
        ))}
      </div>
    </section>
  );
}

function ProjectBlock({ block, projectId }: { block: ProjectContentBlock; projectId: string }) {
  switch (block.type) {
    case "paragraph":
      return <RichParagraph block={block} />;
    case "child_page":
      if (normalizeContent(block.content).length > 0) {
        return (
          <a className="project-dossier__row project-dossier__row--link" href={`#/projects/${projectId}/pages/${block.id}`}>
            <span className="project-dossier__row-icon">↗</span>
            <span>{block.title}</span>
          </a>
        );
      }

      return (
        <div className="project-dossier__row">
          <span className="project-dossier__row-icon">↗</span>
          <span>{block.title}</span>
        </div>
      );
    case "child_database":
      return (
        <div className="project-dossier__row project-dossier__row--muted">
          <span className="project-dossier__row-icon">□</span>
          <span>{block.title}</span>
        </div>
      );
    case "to_do":
      return (
        <div className="project-dossier__row">
          <span className="project-dossier__checkbox" aria-hidden="true">
            {block.checked ? "✓" : ""}
          </span>
          <span>{block.text}</span>
        </div>
      );
    case "table":
      return <ContentTable rows={block.rows} />;
    case "divider":
      return <hr className="project-dossier__divider" />;
    case "heading_2":
      return null;
  }
}

function RichParagraph({ block }: { block: Extract<ProjectContentBlock, { type: "paragraph" }> }) {
  const links = block.links ?? [];
  if (links.length === 0) return <p className="project-dossier__paragraph">{block.text}</p>;

  if (links.length === 1 && links[0].text.trim() === block.text.trim()) {
    return (
      <p className="project-dossier__paragraph">
        <a href={links[0].href} target="_blank" rel="noreferrer">
          {links[0].text}
        </a>
      </p>
    );
  }

  return (
    <p className="project-dossier__paragraph">
      {block.text}
      {links.length > 0 ? (
        <span className="project-dossier__inline-links">
          {links.map((link) => (
            <a key={`${link.href}-${link.text}`} href={link.href} target="_blank" rel="noreferrer">
              {link.text}
            </a>
          ))}
        </span>
      ) : null}
    </p>
  );
}

function ContentTable({ rows }: { rows: string[][] }) {
  if (rows.length === 0) return null;

  const [head, ...body] = rows;

  return (
    <div className="project-dossier__table-wrap">
      <table className="project-dossier__table">
        <thead>
          <tr>
            {head.map((cell, index) => (
              <th key={`${cell}-${index}`}>{cell}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {head.map((_, cellIndex) => (
                <td key={cellIndex}>{row[cellIndex] ?? ""}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FooterLinks({ links }: { links: Array<{ text: string; href: string }> }) {
  return (
    <footer className="project-dossier__footer">
      {links.map((link) => (
        <a key={`${link.href}-${link.text}`} href={link.href} target="_blank" rel="noreferrer">
          {link.text}
        </a>
      ))}
    </footer>
  );
}

function FallbackProjectDetail({
  project,
  projects,
}: {
  project: ProjectDetailDoc;
  projects: ProjectSummary[];
}) {
  const parentIds = relationIds(project.raw, "Parent item");
  const subItemIds = relationIds(project.raw, "Sub-item");
  const parents = projects.filter((p) => parentIds.includes(p.notionId));
  const subItems = projects.filter((p) => subItemIds.includes(p.notionId));

  return (
    <div className="project-dossier__fallback">
      <section className="portal-card">
        <h2 className="portal-section-title">Properties</h2>
        <PropertyTable raw={project.raw} />
      </section>
      <div className="portal-split">
        <RelatedProjects title="Parent item" empty="No parent item." projects={parents} />
        <RelatedProjects title="Sub-items" empty="No sub-items." projects={subItems} />
      </div>
    </div>
  );
}

function RelatedProjects({
  title,
  empty,
  projects,
}: {
  title: string;
  empty: string;
  projects: ProjectSummary[];
}) {
  return (
    <div className="portal-card">
      <h2 className="portal-section-title">{title}</h2>
      {projects.length === 0 ? (
        <p className="muted">{empty}</p>
      ) : (
        <div className="portal-row-list">
          {projects.map((project) => (
            <a className="portal-row-list__item portal-row-list__item--link" key={project._id} href={`#/projects/${project._id}`}>
              <span>{project.name}</span>
              {project.status ? <small>{project.status}</small> : null}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function normalizeContent(content: unknown): ProjectContentBlock[] {
  if (!Array.isArray(content)) return [];
  return content.filter((block): block is ProjectContentBlock => Boolean(block?.type));
}

function findChildPage(blocks: ProjectContentBlock[], pageId: string): Extract<ProjectContentBlock, { type: "child_page" }> | undefined {
  for (const block of blocks) {
    if (block.type !== "child_page") continue;
    if (block.id === pageId) return block;
    const nested = findChildPage(normalizeContent(block.content), pageId);
    if (nested) return nested;
  }
  return undefined;
}

function groupSections(blocks: ProjectContentBlock[]): ProjectSection[] {
  const sections: ProjectSection[] = [];
  let current: ProjectSection | null = null;

  for (const block of blocks) {
    if (block.type === "heading_2") {
      current = { title: block.text || "Untitled", blocks: [] };
      sections.push(current);
      continue;
    }

    if (!current) {
      current = { title: "Project details", blocks: [] };
      sections.push(current);
    }

    current.blocks.push(block);
  }

  return sections.filter((section) => section.blocks.some((block) => !isFooterBlock(block)));
}

function sectionId(title: string, index: number) {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `section-${slug || "item"}-${index + 1}`;
}

function removeFooterBlocks(blocks: ProjectContentBlock[]) {
  const footerIndex = blocks.findIndex(isFooterBlock);
  if (footerIndex < 0) return blocks;

  const nextParagraphIndex = blocks.findIndex((block, index) => index > footerIndex && block.type === "paragraph");
  return blocks.filter((_, index) => index !== footerIndex && index !== nextParagraphIndex);
}

function extractFooterLinks(blocks: ProjectContentBlock[]): Array<{ text: string; href: string }> {
  const linksBlock = blocks.find(
    (block): block is Extract<ProjectContentBlock, { type: "paragraph" }> =>
      block.type === "paragraph" && block.text.trim().toLowerCase() === "links",
  );
  if (!linksBlock) return [];

  const index = blocks.indexOf(linksBlock);
  const nextParagraph = blocks.slice(index + 1).find(
    (block): block is Extract<ProjectContentBlock, { type: "paragraph" }> => block.type === "paragraph",
  );

  return nextParagraph?.links ?? [];
}

function isFooterBlock(block: ProjectContentBlock) {
  return block.type === "paragraph" && block.text.trim().toLowerCase() === "links";
}

function relationIds(raw: unknown, key: string): string[] {
  const value = (raw as Record<string, any> | null | undefined)?.[key];
  return Array.isArray(value?.relation) ? value.relation.map((r: any) => r.id).filter(Boolean) : [];
}

function formatDelivery(raw: Record<string, any>): string | undefined {
  const value = raw.Delivery ?? raw["Delivery date"] ?? raw.Date;
  const date = value?.date;
  if (!date?.start) return undefined;

  const start = parseDate(date.start);
  const end = date.end ? parseDate(date.end) : undefined;
  if (!start) return undefined;

  if (!end) return formatMonthDayYear(start);
  if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
    return `${formatMonthDay(start)} – ${end.getDate()}, ${end.getFullYear()}`;
  }
  if (start.getFullYear() === end.getFullYear()) {
    return `${formatMonthDay(start)} – ${formatMonthDayYear(end)}`;
  }
  return `${formatMonthDayYear(start)} – ${formatMonthDayYear(end)}`;
}

function parseDate(value: string) {
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function formatMonthDay(date: Date) {
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

function formatMonthDayYear(date: Date) {
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}
