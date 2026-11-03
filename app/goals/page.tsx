// ============================================================================
// Sahil's Shore: Goals Page Route
// Route: /goals
// ============================================================================

import { GoalsContainer } from "@/components/goals/GoalsContainer";

export const metadata = {
  title: "Goals & Milestones | Sahil's Shore",
  description: "Long-term aspirations, milestones, and direct linkage to daily tasks and habits.",
};

export default function GoalsPage() {
  return <GoalsContainer />;
}
