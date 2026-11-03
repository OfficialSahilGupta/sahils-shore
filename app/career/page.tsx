import { CareerContainer } from "@/components/career/CareerContainer";

export const metadata = {
  title: "Resume & Career Hub | Shore",
  description: "Job application Kanban pipeline, resume versions, achievement bullet bank, and STAR interview stories.",
};

export default function CareerPage() {
  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <CareerContainer />
    </div>
  );
}
