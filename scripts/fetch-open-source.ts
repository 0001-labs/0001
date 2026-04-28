import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

interface GitHubRepo {
  name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  fork: boolean;
  archived: boolean;
  updated_at: string;
}

const ORG = "0001-labs";
const FALLBACK_REPOS: GitHubRepo[] = [
  repo("0001-website", "A website for 0001", "HTML", "2026-04-28T07:57:16Z"),
  repo("drag", "Framework-agnostic drag-and-drop primitives for TypeScript.", "TypeScript", "2026-04-28T05:23:38Z"),
  repo("ds-one", "A plug and play design system", "TypeScript", "2026-01-31T07:48:45Z"),
  repo("openbook", "A transparent framework for companies", "HTML", "2026-01-28T02:56:07Z"),
  repo("digte", "A poetry collection that can be read online", null, "2026-01-28T02:56:05Z"),
  repo("blocker", "A 100% unpassable Screen Time app", "TypeScript", "2026-01-28T02:55:58Z"),
  repo("archcss", "A CSS-like syntax for creating floorplans and architectural planning", "TypeScript", "2026-01-28T02:55:56Z"),
];

async function fetchRepos(): Promise<GitHubRepo[]> {
  try {
    const response = await fetch(`https://api.github.com/orgs/${ORG}/repos?type=public&sort=updated&per_page=100`, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "0001-website",
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub responded ${response.status}`);
    }

    const repos = (await response.json()) as GitHubRepo[];
    return repos.filter((repo) => !repo.fork && !repo.archived);
  } catch (error) {
    console.error("Error fetching GitHub repos:", error);
    return FALLBACK_REPOS;
  }
}

function repo(name: string, description: string, language: string | null, updatedAt: string): GitHubRepo {
  return {
    name,
    description,
    html_url: `https://github.com/${ORG}/${name}`,
    language,
    stargazers_count: 0,
    fork: false,
    archived: false,
    updated_at: updatedAt,
  };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

function generateRows(repos: GitHubRepo[]): string {
  return repos
    .map((repo) => {
      const description = repo.description ? escapeHtml(repo.description) : "No description";
      const language = repo.language ? escapeHtml(repo.language) : "-";
      return `                <tr>
                  <td class="open-source-table__cell open-source-table__cell--project">
                    <a href="${escapeHtml(repo.html_url)}" target="_blank" rel="noreferrer">
                      <span class="open-source-table__project-name">${escapeHtml(repo.name)}</span>
                    </a>
                  </td>
                  <td class="open-source-table__cell open-source-table__cell--description">${description}</td>
                  <td class="open-source-table__cell">${language}</td>
                  <td class="open-source-table__cell">${repo.stargazers_count}</td>
                  <td class="open-source-table__cell">${formatDate(repo.updated_at)}</td>
                </tr>`;
    })
    .join("\n\n");
}

async function updateOpenSourcePage(): Promise<void> {
  console.log("Fetching open source projects from GitHub...");
  const repos = await fetchRepos();
  console.log(`Found ${repos.length} public repos`);

  const templatePath = join(import.meta.dir, "../client/open-source.html");
  let template = readFileSync(templatePath, "utf-8");
  const startMarker = "<!-- OPEN_SOURCE_TABLE_START -->";
  const endMarker = "<!-- OPEN_SOURCE_TABLE_END -->";
  const startIndex = template.indexOf(startMarker);
  const endIndex = template.indexOf(endMarker);

  if (startIndex === -1 || endIndex === -1) {
    throw new Error("Could not find open source table markers");
  }

  const rows = generateRows(repos);
  const table = `${startMarker}
              <thead>
                <tr>
                  <th class="open-source-table__header-cell open-source-table__header-cell--project"><ds-text>Project</ds-text></th>
                  <th class="open-source-table__header-cell open-source-table__header-cell--description"><ds-text>Description</ds-text></th>
                  <th class="open-source-table__header-cell"><ds-text>Language</ds-text></th>
                  <th class="open-source-table__header-cell"><ds-text>Stars</ds-text></th>
                  <th class="open-source-table__header-cell"><ds-text>Updated</ds-text></th>
                </tr>
              </thead>
              <tbody>
${rows}
              </tbody>
              ${endMarker}`;

  template = template.substring(0, startIndex) + table + template.substring(endIndex + endMarker.length);
  writeFileSync(templatePath, template);
  console.log("Open source page updated successfully!");
}

updateOpenSourcePage().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
