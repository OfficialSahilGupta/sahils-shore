// ============================================================================
// Sahil's Shore: Analytics & Personal Intelligence Page
// ============================================================================

import React from "react";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";

export const metadata = {
  title: "Analytics & Insights | Sahil's Shore",
  description:
    "Productivity score, skill hours, 24x7 focus heatmap, money analytics, and life correlations.",
};

export default function AnalyticsPage() {
  return <AnalyticsDashboard />;
}
