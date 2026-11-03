// ============================================================================
// Sahil's Shore: Media Vault Page Route
// Route: /media
// ============================================================================

import { MediaVaultContainer } from "@/components/media/MediaVaultContainer";

export const metadata = {
  title: "Media Vault & Memories | Sahil's Shore",
  description: "Google Drive synchronized photo and video memories vault.",
};

export default function MediaPage() {
  return <MediaVaultContainer />;
}
