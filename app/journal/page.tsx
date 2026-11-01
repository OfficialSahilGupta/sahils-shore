import { getModuleByRoute } from "@/lib/modules";
import { PlaceholderModule } from "@/components/common/PlaceholderModule";

export const metadata = {
  title: "Journal & Reflection",
};

export default function JournalPage() {
  const currentModule = getModuleByRoute("/journal")!;
  return <PlaceholderModule module={currentModule} />;
}
