import { getModuleByRoute } from "@/lib/modules";
import { PlaceholderModule } from "@/components/common/PlaceholderModule";

export const metadata = {
  title: "German Learning Hub",
};

export default function GermanPage() {
  const currentModule = getModuleByRoute("/german")!;
  return <PlaceholderModule module={currentModule} />;
}
