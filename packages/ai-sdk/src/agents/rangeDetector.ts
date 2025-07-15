import { z } from "zod";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";

// define a schema for the notifications
const rangeDetectorSchema = z.object({
  notifications: z.array(
    z.object({
      isRangeInPrompt: z
        .boolean()
        .describe("Is there a date range implicit on the prompt?"),
      startDate: z.string().describe("Start date of the range.").nullable(),
      endDate: z.string().describe("End date of the range.").nullable(),
      currentDate: z.string().describe("Current date."),
    }),
  ),
});

/**
 * Detects if there is a date range implicit on the prompt.
 * @param prompt - The prompt to detect the range from.
 * @returns The range detector object.
 */
async function detectRange(prompt: string) {
  const { object } = await generateObject({
    model: openai("gpt-4.1-nano"),
    schema: rangeDetectorSchema,
    system: generatePrompt(prompt),
    prompt: "Analyze the prompt and return the range detector object.",
  });
  return object;
}
function generatePrompt(prompt: string): string {
  const today = new Date().toISOString().split("T")[0];
  return `
You are a date range detector for natural language prompts.

Your job:
- if the prompt contains dates words or synonyms to day, week, month, year, January, February, March, April, May, June, July, August, September, October, November, December, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday it means that isRangeInPrompt must be true and the other dates can be inferred from the current date and the word.
- Identify if the prompt contains any explicit or implicit date range, interval, or period, including both relative (e.g., "last 2 weeks") and explicit absolute dates (e.g., "since February 20th", "from January 1, 2024", "after 2023-05-01").
- If the prompt uses words like "since," "from," "after," or "starting," followed by a date, extract that as the start date and use the current date as the end date.
- If a single explicit date is provided with a range-indicating word, set the startDate accordingly.
- If date doesn't specify the year, use the current year: ${new Date().getFullYear()}.
- Always use the provided currentDate: ${today}.

Examples:
- "Give me compute cpu related features launched by Vercel since February 20th"
  - isRangeInPrompt: true
  - startDate: "2025-02-20"
  - endDate: ${today}

- "Show me releases after March"
  - isRangeInPrompt: true
  - startDate: "${new Date().getFullYear()}-03-01"
  - endDate: ${today}

- "List new features this year"
  - isRangeInPrompt: true
  - startDate: "2025-01-01"
  - endDate: "2025-07-15"

- "What are the most popular features?"
  - isRangeInPrompt: false
  - startDate: null
  - endDate: null
`;
}

export { detectRange, type rangeDetectorSchema };
