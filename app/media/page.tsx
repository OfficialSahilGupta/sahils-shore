import { getModuleByRoute } from "@/lib/modules";
import { PlaceholderModule } from "@/components/common/PlaceholderModule";

export const metadata = {
  title: "Life Log / Media Vault",
};

export default function MediaPage() {
  const currentModule = getModuleByRoute("/media")!;
  return <PlaceholderModule module={currentModule} />;
}
