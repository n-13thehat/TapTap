/**
 * Onboarding agent helpers. Currently exposes a single helper that asks
 * Fable (Story Weaver) to draft a 2-3 sentence bio from the user's Muse
 * interview answers. Falls back to a deterministic stub when OPENAI_API_KEY
 * is missing or the call fails so the wizard never blocks on the model.
 */

const FABLE_SYSTEM_PROMPT = [
  "You are Fable, the Story Weaver on TapTap.",
  "Tone: cinematic, warm, narrative.",
  "Specialty: distilling a creator's answers into compelling prose.",
  'Your signature line is: "Every artist has a story; let me tell yours."',
  "Write a 2-3 sentence first-person bio (40-80 words total) for the user's profile.",
  "Use plain text only — no markdown, no emojis, no quotes around the output.",
  "Do not invent facts that are not implied by the answers.",
].join("\n");

export async function generateOnboardingBio(
  answers: Record<string, any>
): Promise<string> {
  const flattened = flattenAnswers(answers);
  if (!process.env.OPENAI_API_KEY) {
    return fallbackBio(flattened);
  }
  try {
    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const userMessage = flattened.length
      ? `Here are the user's interview answers:\n\n${flattened
          .map((a, i) => `${i + 1}. ${a}`)
          .join("\n")}\n\nDraft their bio.`
      : "The user did not fill out the interview. Draft a short, welcoming bio that invites them to share more later.";

    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_AGENTS_MODEL || "gpt-4o-mini",
      temperature: 0.7,
      max_tokens: 200,
      messages: [
        { role: "system", content: FABLE_SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
    });
    const text = completion.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("Empty LLM response");
    return text;
  } catch (err) {
    console.error("[agents/onboarding] Fable bio LLM call failed", err);
    return fallbackBio(flattened);
  }
}

function flattenAnswers(answers: Record<string, any>): string[] {
  if (!answers || typeof answers !== "object") return [];
  return Object.values(answers)
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter((v) => v.length > 0);
}

function fallbackBio(answers: string[]): string {
  if (answers.length === 0) {
    return "Just landed on TapTap and ready to find my sound. Bringing curiosity, an open ear, and a love for the moments where music takes you somewhere new.";
  }
  const seed = answers[0].slice(0, 140);
  return `${seed} I'm here to listen, share, and grow alongside the TapTap community.`;
}
