import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import type { CSSProperties } from "react";

type Project = {
  _id: Id<"projects">;
  name: string;
  status?: string;
  content?: ProjectContentBlock[];
  raw: Record<string, any>;
};

type ProjectContentBlock =
  | { type: "heading_2"; text: string }
  | { type: "paragraph"; text: string; links?: Array<{ text: string; href: string }> }
  | { type: "child_page"; title: string; id: string; content?: ProjectContentBlock[] }
  | { type: "child_database"; title: string; id: string }
  | { type: "to_do"; text: string; checked: boolean }
  | { type: "table"; rows: string[][] }
  | { type: "divider" };

type ClientLogGroup = {
  project: Project;
  entries: ClientLogEntry[];
};

type ClientLogEntry = {
  text: string;
  relativeDate: string;
  timestamp: number;
  project: Project;
};

type ParsedLogEntry = Omit<ClientLogEntry, "project">;

export function ClientDetail({ id }: { id: string }) {
  const client = useQuery(api.clients.getById, { id: id as Id<"clients"> });
  const projects = useQuery(api.projects.byClient, client ? { clientId: client.notionId } : "skip");
  const visibleProjects = projects?.filter((project) => isTopLevelProject(project as Project));
  const displayProjects = visibleProjects?.filter((project) => !isHiddenProject(project as Project));
  const activeProjects = displayProjects?.filter((project) => !isProposalProject(project as Project));
  const proposalProjects = displayProjects?.filter((project) => isProposalProject(project as Project));
  const activeProjectList = (activeProjects ?? []) as Project[];
  const proposalProjectList = ((proposalProjects ?? []) as Project[])
    .filter((project) => getProjectRange(project) !== null)
    .sort(compareByDelivery);
  const timelineProjects = [...activeProjectList, ...proposalProjectList];
  const logGroups = extractClientLogGroups((visibleProjects ?? []) as Project[]);
  const tableWidthStyle = timelineProjects.length > 0 ? projectTableWidthStyle(timelineProjects) : undefined;

  return (
    <div className="admin-clients admin-client-detail">
      <header className="admin-clients__header">
        <a className="admin-clients__brand" href="#/" aria-label="0001">
          0001
        </a>
        <nav className="admin-clients__nav" aria-label="Account">
          <a href="#/">{client && client !== null ? client.name : "Clients"}</a>
          <a className="admin-clients__account" href="#/account">Account</a>
        </nav>
      </header>
      <main className="admin-clients__surface admin-client-detail__surface">
        {client === undefined ? (
          <p className="admin-client-detail__muted">Loading...</p>
        ) : client === null ? (
          <p className="admin-client-detail__muted">Client not found.</p>
        ) : (
          <div className="admin-client-detail__content">
            {logGroups.length > 0 ? <ClientLogToc groups={logGroups} /> : null}
            <section className="admin-client-detail__projects">
              {projects === undefined ? (
                <p className="admin-client-detail__muted">Loading projects...</p>
              ) : activeProjectList.length === 0 && proposalProjectList.length === 0 ? (
                <p className="admin-client-detail__muted">No projects.</p>
              ) : (
                <>
                  {timelineProjects.length > 0 ? <ProjectTimeline projects={timelineProjects} /> : null}
                  {activeProjectList.length > 0 ? (
                    <div className="admin-client-detail__project-list admin-client-detail__project-list--projects" style={tableWidthStyle}>
                      <div className="admin-client-detail__project-head">
                        <span>Projects</span>
                        <span>Status</span>
                      </div>
                      {activeProjectList.map((project) => (
                        <a
                          href={`#/projects/${project._id}`}
                          key={project._id}
                          style={projectColorStyle(project)}
                        >
                          <span>{project.name}</span>
                          <span>{project.status ?? ""}</span>
                        </a>
                      ))}
                    </div>
                  ) : null}
                  {proposalProjectList.length > 0 ? <ProposalList projects={proposalProjectList} tableStyle={tableWidthStyle} /> : null}
                </>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

function ClientLogToc({ groups }: { groups: ClientLogGroup[] }) {
  const entries = groups.flatMap((group) => group.entries).sort(compareLogEntriesNewestFirst);

  return (
    <nav className="client-log-toc" aria-label="Client project logs">
      <button className="client-log-toc__head" type="button">
        <span>Log</span>
        <span className="client-log-toc__rail" aria-hidden="true">
          {Array.from({ length: 5 }, (_, index) => (
            <span
              key={index}
              className={index === 0 ? "client-log-toc__mark client-log-toc__mark--active" : "client-log-toc__mark"}
              style={{ "--log-mark-opacity": `${1 - index * 0.16}` } as CSSProperties}
            />
          ))}
        </span>
      </button>
      <div className="client-log-toc__popover">
        {entries.map((entry, index) => (
          <a className="client-log-toc__entry" href={`#/projects/${entry.project._id}`} key={`${entry.project._id}-${index}`}>
            <time>{entry.relativeDate}</time>
            <span>{entry.text}</span>
            <small>{entry.project.name}</small>
          </a>
        ))}
      </div>
    </nav>
  );
}

function ProposalList({ projects, tableStyle }: { projects: Project[]; tableStyle?: CSSProperties }) {
  return (
    <div className="admin-client-detail__project-list admin-client-detail__project-list--proposals" style={tableStyle}>
      <div className="admin-client-detail__project-head">
        <span>Proposals</span>
        <span>Delivery by</span>
      </div>
      {projects.map((project) => (
        <a href={`#/projects/${project._id}`} key={project._id} style={proposalColorStyle(project, projects.indexOf(project))}>
          <span>{project.name}</span>
          <span>{formatProposalDelivery(project)}</span>
        </a>
      ))}
    </div>
  );
}

function ProjectTimeline({ projects }: { projects: Project[] }) {
  let proposalIndex = 0;
  const entries = projects
    .map((project) => {
      const isProposal = isProposalProject(project);
      const color = isProposal ? proposalColorValue(proposalIndex++) : getProjectColor(project);
      const range = getProjectRange(project);
      return { project, range, color };
    })
    .filter((entry): entry is { project: Project; range: DateRange; color: string } => entry.range !== null);

  if (entries.length === 0) return null;

  const today = startOfDay(new Date());
  const ranges = entries.map((entry) => entry.range);
  const timeline = makeTimeline(ranges, today);
  const rows = getTimelineRows(timeline.weeks, ranges, today);

  return (
    <div className="project-calendar" aria-label="Project delivery timeline">
      <div className="project-calendar__months" style={{ gridTemplateColumns: `repeat(${timeline.weeks.length}, 30px)` }}>
        {timeline.months.map((month) => (
          <span key={`${month.label}-${month.start}`} style={{ gridColumn: `${month.start + 1} / span ${month.span}` }}>
            {month.label}
          </span>
        ))}
      </div>
      <div className="project-calendar__body">
        <div className="project-calendar__weekdays" style={{ gridTemplateRows: `repeat(${rows.length}, 30px)` }} aria-hidden="true">
          {rows.map((row) => (
            <span key={row}>{weekdayLabel(row)}</span>
          ))}
        </div>
        <div className="project-calendar__grid" style={{ gridTemplateColumns: `repeat(${timeline.weeks.length}, 30px)` }}>
          {rows.map((row, rowIndex) =>
            timeline.weeks.map((week, col) => {
              const date = addDays(week.start, row);
              const activeEntries = entries.filter((entry) => rangeIncludesDate(entry.range, date));
              const isToday = sameDate(date, today);
              const label = getCalendarDateLabel(date, today, ranges);
              const cellStyle = activeEntries[0] ? { backgroundColor: activeEntries[0].color } : undefined;

              return (
                <div
                  className={[
                    "project-calendar__cell",
                    activeEntries.length > 0 ? "project-calendar__cell--active" : "",
                    isToday ? "project-calendar__cell--today" : "",
                    col === timeline.weeks.length - 1 ? "project-calendar__cell--col-end" : "",
                    rowIndex === rows.length - 1 ? "project-calendar__cell--row-end" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  key={`${row}-${col}`}
                  style={cellStyle}
                >
                  <span className="project-calendar__date">{label}</span>
                  <span className="project-calendar__tooltip" role="tooltip">
                    <span className="project-calendar__tooltip-date">{formatCalendarDate(date)}</span>
                    {activeEntries.length > 0 ? (
                      activeEntries.map((entry) => (
                        <span className="project-calendar__tooltip-row" key={entry.project._id}>
                          <span
                            className="project-calendar__tooltip-swatch"
                            style={{ backgroundColor: entry.color }}
                          />
                          <span>
                            <strong>{projectDateRole(entry.range, date)}</strong>
                            {entry.project.name}
                          </span>
                        </span>
                      ))
                    ) : (
                      <span className="project-calendar__tooltip-empty">No active project</span>
                    )}
                  </span>
                </div>
              );
            }),
          )}
        </div>
      </div>
    </div>
  );
}

type DateRange = { start: Date; end: Date };

function isTopLevelProject(project: Project) {
  if (hasParentRelation(project.raw)) return false;
  return !/^(stage\s*\d+|qa\s+for\s+)/i.test(project.name.trim());
}

function isProposalProject(project: Project) {
  const status = project.status?.trim().toLowerCase();
  return status === "proposal" || status === "not started";
}

function isHiddenProject(project: Project) {
  return project.status?.trim().toLowerCase() === "planning";
}

function compareByDelivery(a: Project, b: Project) {
  const aRange = getProjectRange(a);
  const bRange = getProjectRange(b);
  return (aRange?.end.getTime() ?? Number.MAX_SAFE_INTEGER) - (bRange?.end.getTime() ?? Number.MAX_SAFE_INTEGER);
}

function extractClientLogGroups(projects: Project[]): ClientLogGroup[] {
  return projects
    .map((project) => ({
      project,
      entries: extractProjectLogEntries(project).map((entry) => ({ ...entry, project })),
    }))
    .filter((group) => group.entries.length > 0);
}

function extractProjectLogEntries(project: Project) {
  const content = normalizeContent(project.content);
  const logStart = content.findIndex((block) => block.type === "heading_2" && isLogHeading(block.text));
  if (logStart < 0) return [];

  const logBlocks: ProjectContentBlock[] = [];
  for (const block of content.slice(logStart + 1)) {
    if (block.type === "heading_2") break;
    logBlocks.push(block);
  }

  return logBlocks.flatMap(logEntriesFromBlock).filter((entry) => entry.text.length > 0 && !isLinksLogEntry(entry.text));
}

function isLogHeading(text: string) {
  return /(?:^|\s)log$/i.test(text.trim());
}

function logEntriesFromBlock(block: ProjectContentBlock): ParsedLogEntry[] {
  switch (block.type) {
    case "table": {
      const rows = block.rows.length > 1 ? block.rows.slice(1) : block.rows;
      return rows.map(logEntryFromCells).filter((entry): entry is ParsedLogEntry => entry !== null);
    }
    case "paragraph":
      return logEntryFromText(block.text);
    case "child_page":
      return logEntryFromText(block.title);
    case "child_database":
      return logEntryFromText(block.title);
    case "to_do":
      return logEntryFromText(block.text, block.checked ? "Done" : "Open");
    case "divider":
    case "heading_2":
      return [];
  }
}

function logEntryFromCells(cells: string[]): ParsedLogEntry | null {
  const text = cells.map((cell) => cell.trim()).filter(Boolean).join(" · ");
  return text ? parseLogEntry(text) : null;
}

function logEntryFromText(text: string, prefix?: string): ParsedLogEntry[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  const value = prefix ? `${prefix} · ${trimmed}` : trimmed;
  return [parseLogEntry(value)];
}

function compareLogEntriesNewestFirst(a: ClientLogEntry, b: ClientLogEntry) {
  return b.timestamp - a.timestamp;
}

function parseLogEntry(text: string): ParsedLogEntry {
  const dates = Array.from(text.matchAll(/\b(\d{4}-\d{2}-\d{2})\b/g)).map((match) => match[1]);
  const date = dates[dates.length - 1];
  return {
    text: stripLeadingLogDate(text),
    relativeDate: date ? relativeTemporalDate(date) : "",
    timestamp: date ? plainDateTimestamp(date) : Number.NEGATIVE_INFINITY,
  };
}

function stripLeadingLogDate(text: string) {
  return text
    .replace(/^\s*\d{4}-\d{2}-\d{2}\s*(?:→|->|–|-)\s*\d{4}-\d{2}-\d{2}\s*[·:.-]?\s*/u, "")
    .replace(/^\s*\d{4}-\d{2}-\d{2}\s*[·:.-]?\s*/u, "")
    .trim();
}

function plainDateTimestamp(value: string) {
  return new Date(`${value}T00:00:00`).getTime();
}

function relativeTemporalDate(value: string) {
  const temporal = (globalThis as typeof globalThis & { Temporal?: any }).Temporal;
  const target = temporal?.PlainDate?.from
    ? temporal.PlainDate.from(value)
    : plainDateFromDate(new Date(`${value}T00:00:00`));
  const today = temporal?.Now?.plainDateISO ? temporal.Now.plainDateISO() : plainDateFromDate(new Date());
  const days = daysBetweenPlainDates(target, today);

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days > 1 && days < 7) return `${days} days ago`;
  if (days >= 7 && days < 14) return "1 week ago";
  if (days >= 14 && days < 31) return `${Math.round(days / 7)} weeks ago`;
  if (days >= 31 && days < 61) return "1 month ago";
  if (days >= 61 && days < 365) return `${Math.round(days / 30)} months ago`;
  if (days >= 365 && days < 730) return "1 year ago";
  if (days >= 730) return `${Math.round(days / 365)} years ago`;

  const ahead = Math.abs(days);
  if (ahead === 1) return "Tomorrow";
  if (ahead < 7) return `In ${ahead} days`;
  if (ahead < 14) return "In 1 week";
  if (ahead < 31) return `In ${Math.round(ahead / 7)} weeks`;
  return `In ${Math.round(ahead / 30)} months`;
}

function plainDateFromDate(date: Date) {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
}

function daysBetweenPlainDates(from: { year: number; month: number; day: number }, to: { year: number; month: number; day: number }) {
  const fromTime = Date.UTC(from.year, from.month - 1, from.day);
  const toTime = Date.UTC(to.year, to.month - 1, to.day);
  return Math.round((toTime - fromTime) / 86_400_000);
}

function isLinksLogEntry(text: string) {
  const normalized = text.trim().toLowerCase();
  return normalized === "links" || normalized.startsWith("links ·") || normalized.includes("github:") || normalized.includes("microcms");
}

function normalizeContent(content: unknown): ProjectContentBlock[] {
  if (!Array.isArray(content)) return [];
  return content.filter((block): block is ProjectContentBlock => Boolean(block?.type));
}

function hasParentRelation(raw: Record<string, any>) {
  return Object.entries(raw ?? {}).some(([key, value]) => {
    const normalizedKey = key.toLowerCase();
    return normalizedKey.includes("parent") && Array.isArray(value?.relation) && value.relation.length > 0;
  });
}

function projectColorStyle(project: Project): CSSProperties & { "--project-color": string } {
  return { "--project-color": getProjectColor(project) };
}

function projectTableWidthStyle(projects: Project[]): CSSProperties & { "--project-list-width": string } {
  const ranges = projects.map(getProjectRange).filter((range): range is DateRange => range !== null);
  const weeks = ranges.length > 0 ? makeTimeline(ranges, startOfDay(new Date())).weeks.length : 16;
  return { "--project-list-width": `${weeks * 30}px` };
}

function proposalColorStyle(_project: Project, index: number): CSSProperties & { "--project-color": string } {
  return { "--project-color": proposalColorValue(index) };
}

function proposalColorValue(index: number) {
  const colors = [
    "rgba(204, 255, 77, 0.32)",
    "rgba(204, 204, 255, 0.38)",
    "rgba(242, 255, 207, 0.82)",
    "rgba(255, 68, 56, 0.24)",
    "rgba(255, 209, 153, 0.36)",
    "rgba(255, 199, 232, 0.34)",
    "rgba(255, 179, 167, 0.34)",
    "rgba(153, 255, 115, 0.3)",
    "rgba(232, 232, 232, 0.7)",
  ];
  return colors[index % colors.length];
}

function getProjectColor(project: Project): string {
  const colorProperty =
    findRawProperty(project.raw, "Color", "Colour", "Project color", "Project Color") ??
    findColoredProperty(project.raw);
  const notionColor = colorProperty?.select?.color ?? colorProperty?.status?.color ?? colorProperty?.color;
  const colorName = colorProperty?.select?.name ?? colorProperty?.status?.name ?? colorProperty?.name;
  return colorValue(notionColor ?? colorName);
}

function findRawProperty(raw: Record<string, any>, ...names: string[]) {
  const lower = Object.fromEntries(Object.entries(raw ?? {}).map(([key, value]) => [key.toLowerCase(), value]));
  for (const name of names) {
    const hit = lower[name.toLowerCase()];
    if (hit) return hit;
  }
  return undefined;
}

function findColoredProperty(raw: Record<string, any>) {
  return Object.values(raw ?? {}).find((property: any) => property?.select?.color && property.select.color !== "default");
}

function colorValue(value: unknown) {
  const key = String(value ?? "").toLowerCase().replace(/[\s_-]+/g, "");
  const colors: Record<string, string> = {
    blue: "#ccccff",
    zenithblue: "#ccccff",
    purple: "#ccccff",
    green: "#99ff73",
    applegreen: "#99ff73",
    chartreuse: "#ccff4d",
    yellow: "#f3ff99",
    orange: "#ffd199",
    red: "#ffb3a7",
    pink: "#ffc7e8",
    gray: "#e8e8e8",
    grey: "#e8e8e8",
  };
  return colors[key] ?? "#99ff73";
}

function getProjectRange(project: Project): DateRange | null {
  const date = project.raw?.Delivery?.date ?? project.raw?.["Delivery date"]?.date ?? project.raw?.Date?.date;
  if (!date?.start) return null;

  const start = parseIsoDate(date.start);
  const end = parseIsoDate(date.end ?? date.start);
  if (!start || !end) return null;
  return start <= end ? { start, end } : { start: end, end: start };
}

function formatProposalDelivery(project: Project) {
  const range = getProjectRange(project);
  if (!range) return "";
  return ordinalDate(range.end);
}

function ordinalDate(date: Date) {
  const day = date.getDate();
  const suffix = day % 10 === 1 && day !== 11 ? "st" : day % 10 === 2 && day !== 12 ? "nd" : day % 10 === 3 && day !== 13 ? "rd" : "th";
  const month = date.toLocaleDateString("en-US", { month: "long" });
  return `${day}${suffix} of ${month}`;
}

function makeTimeline(ranges: DateRange[], today: Date) {
  const min = ranges.reduce((earliest, range) => (range.start < earliest ? range.start : earliest), today);
  const max = ranges.reduce((latest, range) => (range.end > latest ? range.end : latest), today);
  const startMonth = startOfMonth(addMonths(min, -1));
  const minimumEndMonth = addMonths(startMonth, 3);
  const latestEndMonth = startOfMonth(max);
  const endMonth = latestEndMonth > minimumEndMonth ? latestEndMonth : minimumEndMonth;
  const start = startOfWeek(startMonth);
  const end = startOfWeek(endOfMonth(endMonth));
  const weeks: Array<{ start: Date; end: Date }> = [];

  for (let cursor = start; cursor <= end; cursor = addDays(cursor, 7)) {
    weeks.push({ start: cursor, end: addDays(cursor, 6) });
  }

  return {
    weeks,
    months: makeMonthLabels(weeks, startMonth, endMonth),
  };
}

function makeMonthLabels(weeks: Array<{ start: Date; end: Date }>, startMonth: Date, endMonth: Date) {
  const labels: Array<{ label: string; start: number; span: number }> = [];

  for (let month = startMonth; month <= endMonth; month = addMonths(month, 1)) {
    const start = weeks.findIndex((week) => week.start <= month && week.end >= month);
    if (start === -1) continue;

    const nextMonth = addMonths(month, 1);
    const nextStart = weeks.findIndex((week) => week.start <= nextMonth && week.end >= nextMonth);
    labels.push({
      label: month.toLocaleDateString("en-US", { month: "short" }),
      start,
      span: (nextStart === -1 ? weeks.length : nextStart) - start,
    });
  }

  return labels;
}

function rangeIncludesDate(range: DateRange, date: Date) {
  return startOfDay(range.start) <= date && startOfDay(range.end) >= date;
}

function projectDateRole(range: DateRange, date: Date) {
  const isStart = sameDate(date, range.start);
  const isEnd = sameDate(date, range.end);
  if (isStart && isEnd) return "Project start/end · ";
  if (isStart) return "Project start · ";
  if (isEnd) return "Project end · ";
  return "Active · ";
}

function getTimelineRows(weeks: Array<{ start: Date; end: Date }>, ranges: DateRange[], today: Date) {
  let lastRelevantRow = 0;

  for (let row = 0; row < 7; row++) {
    const hasRelevantCell = weeks.some((week) => {
      const date = addDays(week.start, row);
      return (
        sameDate(date, today) ||
        ranges.some((range) => rangeIncludesDate(range, date) || sameDate(date, range.start) || sameDate(date, range.end))
      );
    });

    if (hasRelevantCell) lastRelevantRow = row;
  }

  return Array.from({ length: lastRelevantRow + 1 }, (_, row) => row);
}

function getCalendarDateLabel(date: Date, today: Date, ranges: DateRange[]) {
  const day = date.getDate();
  const isProjectBoundary = ranges.some((range) => sameDate(date, range.start) || sameDate(date, range.end));
  if (isProjectBoundary || sameDate(date, today)) {
    return day;
  }
  return null;
}

function weekdayLabel(row: number) {
  if (row === 1) return "Mon";
  if (row === 3) return "Wed";
  if (row === 5) return "Fri";
  return "";
}

function formatCalendarDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function startOfWeek(date: Date) {
  const next = startOfDay(date);
  next.setDate(next.getDate() - next.getDay());
  return next;
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function sameDate(a: Date, b: Date) {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function parseIsoDate(value: string) {
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
