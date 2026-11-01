import { getModuleByRoute } from "@/lib/modules";
import { PlaceholderModule } from "@/components/common/PlaceholderModule";

export const metadata = {
  title: "Notes / Second Brain",
};

export default function NotesPage() {
  const currentModule = getModuleByRoute("/notes")!;
  return <PlaceholderModule module={currentModule} />;
}
