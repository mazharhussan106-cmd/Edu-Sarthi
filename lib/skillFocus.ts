// Owns the list of skills a speaking module can say it practises: the five
// rubric scores a teacher gives. Plain data, so the admin form (a client
// component) and the routes read the same list.
//
// A module's focus is optional. Untagged modules still show everywhere; the
// tag only lets "Practise fluency" on the dashboard open the right ones.

export const SKILL_FOCUS = [
  { value: "pronunciation", label: "Pronunciation" },
  { value: "grammar", label: "Grammar" },
  { value: "fluency", label: "Fluency" },
  { value: "vocabulary", label: "Vocabulary" },
  { value: "confidence", label: "Confidence" },
] as const;

export type SkillFocus = (typeof SKILL_FOCUS)[number]["value"];

export const SKILL_FOCUS_VALUES = SKILL_FOCUS.map((s) => s.value) as [SkillFocus, ...SkillFocus[]];

export function parseFocus(raw: string | undefined | null): SkillFocus | null {
  return SKILL_FOCUS_VALUES.find((v) => v === raw) ?? null;
}

export function focusLabel(v: SkillFocus): string {
  return SKILL_FOCUS.find((s) => s.value === v)!.label;
}
