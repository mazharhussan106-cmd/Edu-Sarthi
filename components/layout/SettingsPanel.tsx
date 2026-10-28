// Owns the content of the header's settings dropdown: the same sections as the
// Settings page, loaded on the server and handed to the header as a
// ready-made element.
//
// It renders the page's own SettingsSections rather than a copy, so the page
// and the dropdown can never drift apart. It deliberately renders nothing for
// a signed-out visitor, where the header falls back to its small theme picker.

import { auth } from "@/lib/auth";
import { SettingsSections } from "@/app/(shared)/settings/SettingsSections";

export async function SettingsPanel() {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;

  return <SettingsSections userId={id} variant="panel" />;
}
