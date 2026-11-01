import { getModuleByRoute } from "@/lib/modules";
import { PlaceholderModule } from "@/components/common/PlaceholderModule";

export const metadata = {
  title: "Expense Tracker",
};

export default function ExpensesPage() {
  const currentModule = getModuleByRoute("/expenses")!;
  return <PlaceholderModule module={currentModule} />;
}
