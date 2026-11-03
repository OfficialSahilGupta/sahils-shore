// ============================================================================
// Sahil's Shore: Notes / Second Brain Page Route
// Route: /notes
// ============================================================================

import { NotesContainer } from "@/components/notes/NotesContainer";

export const metadata = {
  title: "Notes / Second Brain | Sahil's Shore",
  description: "Markdown knowledge base with tags, [[backlinks]], full-text search, and quick pinning.",
};

export default function NotesPage() {
  return <NotesContainer />;
}
