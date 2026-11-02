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
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <TrackerContainer />
    </div>
  );
}
