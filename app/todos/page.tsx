import { getModuleByRoute } from "@/lib/modules";
import { PlaceholderModule } from "@/components/common/PlaceholderModule";

export const metadata = {
  title: "Todos & Planner",
};

export default function TodosPage() {
  const currentModule = getModuleByRoute("/todos")!;
  return <PlaceholderModule module={currentModule} />;
}
