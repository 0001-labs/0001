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
        property: "Include on website",
        checkbox: {
          equals: true,
        },
      },
      sorts: [
        {
          property: "Status",
          direction: "descending",
        },
      ],
    });

    const products: NotionProduct[] = response.results.map((page: any) => {
      const props = page.properties;
      const retention = props.Retention?.number;
      return {
        name: props.Name?.title?.[0]?.plain_text || "Untitled",
        users: props.Users?.number || 0,
        retention: retention != null ? `${retention}%` : "0%",
        status: props.Status?.status?.name || "In progress",
        website: props.Website?.rich_text?.[0]?.plain_text || null,
        github: props.Github?.url || null,
        active: true,
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
    { name: "DS one", users: 0, retention: "0%", status: "Alpha", website: "dsone.dev", github: "https://github.com/0001-labs/ds-one", active: true },
    { name: "Ezo", users: 0, retention: "0%", status: "In progress", website: "ezo-app.com", github: "https://github.com/0001-labs/ezo", active: true },
    { name: "tau99", users: 0, retention: "0%", status: "On hold", website: "tau99.com", github: "https://github.com/0001-labs/tau99", active: true },
    { name: "Digte", users: 0, retention: "0%", status: "In progress", website: "digte.co", github: "https://github.com/0001-labs/digte", active: true },
    { name: "allmythin.gs", users: 0, retention: "0%", status: "On hold", website: "allmythin.gs", github: "https://github.com/0001-labs/allmythings", active: true },
    { name: "Consistency", users: 0, retention: "0%", status: "Planned", website: "consistency.0001.dev", github: null, active: true },
  ];
}

function statusClass(status: string): string {
  switch (status.toLowerCase()) {
    case "ga":
      return " products-table__cell--ga";
    case "alpha":
      return " products-table__cell--alpha";
    case "in progress":
      return " products-table__cell--in-progress";
    case "on hold":
      return " products-table__cell--on-hold";
    case "planned":
      return " products-table__cell--planned";
    case "archived":
      return " products-table__cell--archived";
    default:
      return "";
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getProductLink(product: NotionProduct): string | null {
  const rawLink = (product.website || product.github || "").split(",")[0].trim();

  if (!rawLink) {
    return null;
  }

  return rawLink.startsWith("http") ? rawLink : `https://${rawLink}`;
}

function externalLinkSVG(): string {
  return `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <rect x="0" y="0" width="24" height="24" fill="#e8e8ec" />
                      <path d="M12 5.5V19" stroke="#000000" stroke-width="1.5" stroke-linecap="square" />
                      <path d="M6 11.5L12 5.5L18 11.5" stroke="#000000" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter" />
                      <path d="M7.5 18.5H16.5" stroke="#000000" stroke-width="1.5" stroke-linecap="square" />
                    </svg>`;
}

function generateProductsHTML(products: NotionProduct[]): string {
  const rows = products
    .map((product) => {
      const safeName = escapeHtml(product.name);
      const safeStatus = escapeHtml(product.status);
      const safeRetention = escapeHtml(product.retention);

      return `                <tr>
                  <td class="products-table__cell products-table__cell--product">
                    <span class="products-table__product-name">${safeName}</span>
                  </td>
                  <td class="products-table__cell">${product.users}</td>
                  <td class="products-table__cell">${safeRetention}</td>
                  <td class="products-table__cell products-table__cell--status${statusClass(product.status)}">${safeStatus}</td>
                </tr>`;
    })
    .join("\n\n");

  return `              <thead>
                <tr>
                  <th class="products-table__header-cell products-table__header-cell--product"><ds-text>Product</ds-text></th>
                  <th class="products-table__header-cell products-table__header-cell--users"><ds-text>Users</ds-text></th>
                  <th class="products-table__header-cell products-table__header-cell--retention"><ds-text>Retention</ds-text></th>
                  <th class="products-table__header-cell products-table__header-cell--status"><ds-text>Status</ds-text></th>
                </tr>
              </thead>
              <tbody>
${rows}
              </tbody>`;
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
  const tableStartMarker = "<!-- PRODUCTS_TABLE_START -->";
  const tableEndMarker = "<!-- PRODUCTS_TABLE_END -->";

  const startIndex = template.indexOf(tableStartMarker);
  const endIndex = template.indexOf(tableEndMarker);

  if (startIndex === -1 || endIndex === -1) {
    console.error("Could not find table markers in template");
    return;
  }

  const newContent = `${tableStartMarker}
${productsHTML}
              ${tableEndMarker}`;

  template = template.substring(0, startIndex) + newContent + template.substring(endIndex + tableEndMarker.length);

  writeFileSync(templatePath, template);
  console.log("Products page updated successfully!");
}

// Run the script
updateProductsPage().catch(console.error);
