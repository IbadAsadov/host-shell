import { GlobalShell } from "@components/GlobalShell";
import { NotFound } from "@components/NotFound";
import { RemoteBoundary } from "@components/RemoteBoundary";
import { lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ROUTES } from "./routes";

const AuthRoutes = lazy(() => import("authApp/AuthRoutes"));
const DashboardRoutes = lazy(() => import("dashboardApp/DashboardRoutes"));

export function AppRouter() {
  return (
    <BrowserRouter>
      <GlobalShell>
        <Routes>
          <Route path={ROUTES.ROOT} element={<Navigate to={ROUTES.DASHBOARD.ROOT} replace />} />

          <Route
            path={`${ROUTES.AUTH.ROOT}/*`}
            element={
              <RemoteBoundary name="Auth">
                <AuthRoutes />
              </RemoteBoundary>
            }
          />

          <Route
            path={`${ROUTES.DASHBOARD.ROOT}/*`}
            element={
              <RemoteBoundary name="Dashboard">
                <DashboardRoutes />
              </RemoteBoundary>
            }
          />

          <Route path={ROUTES.NOT_FOUND} element={<NotFound />} />
        </Routes>
      </GlobalShell>
    </BrowserRouter>
  );
}
