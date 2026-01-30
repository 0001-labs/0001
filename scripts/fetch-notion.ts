import { Client } from "@notionhq/client";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

// Types for Notion response
interface NotionProduct {
  name: string;
  users: number;
  retention: string;
  status: string;
  website: string | null;
  github: string | null;
  active: boolean;
}

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const DATABASE_ID = "28489c2fcf7680b4850dcc252bc956c3";

async function fetchProducts(): Promise<NotionProduct[]> {
  try {
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      filter: {
        property: "Active",
        status: {
          equals: "Active",
        },
      },
    });

    const products: NotionProduct[] = response.results.map((page: any) => {
      const props = page.properties;
      return {
        name: props.Name?.title?.[0]?.plain_text || "Untitled",
        users: props.Users?.number || 0,
        retention: props.Retention?.rich_text?.[0]?.plain_text || "0%",
        status: props.Status?.select?.name || "In progress",
        website: props.Website?.rich_text?.[0]?.plain_text || null,
        github: props.Github?.url || null,
        active: props.Active?.status?.name === "Active",
      };
    });

    return products;
  } catch (error) {
    console.error("Error fetching from Notion:", error);
    // Return mock data if Notion fetch fails
    return getMockProducts();
  }
}

function getMockProducts(): NotionProduct[] {
  return [
    { name: "allmythin.gs", users: 0, retention: "0%", status: "In progress", website: "https://allmythin.gs", github: null, active: true },
    { name: "Ritonel", users: 0, retention: "0%", status: "In progress", website: null, github: null, active: true },
    { name: "Ezo", users: 0, retention: "0%", status: "In progress", website: null, github: null, active: true },
    { name: "DS one", users: 0, retention: "0%", status: "In progress", website: null, github: "https://github.com/0001-labs/ds-one", active: true },
    { name: "theseareuntitled.com", users: 0, retention: "0%", status: "In progress", website: "https://theseareuntitled.com", github: null, active: true },
    { name: "archcss", users: 0, retention: "0%", status: "In progress", website: null, github: null, active: true },
  ];
}

function generateProductsHTML(products: NotionProduct[]): string {
  const productCells = products
    .map((p) => {
      if (p.website || p.github) {
        const link = p.website || p.github;
        return `<div class="table__cell table__cell--link">
              <span>${p.name}</span>
              <a href="${link}" target="_blank" rel="noopener" class="external-link-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            </div>`;
      }
      return `<div class="table__cell">${p.name}</div>`;
    })
    .join("\n            ");

  const usersCells = products.map((p) => `<div class="table__cell">${p.users}</div>`).join("\n            ");

  const retentionCells = products.map((p) => `<div class="table__cell">${p.retention}</div>`).join("\n            ");

  const statusCells = products.map((p) => `<div class="table__cell table__cell--status">${p.status}</div>`).join("\n            ");

  return `<!-- Product column -->
          <div class="table__column table__column--product">
            <div class="table__header">Product</div>
            ${productCells}
          </div>

          <!-- Users column -->
          <div class="table__column table__column--users">
            <div class="table__header">Users</div>
            ${usersCells}
          </div>

          <!-- Retention column -->
          <div class="table__column table__column--retention">
            <div class="table__header">Retention</div>
            ${retentionCells}
          </div>

          <!-- Status column -->
          <div class="table__column table__column--status">
            <div class="table__header">Status</div>
            ${statusCells}
          </div>`;
}

async function updateProductsPage(): Promise<void> {
  console.log("Fetching products from Notion...");
  const products = await fetchProducts();
  console.log(`Found ${products.length} active products`);

  const productsHTML = generateProductsHTML(products);

  // Read the products template
  const templatePath = join(import.meta.dir, "../client/products.html");
  let template = readFileSync(templatePath, "utf-8");

  // Replace the table content
  const tableStartMarker = '<div class="products-table">';
  const tableEndMarker = "</div>\n\n      <!-- Footer -->";

  const startIndex = template.indexOf(tableStartMarker);
  const endIndex = template.indexOf(tableEndMarker);

  if (startIndex === -1 || endIndex === -1) {
    console.error("Could not find table markers in template");
    return;
  }

  const newContent = `<div class="products-table">
          ${productsHTML}
        </div>\n\n      <!-- Footer -->`;

  template = template.substring(0, startIndex) + newContent + template.substring(endIndex + tableEndMarker.length);

  writeFileSync(templatePath, template);
  console.log("Products page updated successfully!");
}

// Run the script
updateProductsPage().catch(console.error);
