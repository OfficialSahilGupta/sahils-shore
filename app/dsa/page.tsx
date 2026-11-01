import { getModuleByRoute } from "@/lib/modules";
import { PlaceholderModule } from "@/components/common/PlaceholderModule";

export const metadata = {
  title: "DSA Tracker",
};

export default function DSAPage() {
  const currentModule = getModuleByRoute("/dsa")!;
  return <PlaceholderModule module={currentModule} />;
}
