import { getModuleByRoute } from "@/lib/modules";
import { PlaceholderModule } from "@/components/common/PlaceholderModule";

export const metadata = {
  title: "Places & Map",
};

export default function PlacesPage() {
  const currentModule = getModuleByRoute("/places")!;
  return <PlaceholderModule module={currentModule} />;
}
