import { getModuleByRoute } from "@/lib/modules";
import { PlaceholderModule } from "@/components/common/PlaceholderModule";

export const metadata = {
  title: "Daily Tracker",
};

export default function TrackerPage() {
  const currentModule = getModuleByRoute("/tracker")!;
  return <PlaceholderModule module={currentModule} />;
}
