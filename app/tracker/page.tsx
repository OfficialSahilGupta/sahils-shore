// ============================================================================
// Sahil's Shore: Daily Tracker & Habits Page
// ============================================================================

import { TrackerContainer } from "@/components/tracker/TrackerContainer";

export const metadata = {
  title: "Daily Tracker & Habits",
  description: "Pomodoro focus timer, activities, streaks, and habits checklist.",
};

export default function TrackerPage() {
  return (
    <div className="w-full max-w-7xl mx-auto">
      <TrackerContainer />
    </div>
  );
}
