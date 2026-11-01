import { getModuleByRoute } from "@/lib/modules";
import { PlaceholderModule } from "@/components/common/PlaceholderModule";

export const metadata = {
  title: "Health Mini-Trackers",
};

export default function HealthPage() {
  const currentModule = getModuleByRoute("/health")!;
  return <PlaceholderModule module={currentModule} />;
}
