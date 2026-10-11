"""The card types this skill knows, and the fields on each of a card's three sides.

This file is the single source of truth: build_xlsx.py uses it for the
columns, audit_cards.py uses it for the checks, and `python card_types.py`
prints the field guide (the same text as references/card-types.md).

Every card has three sides:
  Side 1 - Recognition:        the item itself plus cues; never the answer.
  Side 2 - Understanding:      meaning, explanation, examples, mistakes, links.
  Side 3 - Real life & Practice: application and self-test built from the card.

Field tuple: (key, column label, guidance for the writer).
"""

COMMON = [
    ("id", "ID", "Short, stable, unique: subject prefix + number, e.g. PHY-007."),
    ("topic", "Topic", "Section/sub-topic the card belongs to, as the source names it."),
    ("level", "Level", "Basic, Core or Advanced, from the learner's point of view."),
    ("order", "Study order", "1..N. Prerequisites first, then easy to hard."),
    ("source", "Source", "Where it came from: 'File p.12', 'File §3.2', or 'Claude knowledge'."),
]

MCQ = [
    ("mcq_question", "MCQ question", "Tests understanding, not word-matching. Must not be answerable from the question alone."),
    ("mcq_options", "MCQ options", "Exactly 'A) … B) … C) … D) …'. Plausible distractors from the same category."),
    ("mcq_answer", "MCQ answer", "One letter, A-D."),
    ("mcq_why", "Why that answer", "One line: why it is right (and, if useful, why the tempting one is wrong)."),
]
FILL = [("fill_blank", "Fill the blank", "'Sentence with ___ → answer'. The answer must fit the blank exactly.")]
EXPLAIN = [("explain_task", "Explain it yourself", "A prompt that makes the learner explain or teach it in their own words.")]

TYPES = {
    "concept": {
        "label": "Concept",
        "use_for": "Ideas, definitions and principles: science, maths, economics, computer science, psychology, any 'what is X / why does X happen'.",
        "sides": {
            1: [
                ("term", "Term / concept", "The name of the concept, exactly as the source uses it."),
                ("cue", "Recall cue", "A question that makes the learner retrieve the meaning, e.g. 'What does it measure, and why does it matter?' Never contains the answer."),
                ("category", "Category", "What kind of thing it is (law, process, quantity, theory…)."),
                ("visual", "Picture it", "A diagram or image described in words that helps recall."),
                ("memory_hook", "Memory hook", "Mnemonic, story or link that makes it stick. Must be true to the concept."),
            ],
            2: [
                ("definition", "Definition (simple)", "One or two plain sentences. No jargon the learner hasn't met."),
                ("explanation", "How / why it works", "The reasoning behind it in 2-4 sentences."),
                ("formula_rule", "Formula / rule", "Formula with symbols explained, or the key rule. Empty if none."),
                ("example_1", "Example 1", "A concrete example."),
                ("example_2", "Example 2", "A different kind of example, not a reword of example 1."),
                ("real_world", "In real life", "Where the learner meets this in daily life or work."),
                ("misconception", "Common mistake", "'✗ wrong belief → ✓ correct idea'. A real belief people hold, never a label."),
                ("contrast", "Don't confuse with", "'X vs Y: difference in one line'."),
                ("related", "Related concepts", "2-4 linked concepts, comma-separated. No opposites mislabelled as similar."),
            ],
            3: MCQ + FILL + [
                ("apply", "Apply it", "'Question or small numerical → worked answer'."),
            ] + EXPLAIN,
        },
        "required": ["term", "cue", "definition", "explanation", "example_1", "example_2", "misconception", "mcq_question", "mcq_options", "mcq_answer", "fill_blank", "apply"],
        "front": ["term", "cue", "category", "visual", "memory_hook"],
        "answers": ["definition"],
    },
    "fact_event": {
        "label": "Fact / Event",
        "use_for": "History, polity, geography, GK, current affairs, biographies: who / what / when / where facts and events.",
        "sides": {
            1: [
                ("item", "Event / fact", "Short name of the event, place, person or fact."),
                ("cue", "Recall cue", "A question about it ('Why did it happen and what changed?'). Never contains the answer."),
                ("when", "When", "Date or period. Leave empty if not time-bound."),
                ("where", "Where", "Place, if relevant."),
                ("memory_hook", "Memory hook", "A link, story or number trick that makes it stick."),
            ],
            2: [
                ("what", "What happened / what it is", "2-3 plain sentences."),
                ("who", "Key people / bodies", "Names with their role."),
                ("causes", "Causes / background", "Why it happened or exists."),
                ("effects", "Effects / significance", "What changed, why it matters, why exams ask about it."),
                ("key_terms", "Key terms", "Terms the learner must know, each with a 3-6 word gloss."),
                ("misconception", "Common mistake", "'✗ wrong belief → ✓ correct fact'. A real confusion, never a label."),
                ("connect", "Connect it", "Link to an earlier/later event or another topic."),
            ],
            3: MCQ + FILL + [
                ("sequence", "Put in order / match", "A short ordering or matching task with its answer after '→'."),
                ("short_answer", "Short answer", "'Exam-style question → model answer in 2-3 lines'."),
            ] + EXPLAIN,
        },
        "required": ["item", "cue", "what", "causes", "effects", "misconception", "mcq_question", "mcq_options", "mcq_answer", "fill_blank", "short_answer"],
        "front": ["item", "cue", "when", "where", "memory_hook"],
        "answers": ["what"],
    },
    "process": {
        "label": "Process / Procedure",
        "use_for": "Anything with steps: biological processes, chemical reactions, algorithms, legal procedures, how-to skills.",
        "sides": {
            1: [
                ("process", "Process", "Name of the process."),
                ("cue", "Recall cue", "'What goes in, what comes out, and what are the steps?' Never contains the answer."),
                ("where", "Where it happens", "Organ, device, system or setting."),
                ("visual", "Picture it", "A flow or diagram described in words."),
                ("memory_hook", "Memory hook", "Mnemonic for the order of steps."),
            ],
            2: [
                ("purpose", "Purpose", "Why the process exists, in one sentence."),
                ("inputs_outputs", "Inputs → Outputs", "'inputs → outputs'."),
                ("steps", "Steps", "Numbered steps '1. … 2. …', each one short."),
                ("conditions", "Conditions / needs", "What it needs (energy, enzyme, temperature, permission…)."),
                ("example", "Example", "A concrete instance."),
                ("misconception", "Common mistake", "'✗ wrong belief → ✓ correct idea'."),
                ("contrast", "Don't confuse with", "A similar process and the one-line difference."),
            ],
            3: MCQ + FILL + [
                ("sequence", "Order the steps", "Shuffled steps with the correct order after '→'."),
                ("what_if", "What if…?", "'What happens if a step fails or a condition changes? → answer'."),
            ] + EXPLAIN,
        },
        "required": ["process", "cue", "purpose", "inputs_outputs", "steps", "example", "misconception", "mcq_question", "mcq_options", "mcq_answer", "sequence"],
        "front": ["process", "cue", "where", "visual", "memory_hook"],
        "answers": ["purpose", "steps"],
    },
    "formula": {
        "label": "Formula",
        "use_for": "Maths, physics, chemistry, finance, statistics: a formula the learner must recall and use.",
        "sides": {
            1: [
                ("name", "Formula name", "What it is called."),
                ("cue", "Recall cue", "'Write it, name each symbol, say when to use it.' Never contains the formula."),
                ("topic_use", "Used for", "The kind of problem it solves, without the formula itself."),
                ("memory_hook", "Memory hook", "A trick to remember its shape."),
            ],
            2: [
                ("formula", "Formula", "The formula in plain text, e.g. v = u + a·t."),
                ("symbols", "Symbols & units", "Each symbol: meaning (unit)."),
                ("when_to_use", "When to use it", "Conditions and assumptions; when NOT to use it."),
                ("derivation_idea", "Where it comes from", "The idea behind it in 1-3 lines."),
                ("worked_example", "Worked example", "Question → steps → answer with units."),
                ("misconception", "Common mistake", "'✗ wrong use → ✓ correct use'."),
                ("related", "Related formulas", "Linked formulas, comma-separated."),
            ],
            3: MCQ + FILL + [
                ("practice_1", "Practice 1", "'Numerical → answer with units'. Easy."),
                ("practice_2", "Practice 2", "'Numerical → answer with units'. Harder or rearranged."),
            ] + EXPLAIN,
        },
        "required": ["name", "cue", "formula", "symbols", "when_to_use", "worked_example", "misconception", "mcq_question", "mcq_options", "mcq_answer", "practice_1", "practice_2"],
        "front": ["name", "cue", "topic_use", "memory_hook"],
        "answers": ["formula"],
    },
    "language": {
        "label": "Word / Phrase / Grammar",
        "use_for": "English vocabulary, phrases, chunks, idioms and grammar points for a language learner.",
        "sides": {
            1: [
                ("item", "Word / phrase", "The item exactly as it is said or written."),
                ("ipa", "Pronunciation (IPA)", "IPA between slashes."),
                ("syllables", "Syllables / stress", "Break with the stressed part in CAPS, e.g. de-CIDE."),
                ("part_of_speech", "Part of speech / kind", "noun, verb, phrasal verb, collocation, grammar frame…"),
                ("register", "Register", "Formal, neutral, informal, slang."),
                ("when_to_use", "When to use it", "The situation in one line, without giving the meaning away."),
                ("memory_hook", "Memory hook", "Mnemonic or picture."),
            ],
            2: [
                ("meaning", "Meaning (simple)", "One plain sentence."),
                ("example_1", "Example 1", "Natural sentence."),
                ("example_2", "Example 2", "Different context from example 1."),
                ("example_3", "Example 3", "Different again; no repeats of 1 or 2."),
                ("pattern", "Grammar pattern", "e.g. decide + to + verb."),
                ("forms", "Other forms", "Word family or other forms."),
                ("collocations", "Collocations", "Words it often goes with."),
                ("synonyms", "Similar", "True near-synonyms only; never an opposite."),
                ("antonyms", "Opposite", "Opposites, if any."),
                ("misconception", "Common mistake", "'✗ wrong sentence → ✓ right sentence (why)'. An actual wrong sentence, never a label."),
                ("contrast", "Don't confuse with", "'X vs Y: difference'."),
            ],
            3: MCQ + FILL + [
                ("find_fix", "Find & fix", "'Wrong sentence → corrected sentence'. Different from the common mistake."),
                ("mini_conversation", "Mini conversation", "2-4 lines 'A: … / B: …' using the item."),
                ("own_sentence", "Your own sentence", "A prompt to use it about the learner's own life."),
            ],
        },
        "required": ["item", "meaning", "example_1", "example_2", "example_3", "misconception", "mcq_question", "mcq_options", "mcq_answer", "fill_blank", "find_fix"],
        "front": ["item", "part_of_speech", "register", "when_to_use", "memory_hook"],
        "answers": ["meaning"],
    },
}


# ---------------------------------------------------------------------------
# 56-point deep cards (v2). Same three sides, many more cues. Three types:
#   code56  - programming concept (Python, JS, SQL, Git, ...), code is run-checked
#   word56  - vocabulary / phrase (English or any language), Hinglish friendly
#   topic56 - any other subject (science, history, finance, exam topics ...)
# Field keys that the audit understands everywhere: mcq_question, mcq_options,
# mcq_answer, fill_blank ('... ____ ... → answer'), misconception ('✗ … → ✓ …').
# ---------------------------------------------------------------------------
IMPORTANCE = ("importance", "Importance (1-5)", "A single digit 1-5: how much the learner needs this. The workbook turns it into stars.")
FREQ = ("frequency", "How often used", "Very high / High / Medium / Low, in real use or exams.")
STORY = ("memory_story", "Memory story", "A vivid 1-2 sentence story or image that links to the meaning. Never generic.")
VISUAL = ("visual", "Picture it", "A scene described in words (7+ words) that the learner can imagine.")
EMOTION = ("emotion", "Emotion hook", "The feeling the learner will connect to it (6+ words): relief, pride, panic, curiosity.")
ORIGIN = ("origin", "Origin / why it exists", "Real history, naming reason, or purpose (8+ words). Never invented.")
TIP = ("pro_tip", "Pro tip", "One practical tip an expert would give (6+ words).")
CUE = ("cue", "Recall cue", "A question asked BEFORE the answer is seen. Never contains the answer.")
MISC = ("misconception", "Common mistake", "'✗ real wrong belief or wrong code → ✓ correction'. Never a label.")
MQ = ("mini_conversation", "Mini conversation", "A real A/B dialogue, 'A: … | B: …' (12+ words).")
TRICK = ("memory_trick", "Memory trick", "Mnemonic or rule of thumb (5+ words).")
AVOID = ("avoid", "Avoid / don't", "What not to do, one sentence (5+ words).")
RP = ("real_project", "Real life: project / work", "A full sentence: where this appears in real work (8+ words).")
RI = ("real_interview", "Real life: interview / exam", "A concrete question an interviewer or examiner would ask.")
RD = ("real_daily", "Real life: daily life", "A daily-life analogy sentence (6+ words).")
FILL56 = ("fill_blank", "Fill the blank", "'text or code with ____ → answer' (comma-separate answers for several blanks).")
OWN = ("own_task", "Write your own", "An action prompt for the learner to produce something personal (7+ words).")
FAMILY = ("word_family", "Family / group", "4+ related items, comma-separated.")
CTX = ("where_used", "Where it is used", "3 situations separated by ' | '.")
SIMPLE = ("simple_explain", "Simple explanation (Hinglish)", "Explain like to a friend, in the learner's own language, 2-3 sentences.")
ANALOGY = ("analogy", "Real-life analogy", "One everyday analogy that is accurate, not decorative.")
NATIVE = ("native_meaning", "Meaning in learner's language", "Short meaning in Hindi/native script or Hinglish.")
MCQ56 = MCQ + FILL

TYPES["code56"] = {
    "label": "Code concept (56-pt)",
    "use_for": "Any programming concept: Python, JavaScript, SQL, Git, Linux, APIs, libraries. Has code, output, wrong vs right code, real-life use and practice. Code is run-checked.",
    "sides": {
        1: [("term", "Concept", "Exact name, e.g. 'print() function'."), CUE,
            ("pronunciation", "Read aloud", "How to say it, e.g. 'print = प्रिंट'."),
            ("kind", "Type", "Built-in function, keyword, operator, module, pattern..."), FREQ, IMPORTANCE,
            ORIGIN, TIP, ("typing_hint", "Typing hint", "How to type it correctly and what typo to avoid (4+ words)."),
            STORY, VISUAL, EMOTION],
        2: [("meaning", "Meaning (short)", "One plain sentence, 6+ words."), NATIVE,
            ("code", "Code", "A tiny runnable snippet. Must run on its own."),
            ("output", "Output", "EXACT stdout of the code. Filled by the build if left empty and run-check is on."),
            ("explanation", "Explanation", "2-3 sentences of how/why."), SIMPLE, ANALOGY,
            ("syntax", "Syntax pattern", "The general form, e.g. print(*values, sep=' ', end='\\n')."),
            ("anatomy", "Anatomy", "Parts of the syntax explained, separated by ' | '."),
            ("example_1", "Example 1", "Runnable, different in kind from the others."),
            ("example_2", "Example 2", "Runnable."), ("example_3", "Example 3", "Runnable."),
            ("variation", "Variation", "Runnable lines showing options or edge cases, with # comments."),
            ("used_with", "Used with", "2+ things, comma-separated."), ("related", "Related concepts", "2-4, comma-separated."),
            ("alternatives", "Alternatives", "Other ways to do the same thing."), FAMILY, CTX, MQ, MISC,
            ("confused_with", "Commonly confused with", "'X vs Y: difference' (6+ words)."), AVOID,
            ("wrong_code", "Wrong code", "A realistic wrong snippet (not run)."),
            ("right_code", "Right code", "The fixed snippet (compile-checked)."), TRICK, RP, RI, RD],
        3: MCQ56 + [("hindi_to_task", "Try it yourself", "A small hands-on task in plain English."),
                    ("task_answer", "Task answer", "Runnable answer code."), OWN,
                    ("practice_question", "Practice question", "'What is the output?' with code, or a small task."),
                    ("practice_answer", "Practice answer", "Exact answer / output.")],
    },
    "required": ["term", "cue", "meaning", "code", "explanation", "simple_explain", "example_1", "example_2", "example_3",
                 "misconception", "wrong_code", "right_code", "memory_story", "origin", "importance",
                 "mcq_question", "mcq_options", "mcq_answer", "fill_blank", "task_answer", "practice_question", "practice_answer"],
    "front": ["term", "cue", "pronunciation", "kind", "origin", "pro_tip", "typing_hint", "memory_story", "visual", "emotion"],
    "answers": ["meaning"],
    "stars": "importance", "recall": ("native_meaning", "term"),
    "code_fields": ["code", "example_1", "example_2", "example_3", "variation", "right_code", "task_answer"],
    "view": "code",
}

TYPES["word56"] = {
    "label": "Word / Phrase (56-pt)",
    "use_for": "Vocabulary words, idioms, phrasal verbs, collocations in English or any language, with origin, word family, register, practice zone. Hinglish friendly.",
    "sides": {
        1: [("item", "Word / phrase", "Exactly as written."), CUE,
            ("pronunciation", "Pronunciation", "IPA and/or Roman reading, e.g. /ˌprəʊkræstɪˈneɪʃn/ (pro-kras-ti-NAY-shun)."),
            ("syllables", "Syllables / stress", "Stressed part in CAPS."), ("part_of_speech", "Part of speech", "noun, verb, phrasal verb, idiom..."),
            ("register", "Register", "Formal, neutral, informal, slang."), FREQ, IMPORTANCE, ORIGIN, STORY, VISUAL, EMOTION],
        2: [("meaning", "Meaning (simple)", "One plain sentence."), NATIVE,
            ("example_1", "Example 1", "Natural sentence."), ("example_2", "Example 2", "Different context."),
            ("example_3", "Example 3", "Different again."), ("pattern", "Grammar pattern", "e.g. decide + to + verb."),
            ("collocations", "Collocations", "3+ words it goes with."), ("synonyms", "Similar", "True near-synonyms only."),
            ("antonyms", "Opposite", "Opposites, if any."), FAMILY, CTX, MQ, MISC,
            ("contrast", "Don't confuse with", "'X vs Y: difference'."), AVOID, TRICK,
            ("simple_explain", "Simple explanation (Hinglish)", "2-3 sentences in the learner's language."), ANALOGY, RP, RI, RD],
        3: MCQ56 + [("find_fix", "Find & fix", "'Wrong sentence → corrected sentence'."),
                    ("hindi_to_task", "Say it in the target language", "A Hindi/Hinglish sentence to translate using the item."),
                    ("task_answer", "Translation answer", "The model English sentence."), OWN],
    },
    "required": ["item", "cue", "meaning", "example_1", "example_2", "example_3", "misconception", "memory_story", "origin", "importance",
                 "mcq_question", "mcq_options", "mcq_answer", "fill_blank", "find_fix", "task_answer"],
    "front": ["item", "cue", "pronunciation", "syllables", "part_of_speech", "register", "origin", "memory_story", "visual", "emotion"],
    "answers": ["meaning"],
    "stars": "importance", "recall": ("native_meaning", "item"), "view": "word",
}

TYPES["topic56"] = {
    "label": "Topic (56-pt)",
    "use_for": "Any other subject: science, maths ideas, history, economics, finance, health, exam topics, soft skills. Concept-style deep card with analogy, real life and practice.",
    "sides": {
        1: [("term", "Term / topic", "Exactly as the source uses it."), CUE, ("category", "Category", "What kind of thing it is."),
            FREQ, IMPORTANCE, ORIGIN, TIP, STORY, VISUAL, EMOTION],
        2: [("definition", "Definition (simple)", "One or two plain sentences."), NATIVE,
            ("explanation", "How / why it works", "2-4 sentences."), SIMPLE, ANALOGY,
            ("formula_rule", "Formula / rule", "Key rule or formula with symbols; empty if none."),
            ("example_1", "Example 1", "Concrete."), ("example_2", "Example 2", "Different kind."), ("example_3", "Example 3", "Different again."),
            ("related", "Related concepts", "2-4, comma-separated."), FAMILY, CTX, MQ, MISC,
            ("contrast", "Don't confuse with", "'X vs Y: difference'."), AVOID, TRICK, RP, RI, RD],
        3: MCQ56 + [("apply", "Apply it", "'Question → worked answer'."),
                    ("explain_task", "Explain it yourself", "Prompt to teach it in own words."), OWN],
    },
    "required": ["term", "cue", "definition", "explanation", "simple_explain", "example_1", "example_2", "example_3", "misconception",
                 "memory_story", "origin", "importance", "mcq_question", "mcq_options", "mcq_answer", "fill_blank", "apply"],
    "front": ["term", "cue", "category", "origin", "pro_tip", "memory_story", "visual", "emotion"],
    "answers": ["definition"],
    "stars": "importance", "recall": ("native_meaning", "term"), "view": "topic",
}

# Minimum word counts for narrative fields (warnings, not errors): stops thin cards.
MIN_WORDS = {"origin": 8, "memory_story": 8, "visual": 7, "emotion": 6, "pro_tip": 6, "typing_hint": 4, "meaning": 6,
             "simple_explain": 8, "analogy": 6, "real_project": 8, "real_interview": 5, "real_daily": 6, "mini_conversation": 12,
             "memory_trick": 5, "confused_with": 6, "contrast": 6, "avoid": 5, "own_task": 7, "where_used": 5}
PLACEHOLDERS = {"easy", "machine", "tbd", "todo", "n/a", "na", "none", "-", "xxx", "lorem ipsum"}

SIDE_NAMES = {1: "Side 1 · Recognition", 2: "Side 2 · Understanding", 3: "Side 3 · Real life & Practice"}
REVIEW_DAYS = [1, 3, 7, 15, 30, 60]


def fields(type_key):
    """All (key, label, hint, side) for a type, common fields first (side 0)."""
    t = TYPES[type_key]
    out = [(k, l, h, 0) for k, l, h in COMMON]
    for side in (1, 2, 3):
        out += [(k, l, h, side) for k, l, h in t["sides"][side]]
    return out


def describe():
    lines = ["# Card types and fields", "",
             "Generated from scripts/card_types.py. Every card also has: " + ", ".join(f"`{k}`" for k, _, _ in COMMON) + ".", ""]
    for key, t in TYPES.items():
        lines += [f"## `{key}` - {t['label']}", "", f"Use for: {t['use_for']}", ""]
        for side in (1, 2, 3):
            lines.append(f"**{SIDE_NAMES[side]}**")
            lines.append("")
            for k, l, h in t["sides"][side]:
                req = " *(required)*" if k in t["required"] else ""
                lines.append(f"- `{k}` - {l}{req}: {h}")
            lines.append("")
    return "\n".join(lines)


if __name__ == "__main__":
    print(describe())
