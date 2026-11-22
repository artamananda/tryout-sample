import { lazy } from "react";

// Loaded on demand: it carries the chart library.
const AnalyticsDashboard = lazy(() => import("./AnalyticsDashboard"));

const DashboardScreen = () => <AnalyticsDashboard />;

export default DashboardScreen;
