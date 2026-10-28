// Owns which card lists exist (⭐ Important … 🟢 Easy), their icons, labels,
// rows and empty-list messages: plain data, no database code. The menu sheet
// (a client component) and the My cards page both read it, so a list added
// here shows in both, and the menu never pulls Prisma into the browser bundle.
// The queries behind the lists are in lib/myCards.

export const CARD_LISTS = [
  { value: "important", row: "Remarks", icon: "⭐", label: "Important", empty: "Tap ⭐ Important on any card to keep it here." },
  { value: "favourite", row: "Remarks", icon: "❤️", label: "Favourite", empty: "Tap ❤️ Favourite on a card you like." },
  { value: "doubt", row: "Remarks", icon: "❓", label: "Doubt", empty: "Tap ❓ Doubt on a card you want to ask about or check again." },
  { value: "confident", row: "Remarks", icon: "💯", label: "Confident", empty: "Tap 💯 Confident on a card you are sure of." },
  { value: "notes", row: "Remarks", icon: "📝", label: "My notes", empty: "Write a note in a card's Remark box and it shows here." },
  { value: "known", row: "Answer", icon: "✅", label: "Known", empty: "Cards you mark Known come here." },
  { value: "unknown", row: "Answer", icon: "🔁", label: "Unknown", empty: "Cards you mark Unknown come here until you mark them Known." },
  { value: "hard", row: "Level", icon: "🔴", label: "Hard", empty: "Choose Hard as the level before you press Known, and the card comes here." },
  { value: "medium", row: "Level", icon: "🟡", label: "Medium", empty: "Known cards at level Medium come here. Known without a level counts as Medium." },
  { value: "easy", row: "Level", icon: "🟢", label: "Easy", empty: "Choose Easy as the level before you press Known, and the card comes here." },
] as const;
export type CardListKey = (typeof CARD_LISTS)[number]["value"];
export const LIST_ROWS = ["Remarks", "Answer", "Level"] as const;

export const LIST_SIZE = 100;

export function parseList(raw: string | undefined): CardListKey {
  return CARD_LISTS.find((l) => l.value === raw)?.value ?? "important";
}
