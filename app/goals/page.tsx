import { getModuleByRoute } from "@/lib/modules";
import { PlaceholderModule } from "@/components/common/PlaceholderModule";

export const metadata = {
  title: "Goals",
};

export default function GoalsPage() {
  const currentModule = getModuleByRoute("/goals")!;
  return <PlaceholderModule module={currentModule} />;
}
