import { Metadata } from "next";
import { WorkoutContainer } from "@/components/workout/WorkoutContainer";

export const metadata: Metadata = {
  title: "Workout & Fitness | Sahil's Shore",
  description:
    "Track daily exercises, sets, weights, volume, daily physique photos, and strength personal records.",
};

export default function WorkoutPage() {
  return <WorkoutContainer />;
}
