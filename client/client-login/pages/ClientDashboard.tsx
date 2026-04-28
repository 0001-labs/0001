import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export function ClientDashboard() {
  const dashboard = useQuery(api.clientPortal.dashboard);

  if (!dashboard) return <p className="muted">Loading…</p>;

  if (dashboard.clients.length === 0) {
    return (
      <div className="portal-empty">
        <h1>No Link access</h1>
        <p>
          Signed in as {dashboard.email}. This email is not attached to Link yet.
        </p>
        <a href="/contact.html">Contact 0001</a>
      </div>
    );
  }

  const primaryClient = dashboard.clients[0];

  return (
    <>
      <div className="portal-heading">
        <h1>{primaryClient.name}</h1>
        {primaryClient.stage ? <span className="portal-pill">{primaryClient.stage}</span> : null}
        {primaryClient.status ? <span className="portal-pill">{primaryClient.status}</span> : null}
      </div>

      <div className="portal-grid" style={{ marginBottom: 24 }}>
        <StatCard label="Projects" value={dashboard.projects.length} />
        <StatCard label="SOWs" value={dashboard.sows.length} />
        <StatCard label="Contracts" value={dashboard.contracts.length} />
      </div>

      <section className="portal-card" style={{ marginBottom: 24 }}>
        <h2 className="portal-section-title">Projects</h2>
        {dashboard.projects.length === 0 ? (
          <p className="muted">No linked projects yet.</p>
        ) : (
          <table className="portal-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Website</th>
                <th>Github</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.projects.map((project) => (
                <tr key={project._id}>
                  <td>
                    <a href={`#/projects/${project._id}`}>{project.name}</a>
                  </td>
                  <td>{project.status ?? "-"}</td>
                  <td>
                    {project.website ? (
                      <a
                        href={project.website.startsWith("http") ? project.website : `https://${project.website}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {project.website}
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>
                    {project.github ? (
                      <a href={project.github} target="_blank" rel="noreferrer">
                        repo
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <div className="portal-split">
        <section className="portal-card">
          <h2 className="portal-section-title">SOWs</h2>
          <SimpleRows
            empty="No linked SOWs yet."
            rows={dashboard.sows.map((sow) => ({
              id: sow._id,
              title: sow.title,
              meta: [sow.status, sow.value != null ? sow.value.toLocaleString() : null].filter(Boolean).join(" · "),
            }))}
          />
        </section>

        <section className="portal-card">
          <h2 className="portal-section-title">Contracts</h2>
          <SimpleRows
            empty="No linked contracts yet."
            rows={dashboard.contracts.map((contract) => ({
              id: contract._id,
              title: contract.title,
              meta: [contract.status, contract.signedAt ? formatDate(contract.signedAt) : null]
                .filter(Boolean)
                .join(" · "),
            }))}
          />
        </section>
      </div>
    </>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="portal-card portal-stat">
      <span className="portal-stat__value">{value}</span>
      <span className="portal-stat__label">{label}</span>
    </div>
  );
}

function SimpleRows({
  empty,
  rows,
}: {
  empty: string;
  rows: Array<{ id: string; title: string; meta: string }>;
}) {
  if (rows.length === 0) return <p className="muted">{empty}</p>;

  return (
    <div className="portal-row-list">
      {rows.map((row) => (
        <div className="portal-row-list__item" key={row.id}>
          <span>{row.title}</span>
          {row.meta ? <small>{row.meta}</small> : null}
        </div>
      ))}
    </div>
  );
}

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString();
}
