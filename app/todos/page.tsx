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
    <div className="w-full max-w-7xl mx-auto">
      <TodosContainer />
    </div>
  );
}
