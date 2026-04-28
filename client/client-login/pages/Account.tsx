import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";

export function Account() {
  const me = useQuery(api.users.whoami);
  const dashboard = useQuery(api.clientPortal.dashboard);
  const accounts = useQuery(api.accounts.list, me?.isAdmin ? {} : "skip");
  const accessSettings = useQuery(
    api.portalAccess.settings,
    me?.isAdmin || me?.isClientAdmin ? {} : "skip",
  );
  const { signOut } = useAuthActions();
  const clientNames = dashboard?.clients.map((client) => client.name).filter(Boolean) ?? [];
  const identity = clientNames.length > 0 ? clientNames.join(", ") : me?.email;

  return (
    <div className="account-page">
      <header className="account-page__header">
        <a className="account-page__brand" href="#/" aria-label="0001">
          0001
        </a>
        <div className="account-page__identity">
          <h1>Account</h1>
          <div className="account-page__identity-row">
            <p>{identity ?? "Loading..."}</p>
            <button className="account-page__sign-out" type="button" onClick={() => void signOut()}>
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="account-page__surface">
        {me?.isAdmin ? (
          <section className="account-page__accounts" aria-labelledby="account-directory-heading">
            <div className="account-page__accounts-head">
              <h2 id="account-directory-heading">Accounts</h2>
              <span>Role</span>
            </div>
            {accounts === undefined ? (
              <p className="account-page__empty">Loading accounts...</p>
            ) : accounts.length === 0 ? (
              <p className="account-page__empty">No synced accounts.</p>
            ) : (
              accounts.map((account) => (
                <div className="account-page__account-row" key={account._id}>
                  <span>
                    {account.name}
                    {account.email ? <small>{account.email}</small> : null}
                  </span>
                  <span>
                    <RolePill role={account.role ?? account.status} />
                  </span>
                </div>
              ))
            )}
          </section>
        ) : null}
        {me?.isAdmin || me?.isClientAdmin ? (
          <section className="account-page__access" aria-labelledby="access-settings-heading">
            <h2 id="access-settings-heading">Access</h2>
            {accessSettings === undefined ? (
              <p className="account-page__empty">Loading access settings...</p>
            ) : accessSettings.clients.length === 0 ? (
              <p className="account-page__empty">No managed clients.</p>
            ) : (
              accessSettings.clients.map(({ client, accounts, grants }) => (
                <ClientAccessSettings
                  key={client._id}
                  client={client}
                  accounts={accounts}
                  grants={grants}
                  canCreateClientAdmin={Boolean(me?.isAdmin)}
                />
              ))
            )}
          </section>
        ) : null}
      </main>
    </div>
  );
}

function ClientAccessSettings({
  client,
  grants,
  accounts,
  canCreateClientAdmin,
}: {
  client: {
    notionId: string;
    name: string;
    email?: string;
    allowedDomain?: string;
    domainAccessEnabled?: boolean;
  };
  grants: Array<{
    _id: string;
    emailNormalized: string;
    role: string;
    active: boolean;
  }>;
  accounts: Array<{
    _id: string;
    name: string;
    email?: string;
    emailNormalized?: string;
    role?: string;
    status?: string;
  }>;
  canCreateClientAdmin: boolean;
}) {
  const updateClientDomain = useMutation(api.portalAccess.updateClientDomain);
  const addGrant = useMutation(api.portalAccess.addGrant);
  const setGrantActive = useMutation(api.portalAccess.setGrantActive);
  const [domain, setDomain] = useState(client.allowedDomain ?? emailDomain(client.email) ?? "");
  const [enabled, setEnabled] = useState(Boolean(client.domainAccessEnabled));
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Client");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function saveDomain(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      await updateClientDomain({
        clientId: client.notionId,
        allowedDomain: domain,
        domainAccessEnabled: enabled,
      });
      setMessage("Domain access saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save domain access.");
    } finally {
      setBusy(false);
    }
  }

  async function submitInvite(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      await addGrant({
        clientId: client.notionId,
        email: inviteEmail,
        role: inviteRole,
      });
      setInviteEmail("");
      setMessage("Access added. No email was sent.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not add access.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="account-page__access-client">
      <form className="account-page__access-form" onSubmit={(event) => void saveDomain(event)}>
        <div className="account-page__client-domain-row">
          <h3>{client.name}</h3>
          <input value={domain} onChange={(event) => setDomain(event.target.value)} placeholder="example.com" />
        </div>
        <label className="account-page__checkbox">
          <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
          <span>Allow all emails from this domain</span>
        </label>
        <button type="submit" disabled={busy}>Save</button>
      </form>

      <form className="account-page__access-form" onSubmit={(event) => void submitInvite(event)}>
        <label>
          <span>Add user</span>
          <input
            type="email"
            value={inviteEmail}
            onChange={(event) => setInviteEmail(event.target.value)}
            placeholder={domain ? `name@${domain}` : "name@example.com"}
          />
        </label>
        <label>
          <span>Role</span>
          <select value={inviteRole} onChange={(event) => setInviteRole(event.target.value)}>
            <option>Client</option>
            {canCreateClientAdmin ? <option>Client admin</option> : null}
          </select>
        </label>
        <button type="submit" disabled={busy || !inviteEmail}>Add</button>
      </form>

      {message ? <p className="account-page__access-message">{message}</p> : null}

      <div className="account-page__grants">
        <div className="account-page__grant-head">
          <span>Email</span>
          <span>Role</span>
          <span>Status</span>
        </div>
        {accounts.length === 0 && grants.length === 0 ? (
          <p className="account-page__empty">No invited users.</p>
        ) : (
          <>
            {accounts.map((account) => (
              <div className="account-page__grant-row" key={account._id}>
                <span>{account.emailNormalized ?? account.email ?? account.name}</span>
                <span>
                  <RolePill role={account.role ?? account.status} />
                </span>
                <span>Notion</span>
              </div>
            ))}
            {grants.map((grant) => (
              <div className="account-page__grant-row" key={grant._id}>
                <span>{grant.emailNormalized}</span>
                <span>
                  <RolePill role={grant.role} />
                </span>
                <button
                  type="button"
                  onClick={() => void setGrantActive({ grantId: grant._id as any, active: !grant.active })}
                >
                  {grant.active ? "Active" : "Disabled"}
                </button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function RolePill({ role }: { role?: string }) {
  const label = roleLabel(role);
  if (!label) return null;
  return <span className="account-page__role-pill">{label}</span>;
}

function roleLabel(role: string | undefined) {
  const normalized = (role ?? "").trim().toLowerCase();
  if (!normalized) return "";
  return normalized.includes("admin") ? "Admin" : "User";
}

function emailDomain(email: string | undefined) {
  const normalized = (email ?? "").trim().toLowerCase();
  const at = normalized.lastIndexOf("@");
  return at === -1 ? "" : normalized.slice(at + 1);
}
