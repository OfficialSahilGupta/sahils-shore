import { getModuleByRoute } from "@/lib/modules";
import { PlaceholderModule } from "@/components/common/PlaceholderModule";

export const metadata = {
  title: "Food Diary",
};

export default function FoodPage() {
  const currentModule = getModuleByRoute("/food")!;
  return <PlaceholderModule module={currentModule} />;
}
