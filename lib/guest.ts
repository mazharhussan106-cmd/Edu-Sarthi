// Owns creating a guest account: a real but anonymous student row that can
// study the flashcards and nothing else.
//
// It deliberately does NOT decide what a guest may do. Every route that a guest
// must not reach asks requireUser({ member: true }) in lib/apiUser.ts; keeping
// that rule in one place means a new route cannot quietly forget it here.

import { prisma } from "@/lib/prisma";
import { generatePublicId } from "@/lib/publicId";

// Anyone can press "Continue as guest" without proving anything, so without a
// ceiling a script could fill the User table. A shared cap per hour is crude
// but needs no IP address, which the sign-in handler does not receive.
const HOURLY_CAP = 300;

/// A new guest, or null when the hourly cap is reached.
export async function createGuestUser() {
  const since = new Date(Date.now() - 60 * 60 * 1000);
  const recent = await prisma.user.count({
    where: { isGuest: true, createdAt: { gt: since } },
  });
  if (recent >= HOURLY_CAP) return null;

  // One retry on a publicId collision; a second in a row is a bug.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await prisma.user.create({
        data: {
          name: "Guest",
          isGuest: true,
          // No email to verify, and being held at /verify would make guests
          // unusable. This does not make them "members": see requireUser.
          emailVerified: new Date(),
          publicId: generatePublicId(),
          role: "STUDENT",
        },
      });
    } catch (err) {
      if (attempt === 1) throw err;
    }
  }
  return null;
}
