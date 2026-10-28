// Owns the request shapes for changing the sign-in email and the phone number.
// The same schemas check the Settings forms in the browser (instant feedback)
// and the routes on the server (enforcement).
//
// It deliberately holds no rules that need the database: whether an address
// is taken, the 60-second wait and the 3-changes-in-30-days limit live in
// lib/emailChange, and are never revealed by these messages.

import { z } from "zod";

import { email, phoneNumber } from "@/lib/validations";

const code = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "Enter the 6-digit code from the email");

export const emailChangeSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("start"),
    newEmail: email,
    // Optional here because accounts without a password prove themselves with
    // a code to their current address instead; the server decides which.
    password: z.string().max(200).optional(),
  }),
  z.object({
    action: z.literal("confirm"),
    code,
    currentCode: code.optional(),
  }),
]);

export const phoneSchema = z.object({
  // Empty means "remove my number".
  phone: z
    .string()
    .transform((v) => v.replace(/[\s-]/g, ""))
    .pipe(phoneNumber.or(z.literal(""))),
});

export type EmailChangeInput = z.infer<typeof emailChangeSchema>;
