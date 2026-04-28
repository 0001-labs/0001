import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export function Clients() {
  const clients = useQuery(api.clients.list);

  return (
    <div className="admin-clients">
      <header className="admin-clients__header">
        <a className="admin-clients__brand" href="#/" aria-label="0001">
          0001
        </a>
        <nav className="admin-clients__nav" aria-label="Account">
          <span>Clients</span>
          <a className="admin-clients__account" href="#/account">Account</a>
        </nav>
      </header>
      <main className="admin-clients__surface">
        <div className="admin-clients__table" role="table" aria-label="Clients">
          <div className="admin-clients__row admin-clients__row--head" role="row">
            <div role="columnheader">Clients</div>
            <div role="columnheader">Status</div>
          </div>
          {clients === undefined ? (
            <div className="admin-clients__row" role="row">
              <div role="cell">Loading...</div>
              <div role="cell">-</div>
            </div>
          ) : clients.length === 0 ? (
            <div className="admin-clients__row" role="row">
              <div role="cell">No clients</div>
              <div role="cell">-</div>
            </div>
          ) : (
            clients.map((client) => (
              <div className="admin-clients__row" role="row" key={client._id}>
                <div role="cell">
                  <a href={`#/clients/${client._id}`}>{client.name}</a>
                </div>
                <div className={statusClass(client.status)} role="cell">
                  {client.status ?? "Active"}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

function statusClass(status: string | undefined) {
  const normalized = (status ?? "active").trim().toLowerCase();
  return normalized.includes("archiv")
    ? "admin-clients__status admin-clients__status--archived"
    : "admin-clients__status admin-clients__status--active";
}
