import { getModuleByRoute } from "@/lib/modules";
import { PlaceholderModule } from "@/components/common/PlaceholderModule";

export const metadata = {
  title: "Full-Stack Learning Hub",
};

export default function LearningPage() {
  const currentModule = getModuleByRoute("/learning")!;
  return <PlaceholderModule module={currentModule} />;
}
