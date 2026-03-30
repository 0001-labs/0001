interface Env {
  NOTION_API_KEY: string;
  NOTION_DATABASE_ID: string;
}

interface ContactForm {
  name: string;
  company?: string;
  email: string;
  phone?: string;
  message: string;
  topics: string[];
  techstack?: string[];
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  try {
    const body: ContactForm = await request.json();

    // Validate required fields
    if (!body.name || !body.email) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers }
      );
    }

    // Combine services and techstack with prefixes to match Notion options
    const allServices = [
      ...(body.topics || []).map(t => `Services: ${t}`),
      ...(body.techstack || []).map(t => `Tech stack: ${t}`),
    ];

    // Build properties
    const properties: Record<string, any> = {
      // Name (title) = Company name
      "Name": {
        title: [{ text: { content: body.company || body.name || "Unknown" } }],
      },
      // Contact = Person's name
      "Contact": {
        rich_text: [{ text: { content: body.name || "" } }],
      },
      // Email
      "Email": {
        email: body.email,
      },
      // Status
      "Status": {
        status: { name: "New" },
      },
      // Lead Source
      "Lead Source": {
        select: { name: "Website" },
      },
      // Services
      "Services": {
        multi_select: allServices.map(s => ({ name: s })),
      },
      // Message
      "Message": {
        rich_text: [{ text: { content: body.message || "" } }],
      },
    };

    // Add phone only if provided
    if (body.phone) {
      properties["Phone"] = { phone_number: body.phone };
    }

    // Create lead in Notion
    const notionResponse = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.NOTION_API_KEY}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify({
        parent: { database_id: env.NOTION_DATABASE_ID },
        properties,
        // Add message as page content
        children: body.message ? [
          {
            object: "block",
            type: "paragraph",
            paragraph: {
              rich_text: [{ type: "text", text: { content: body.message } }],
            },
          },
        ] : [],
      }),
    });

    if (!notionResponse.ok) {
      const error = await notionResponse.text();
      console.error("Notion API error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to save", details: error }),
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
      JSON.stringify({ error: "Internal server error", message: String(error) }),
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
