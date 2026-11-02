import React from "react";
import { DayViewContainer } from "@/components/day/DayViewContainer";
import { todayIST } from "@/lib/date-utils";

interface DayPageProps {
  params: {
    date: string;
  };
}

export function generateMetadata({ params }: DayPageProps) {
  return {
    title: `Day View: ${params.date} | Sahil's Shore`,
    description: `Full unified timeline and daily totals for ${params.date}.`,
  };
}

export default function DayDatePage({ params }: DayPageProps) {
  const dateParam = params.date;
  const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(dateParam);
  const date = isValidDate ? dateParam : todayIST();

  return <DayViewContainer date={date} />;
}
