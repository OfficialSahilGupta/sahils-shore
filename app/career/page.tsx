import { getModuleByRoute } from "@/lib/modules";
import { PlaceholderModule } from "@/components/common/PlaceholderModule";

export const metadata = {
  title: "Resume & Career Hub",
};

export default function CareerPage() {
  const currentModule = getModuleByRoute("/career")!;
  return <PlaceholderModule module={currentModule} />;
}
