import { redirect } from "next/navigation";
import { todayIST } from "@/lib/date-utils";

export default function DayRootPage() {
  redirect(`/day/${todayIST()}`);
}
