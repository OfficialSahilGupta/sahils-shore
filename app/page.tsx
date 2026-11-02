import React from "react";
import { TodayDashboard } from "@/components/dashboard/TodayDashboard";

export const metadata = {
  title: "Today | Sahil's Shore",
  description: "Personal Life OS dashboard with widgets, top priorities, habits, and unified timeline.",
};

export default function TodayDashboardPage() {
  return <TodayDashboard />;
}
