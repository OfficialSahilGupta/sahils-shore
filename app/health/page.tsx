// ============================================================================
// Sahil's Shore: Health Mini-Trackers Page Route
// Route: /health
// ============================================================================

import { HealthContainer } from "@/components/health/HealthContainer";

export const metadata = {
  title: "Health Mini-Trackers | Sahil's Shore",
  description: "Toggleable trackers for water hydration, sleep quality, workout logs, and weight.",
};

export default function HealthPage() {
  return <HealthContainer />;
}
