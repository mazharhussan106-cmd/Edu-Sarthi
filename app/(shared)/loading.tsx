// Owns the loading state for every page in this route group: grey placeholder
// blocks inside the normal shell (see components/layout/RouteLoading).
// It deliberately has no page-specific content.

import { RouteLoading } from "@/components/layout/RouteLoading";

export default function Loading() {
  return <RouteLoading />;
}
