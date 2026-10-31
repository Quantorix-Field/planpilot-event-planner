import { lazy, Suspense } from "react";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Shell } from "./components/Shell";
import { useLocation } from "./router";
import { matchRoute, type Route } from "./routes";

const Home = lazy(() => import("./pages/Home"));
const NewPlan = lazy(() => import("./pages/NewPlan"));
const PlanDetail = lazy(() => import("./pages/PlanDetail"));
const Plans = lazy(() => import("./pages/Plans"));
const NotFound = lazy(() => import("./pages/NotFound"));

function PageLoading() {
  return (
    <div className="container page">
      <p className="status" role="status">
        <span className="spinner" aria-hidden="true" />
        Loading
      </p>
    </div>
  );
}

function renderRoute(route: Route) {
  switch (route.name) {
    case "home":
      return <Home />;
    case "plan":
      return <NewPlan />;
    case "plans":
      return <Plans />;
        case "planDetail":
      return <PlanDetail id={route.id} />;
    case "notFound":
      return <NotFound kind="page" />;
  }
}

export default function App() {
  const { pathname, search } = useLocation();

  return (
    <Shell>
      <ErrorBoundary key={pathname + search}>
        <Suspense fallback={<PageLoading />}>{renderRoute(matchRoute(pathname))}</Suspense>
      </ErrorBoundary>
    </Shell>
  );
}
