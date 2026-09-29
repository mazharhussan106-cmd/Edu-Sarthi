// Owns the "Examples in real life" part of side 3: the everyday, news-style
// and casual lines, plus the four fields that moved here from side 2 to give
// side 2's sentences room — mini conversation, action sequence, emotion and
// visual association.
//
// It deliberately does NOT hold any practice; CardPractice follows it on the
// same side. Plain server-safe markup, no state.

import { cn } from "@/lib/utils";
import { lines, type WordDetails } from "@/lib/wordCard";

// The sheet writes "Everyday: A teacher pauses…"; the label is already shown
// as the heading, so it is not repeated in the text.
function stripLabel(text: string): string {
  return text.replace(/^(everyday|news-style|news style|casual)\s*:\s*/i, "");
}

function Item({ title, tone, children }: { title: string; tone: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border px-3 py-2">
      <p className={cn("font-display text-[0.8em] font-bold", tone)}>{title}</p>
      <div className="mt-0.5 text-ink">{children}</div>
    </div>
  );
}

export function CardRealLife({ d }: { d: WordDetails }) {
  const real = [
    { title: "🏠 Everyday", tone: "text-tag-blue", text: d.everyday_scene },
    { title: "📰 News-style", tone: "text-tag-saffron", text: d.news_style_line },
    { title: "💬 Casual", tone: "text-tag-green", text: d.casual_conversation },
  ].filter((r) => r.text);
  const talk = lines(d.mini_conversation);

  if (!real.length && !talk.length && !d.action_sequence && !d.emotion_feel && !d.visual_association) return null;

  return (
    <section aria-labelledby="real-life" className="flex flex-col gap-2">
      <h3 id="real-life" className="font-display text-[0.75em] font-extrabold tracking-widest text-tag-navy">
        EXAMPLES IN REAL LIFE
      </h3>
      {real.map((r) => (
        <Item key={r.title} title={r.title} tone={r.tone}>
          {stripLabel(r.text!)}
        </Item>
      ))}
      {talk.length ? (
        <Item title="🗣 Mini Conversation" tone="text-tag-teal">
          {talk.map((l) => <p key={l}>{l}</p>)}
        </Item>
      ) : null}
      {d.action_sequence ? (
        <Item title="➜ Action Sequence" tone="text-tag-navy">
          {d.action_sequence}
        </Item>
      ) : null}
      {d.emotion_feel || d.visual_association ? (
        <div className="grid grid-cols-2 gap-2">
          {d.emotion_feel ? <Item title="Emotion / Feel" tone="text-tag-red">{d.emotion_feel}</Item> : null}
          {d.visual_association ? <Item title="Visual Association" tone="text-tag-amber">{d.visual_association}</Item> : null}
        </div>
      ) : null}
    </section>
  );
}
