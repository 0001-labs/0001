import { Client } from "@notionhq/client";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

interface NotionTask {
  name: string;
  project: string;
  taskName: string;
  status: string;
  due: string | null;
}

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const DATABASE_ID = "651cd5fdc449488680b49e032d520466";

function parseTaskName(name: string): { project: string; taskName: string } {
  const parts = name.split(" – ");
  if (parts.length >= 2) {
    return { project: parts[0].trim(), taskName: parts.slice(1).join(" – ").trim() };
  }
  return { project: "Other", taskName: name };
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr + "T00:00:00");
  const month = date.toLocaleString("en-US", { month: "short" });
  const day = date.getDate();
  return `${month} ${day}`;
}

async function fetchTasks(): Promise<NotionTask[]> {
  try {
    const allResults: any[] = [];
    let hasMore = true;
    let startCursor: string | undefined;

    while (hasMore) {
      const response: any = await notion.databases.query({
        database_id: DATABASE_ID,
        sorts: [{ property: "Due", direction: "descending" }],
        ...(startCursor ? { start_cursor: startCursor } : {}),
      });

      allResults.push(...response.results);
      hasMore = response.has_more;
      startCursor = response.next_cursor ?? undefined;
    }

    return allResults.map((page: any) => {
      const props = page.properties;
      const name = props["Task name"]?.title?.[0]?.plain_text || props.Name?.title?.[0]?.plain_text || "Untitled";
      const { project, taskName } = parseTaskName(name);
      const status = props.Status?.status?.name || "Not started";
      const due = props.Due?.date?.start || null;

      return { name, project, taskName, status, due };
    });
  } catch (error) {
    console.error("Error fetching tasks from Notion:", error);
    return [];
  }
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function statusClass(status: string): string {
  switch (status.toLowerCase()) {
    case "shipped":
      return "shipped";
    case "in progress":
      return "in-progress";
    default:
      return "planned";
  }
}

const PROJECT_COLORS: Record<string, string> = {
  "Consistency": "#E8A83E",
  "Blocker": "#E85D5D",
  "Ezo": "#5DB85D",
  "Marketer": "#9B7ED8",
  "0001": "#CCFF4D",
  "0001-website": "#6CB4EE",
  "DS one": "#4A9EE0",
  "Other": "#999999",
};

function generateTabsHTML(tasks: NotionTask[]): string {
  const projects = new Set<string>();
  for (const task of tasks) {
    projects.add(task.project);
  }

  // Sort projects: most tasks first
  const projectCounts = new Map<string, number>();
  for (const task of tasks) {
    projectCounts.set(task.project, (projectCounts.get(task.project) || 0) + 1);
  }
  const sorted = [...projects].sort((a, b) => (projectCounts.get(b) || 0) - (projectCounts.get(a) || 0));

  let html = `          <div class="tasklog-tabs">\n`;
  html += `            <button class="tasklog-tab tasklog-tab--active" data-filter="all">All tasks</button>\n`;
  for (const project of sorted) {
    const color = PROJECT_COLORS[project] || "#999999";
    html += `            <button class="tasklog-tab" data-filter="${escapeHtml(project)}"><span class="tasklog-tab__indicator" style="background:${color}"></span>${escapeHtml(project)}</button>\n`;
  }
  html += `          </div>`;
  return html;
}

function generateTasksHTML(tasks: NotionTask[]): string {
  // Sort: tasks with dates first (desc), then without dates
  const sorted = [...tasks].sort((a, b) => {
    if (a.due && b.due) return b.due.localeCompare(a.due);
    if (a.due) return -1;
    if (b.due) return 1;
    return 0;
  });

  let html = "";
  let isFirst = true;

  for (const task of sorted) {
    const firstClass = isFirst ? " tasklog-table__row--first-visible" : "";
    const sc = statusClass(task.status);

    const dateAttr = task.due ? ` data-date="${task.due}"` : "";
    html += `            <div class="tasklog-table__row${firstClass}" data-project="${escapeHtml(task.project)}"${dateAttr}>\n`;
    html += `              <div class="tasklog-table__cell tasklog-table__cell--name">${escapeHtml(task.name)}</div>\n`;
    html += `              <div class="tasklog-table__cell tasklog-table__cell--status tasklog-table__cell--${sc}">${escapeHtml(task.status)}</div>\n`;
    html += `              <div class="tasklog-table__cell tasklog-table__cell--due">${formatDate(task.due)}</div>\n`;
    html += `            </div>\n`;
    // Note: JS on the page parses "Mon D" dates and handles relative formatting + dateline

    isFirst = false;
  }

  return html.trimEnd();
}

async function updateTaskLogPage(): Promise<void> {
  console.log("Fetching tasks from Notion...");
  const tasks = await fetchTasks();

  if (tasks.length === 0) {
    console.log("No tasks fetched, keeping existing content");
    return;
  }

  console.log(`Found ${tasks.length} tasks`);

  const tasksHTML = generateTasksHTML(tasks);
  const tabsHTML = generateTabsHTML(tasks);

  const templatePath = join(import.meta.dir, "../client/task-log.html");
  let template = readFileSync(templatePath, "utf-8");

  // Replace tabs
  const tabsStart = "<!-- TABS_START -->";
  const tabsEnd = "<!-- TABS_END -->";
  const tabsStartIdx = template.indexOf(tabsStart);
  const tabsEndIdx = template.indexOf(tabsEnd);

  if (tabsStartIdx !== -1 && tabsEndIdx !== -1) {
    template =
      template.substring(0, tabsStartIdx) +
      tabsStart + "\n" +
      tabsHTML + "\n          " +
      tabsEnd +
      template.substring(tabsEndIdx + tabsEnd.length);
  }

  // Replace tasks
  const tasksStart = "<!-- TASKS_START -->";
  const tasksEnd = "<!-- TASKS_END -->";
  const tasksStartIdx = template.indexOf(tasksStart);
  const tasksEndIdx = template.indexOf(tasksEnd);

  if (tasksStartIdx !== -1 && tasksEndIdx !== -1) {
    template =
      template.substring(0, tasksStartIdx) +
      tasksStart + "\n" +
      tasksHTML + "\n            " +
      tasksEnd +
      template.substring(tasksEndIdx + tasksEnd.length);
  }

  writeFileSync(templatePath, template);
  console.log("Task log page updated successfully!");
}

updateTaskLogPage().catch(console.error);
