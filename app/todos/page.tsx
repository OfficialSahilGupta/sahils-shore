// ============================================================================
// Sahil's Shore: Todos & Planner Page
// ============================================================================

import { TodosContainer } from "@/components/todos/TodosContainer";

export const metadata = {
  title: "Todos & Planner",
  description: "Tasks, Kanban, Calendar, and time-blocking day planner.",
};

export default function TodosPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <TodosContainer />
    </div>
  );
}
