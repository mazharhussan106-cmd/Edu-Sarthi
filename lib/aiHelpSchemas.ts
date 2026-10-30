// Owns the shape of a question to the help chatbot: the question itself and
// the last few turns the browser kept. The same schema checks the box on the
// Help page and the route, so a too-long question is caught before it is sent.
//
// It deliberately trusts nothing in `history`: those turns come from the
// browser and are passed to the model only as the person's own conversation,
// capped in number and length. No model SDK here, so the browser can import it.

import { z } from "zod";

export const HELP_LIMITS = { questionChars: 500, answerChars: 2000, turns: 6 } as const;

const turn = z.discriminatedUnion("role", [
  z.object({ role: z.literal("user"), text: z.string().trim().min(1).max(HELP_LIMITS.questionChars) }),
  z.object({ role: z.literal("assistant"), text: z.string().trim().min(1).max(HELP_LIMITS.answerChars) }),
]);

export const helpAskSchema = z.object({
  question: z
    .string()
    .trim()
    .min(2, "Type your question first.")
    .max(HELP_LIMITS.questionChars, `Keep your question under ${HELP_LIMITS.questionChars} characters.`),
  history: z.array(turn).max(HELP_LIMITS.turns).default([]),
});

export type HelpTurn = z.infer<typeof turn>;
