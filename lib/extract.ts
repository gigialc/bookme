import Anthropic from "@anthropic-ai/sdk";

/**
 * Pull action items out of meeting notes.
 * Uses Claude when ANTHROPIC_API_KEY is configured; otherwise falls back to
 * parsing checkbox lines and "Action items / Next steps" sections.
 */
export async function extractActionItems(title: string, notes: string): Promise<string[]> {
  const trimmed = notes.trim();
  if (!trimmed) return [];

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return await extractWithClaude(title, trimmed);
    } catch (err) {
      console.error("Claude extraction failed, falling back to heuristic:", err);
    }
  }
  return extractHeuristic(trimmed);
}

async function extractWithClaude(title: string, notes: string): Promise<string[]> {
  const client = new Anthropic();
  const response = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 2048,
    system:
      "You extract action items from meeting notes. Return only concrete follow-up tasks — things someone committed to do after the meeting. Phrase each as a short imperative sentence. If the notes assign an owner, keep the owner's name in the task. Do not invent tasks that aren't in the notes; return an empty list if there are none.",
    output_config: {
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            action_items: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: ["action_items"],
          additionalProperties: false,
        },
      },
    },
    messages: [
      {
        role: "user",
        content: `Meeting: ${title}\n\nNotes:\n${notes.slice(0, 30000)}`,
      },
    ],
  });

  if (response.stop_reason === "refusal") return extractHeuristic(notes);
  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") return [];
  const parsed = JSON.parse(block.text) as { action_items?: string[] };
  return (parsed.action_items ?? []).map((s) => s.trim()).filter(Boolean).slice(0, 25);
}

export function extractHeuristic(notes: string): string[] {
  const lines = notes.split("\n");
  const items: string[] = [];
  let inActionSection = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    if (/^#{0,4}\s*\**\s*(action items?|next steps?|to-?dos?|follow[- ]?ups?)\b/i.test(line)) {
      inActionSection = true;
      continue;
    }
    // A new heading ends the action-items section.
    if (/^#{1,4}\s|^\*\*[^*]+\*\*:?\s*$/.test(line) && inActionSection) {
      inActionSection = false;
      continue;
    }

    const checkbox = line.match(/^[-*]\s*\[[ xX]?\]\s*(.+)/);
    if (checkbox) {
      items.push(checkbox[1].trim());
      continue;
    }
    if (inActionSection) {
      const bullet = line.match(/^(?:[-*•]|\d+[.)])\s*(.+)/);
      if (bullet) items.push(bullet[1].trim());
    }
  }

  return [...new Set(items)].slice(0, 25);
}
