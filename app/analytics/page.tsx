import { getModuleByRoute } from "@/lib/modules";
import { PlaceholderModule } from "@/components/common/PlaceholderModule";

export const metadata = {
  title: "Analytics",
};

export default function AnalyticsPage() {
  const currentModule = getModuleByRoute("/analytics")!;
  return <PlaceholderModule module={currentModule} />;
}
