declare module "authApp/AuthRoutes" {
  import type { ComponentType } from "react";
  const AuthRoutes: ComponentType;
  export default AuthRoutes;
}

declare module "authApp/LoginForm" {
  import type { ComponentType } from "react";
  const LoginForm: ComponentType;
  export default LoginForm;
}

declare module "authApp/RegisterForm" {
  import type { ComponentType } from "react";
  const RegisterForm: ComponentType;
  export default RegisterForm;
}

// ─── dashboardApp (remote-dashboard, port 3002) ───────────────────────────────

declare module "dashboardApp/DashboardRoutes" {
  import type { ComponentType } from "react";
  const DashboardRoutes: ComponentType;
  export default DashboardRoutes;
}

declare module "dashboardApp/DashboardHome" {
  import type { ComponentType } from "react";
  const DashboardHome: ComponentType;
  export default DashboardHome;
}

declare module "dashboardApp/AnalyticsWidget" {
  import type { ComponentType } from "react";
  const AnalyticsWidget: ComponentType;
  export default AnalyticsWidget;
}
