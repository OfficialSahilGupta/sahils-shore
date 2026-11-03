// ============================================================================
// Sahil's Shore: Places & Map Page Route
// Route: /places
// ============================================================================

import { PlacesContainer } from "@/components/places/PlacesContainer";

export const metadata = {
  title: "Places & Map | Sahil's Shore",
  description: "Interactive Leaflet & OpenStreetMap exploration hub.",
};

export default function PlacesPage() {
  return <PlacesContainer />;
}
