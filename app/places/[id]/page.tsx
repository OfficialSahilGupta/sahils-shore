// ============================================================================
// Sahil's Shore: Place Detail Page Route
// Route: /places/[id]
// ============================================================================

import { PlaceDetailView } from "@/components/places/PlaceDetailView";

interface PageProps {
  params: {
    id: string;
  };
}

export const metadata = {
  title: "Place Details & Visits | Sahil's Shore",
};

export default function PlaceDetailPage({ params }: PageProps) {
  return <PlaceDetailView placeId={params.id} />;
}
