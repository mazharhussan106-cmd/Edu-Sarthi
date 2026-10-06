// Owns the error state for every page in this route group: a plain message,
// Try again, and a link home (see components/layout/RouteError).
// It deliberately never shows the error text to the visitor.

"use client";

import { RouteError } from "@/components/layout/RouteError";

export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <RouteError error={error} retry={retry} home="/dashboard" />;
}
