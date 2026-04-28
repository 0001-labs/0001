import { useEffect, useState, type ReactNode } from "react";
import { Authenticated, Unauthenticated, AuthLoading, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { SignIn } from "./pages/SignIn";
import { Clients } from "./pages/Clients";
import { ClientDetail } from "./pages/ClientDetail";
import { ClientDashboard } from "./pages/ClientDashboard";
import { ProjectDetail } from "./pages/ProjectDetail";
import { Account } from "./pages/Account";

type Route =
  | { name: "home" }
  | { name: "account" }
  | { name: "client"; id: string }
  | { name: "project"; id: string }
  | { name: "projectPage"; id: string; pageId: string };

function parseHash(hash: string): Route {
  const clean = hash.replace(/^#\/?/, "");
  const [top, param, child, childId] = clean.split("/");
  switch (top) {
    case "account":
      return { name: "account" };
    case "clients":
      return param ? { name: "client", id: param } : { name: "home" };
    case "projects":
      if (param && child === "pages" && childId) {
        return { name: "projectPage", id: param, pageId: childId };
      }
      return param ? { name: "project", id: param } : { name: "home" };
    case "":
    default:
      return { name: "home" };
  }
}

function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}

export function App() {
  return (
    <>
      <AuthLoading>
        <AuthLayout>
          <h1>Checking session</h1>
          <p className="muted">Loading your session…</p>
        </AuthLayout>
      </AuthLoading>
      <Unauthenticated>
        <SignIn />
      </Unauthenticated>
      <Authenticated>
        <PortalShell />
      </Authenticated>
    </>
  );
}

function PortalShell() {
  const me = useQuery(api.users.whoami);
  const route = useHashRoute();

  if (me === undefined) {
    return (
      <AuthLayout>
        <h1>Checking session</h1>
        <p className="muted">Loading your session…</p>
      </AuthLayout>
    );
  }

  if (route.name === "account") return <Account />;

  if (me?.isAdmin) {
    if (route.name === "client") return <ClientDetail id={route.id} />;
    if (route.name === "project" || route.name === "projectPage") {
      return <ProjectDetail id={route.id} pageId={route.name === "projectPage" ? route.pageId : undefined} />;
    }
    return <Clients />;
  }

  if (route.name === "project" || route.name === "projectPage") {
    return <ProjectDetail id={route.id} pageId={route.name === "projectPage" ? route.pageId : undefined} />;
  }

  return <ClientDashboard />;
}

function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="portal-auth-shell">
      <div className="portal-auth">{children}</div>
    </div>
  );
}
