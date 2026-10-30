// Owns the browser side of the student-door cookie (lib/portals
// STUDENT_DOOR_COOKIE): set just before signing in at the student door, cleared
// at a staff door or when the note is dismissed. DoorNote reads it on the
// server.
//
// It deliberately carries no identity: "1" only says which door was used last.

import { STUDENT_DOOR_COOKIE, type Portal } from "@/lib/portals";

export function markStudentDoor(portal: Portal) {
  // A day is enough: the note is for the landing right after this sign-in.
  document.cookie =
    portal === "student"
      ? `${STUDENT_DOOR_COOKIE}=1; Path=/; Max-Age=86400; SameSite=Lax`
      : `${STUDENT_DOOR_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function clearStudentDoor() {
  document.cookie = `${STUDENT_DOOR_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}
