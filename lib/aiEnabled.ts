// Owns whether each AI feature is switched on: it is on only when the keys it
// needs are set on the server. Pages use it to hide the feature's buttons and
// panels, and routes use it to refuse before anything is counted.
//
// It deliberately reads the environment on every call and holds no state, so
// adding a key in Vercel and redeploying is the whole switch. It never reveals
// a key, only whether one exists.

/// The card maker needs only the Anthropic key.
export const cardMakerEnabled = () => Boolean(process.env.ANTHROPIC_API_KEY);

/// The help chatbot on /help needs only the Anthropic key too.
export const helpBotEnabled = () => Boolean(process.env.ANTHROPIC_API_KEY);

/// The audio draft needs both: OpenAI turns the recording into text, Anthropic
/// writes the draft from it.
export const auditDraftEnabled = () => Boolean(process.env.ANTHROPIC_API_KEY && process.env.OPENAI_API_KEY);

export const AI_OFF_MESSAGE = "The AI is not switched on yet. Ask an admin to add the AI keys, or do this by hand.";
