import { ExpensesContainer } from "@/components/expenses/ExpensesContainer";
import { VaultProtectionGate } from "@/components/privacy/VaultProtectionGate";

export const metadata = {
  title: "Expense Tracker | Sahil's Shore",
  description: "Paise-accurate cashflow, category budgets, and spending insights.",
};

export default function ExpensesPage() {
  return (
    <VaultProtectionGate module="expenses" moduleName="Expense Tracker">
      <ExpensesContainer />
    </VaultProtectionGate>
  );
}
