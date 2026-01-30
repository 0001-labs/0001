interface Env {
  NOTION_API_KEY: string;
}

interface ContactForm {
  name: string;
  company?: string;
  email: string;
  message: string;
  topics: string[];
  techstack?: string[];
}

const LEADS_DATABASE_ID = "2f789c2fcf7680e190dbe6c9bf92413d";

// Build notes content from form data
function buildNotesContent(body: ContactForm): string {
  const parts: string[] = [];

  if (body.topics && body.topics.length > 0) {
    parts.push(`Services: ${body.topics.join(", ")}`);
  }

  if (body.techstack && body.techstack.length > 0) {
    parts.push(`Tech Stack: ${body.techstack.join(", ")}`);
  }

  parts.push(`\nMessage:\n${body.message}`);

  return parts.join("\n");
}

// Map website topics to Notion Services options
const SERVICE_MAP: Record<string, string> = {
  "SEO": "Web apps",
  "Speed optimizing": "Web apps",
  "Image delivery pipeline": "Web apps",
  "Marketing sites": "Web apps",
  "Design systems": "Web apps",
  "API development": "Web apps",
  "Database design": "Data analytics",
  "Cloud infrastructure": "Cloud",
  "Authentication": "Security",
  "Security": "Security",
  "AI Agents": "AI",
  "MCP": "AI",
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  try {
    const body: ContactForm = await request.json();

    // Validate required fields
    if (!body.name || !body.email || !body.message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers }
      );
    }

    // Map topics to Notion Services
    const services = [...new Set(
      body.topics
        .map(topic => SERVICE_MAP[topic])
        .filter(Boolean)
    )];

    // Create lead in Notion
    const notionResponse = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.NOTION_API_KEY}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify({
        parent: { database_id: LEADS_DATABASE_ID },
        properties: {
          "Name": {
            title: [{ text: { content: body.name } }],
          },
          "Email": {
            email: body.email,
          },
          "Contact": {
            rich_text: [{ text: { content: body.company || "" } }],
          },
          "Lead Source": {
            select: { name: "Website" },
          },
          "Status": {
            status: { name: "New" },
          },
          "Services": {
            multi_select: services.map(s => ({ name: s })),
          },
          "Notes": {
            rich_text: [{
              text: {
                content: buildNotesContent(body)
              }
            }],
          },
        },
      }),
    });

    if (!notionResponse.ok) {
      const error = await notionResponse.text();
      console.error("Notion API error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to submit form" }),
        { status: 500, headers }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers }
    );

  } catch (error) {
    console.error("Contact form error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers }
    );
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
};
