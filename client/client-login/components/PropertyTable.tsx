// Renders a row of Notion property JSON as a two-column key/value table.
// Resilient to schema drift: unrecognized property types fall back to JSON.

export function PropertyTable({ raw }: { raw: Record<string, any> | null | undefined }) {
  if (!raw) return <p className="muted">No properties.</p>;

  const entries = Object.entries(raw);

  return (
    <table className="portal-table">
      <tbody>
        {entries.map(([name, prop]) => (
          <tr key={name}>
            <th style={{ width: 200 }}>{name}</th>
            <td>{renderProperty(prop)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function renderProperty(prop: any): React.ReactNode {
  if (prop == null) return <span className="muted">—</span>;

  switch (prop.type) {
    case "title":
    case "rich_text":
      return (prop[prop.type] ?? []).map((t: any) => t.plain_text).join("") || "—";
    case "status":
      return prop.status?.name ? <span className="portal-pill">{prop.status.name}</span> : "—";
    case "select":
      return prop.select?.name ? <span className="portal-pill">{prop.select.name}</span> : "—";
    case "multi_select":
      return (prop.multi_select ?? []).map((s: any) => (
        <span key={s.id ?? s.name} className="portal-pill" style={{ marginRight: 4 }}>
          {s.name}
        </span>
      ));
    case "number":
      return prop.number ?? "—";
    case "checkbox":
      return prop.checkbox ? "✓" : "—";
    case "url":
      return prop.url ? (
        <a href={prop.url} target="_blank" rel="noreferrer">
          {prop.url}
        </a>
      ) : (
        "—"
      );
    case "email":
      return prop.email ? <a href={`mailto:${prop.email}`}>{prop.email}</a> : "—";
    case "phone_number":
      return prop.phone_number ?? "—";
    case "date":
      return prop.date?.start ?? "—";
    case "relation":
      return (prop.relation ?? []).length
        ? `${prop.relation.length} related`
        : "—";
    case "files": {
      const f = prop.files?.[0];
      const url = f?.external?.url ?? f?.file?.url;
      return url ? (
        <a href={url} target="_blank" rel="noreferrer">
          {f.name ?? "file"}
        </a>
      ) : (
        "—"
      );
    }
    case "people":
      return (prop.people ?? []).map((p: any) => p.name ?? p.id).join(", ") || "—";
    default:
      return <code style={{ fontSize: 11 }}>{JSON.stringify(prop)}</code>;
  }
}
