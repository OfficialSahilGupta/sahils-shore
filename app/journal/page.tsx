// ============================================================================
// Sahil's Shore: Journal & Reflection Page Route
// Route: /journal
// ============================================================================

import { JournalContainer } from "@/components/journal/JournalContainer";
import { VaultProtectionGate } from "@/components/privacy/VaultProtectionGate";

export const metadata = {
  title: "Journal & Reflection | Sahil's Shore",
  description: "Daily mood & energy tracking, gratitude prompts, weekly reflections, and wins log.",
};

export default function JournalPage() {
  return (
    <VaultProtectionGate module="journal" moduleName="Journal & Reflection">
      <JournalContainer />
    </VaultProtectionGate>
  );
}
