import { z } from "zod";
import { generateObject, generateText } from "ai";
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
 * Generate the prompt for the range detector.
 * @param prompt - The prompt to generate the prompt for.
 * @returns The prompt for the range detector.
 */
function generatePrompt(): string {
  const today = new Date().toISOString().split("T")[0];
  return `
You are a date range detector for natural language prompts.

Your job:
- Identify if the prompt contains any explicit date range, interval, or period.
- If a single explicit date is provided with a range-indicating word, set the startDate or endDate accordingly.
- Always use the provided currentDate: ${today}.
Once you detect the range, return the range detector object, indicating isRangeInPrompt as true, and startDate, and endDate.
If no date is found, return the range detector object, indicating isRangeInPrompt as false, and startDate, and endDate as null.
`;
}

/**
 * Detects if there is a date range implicit on the prompt.
 * @param prompt - The prompt to detect the range from.
 * @returns The range detector object.
 */
async function detectRange(prompt: string) {
  const { object } = await generateObject({
    model: openai("gpt-4.1-nano"),
    schema: rangeDetectorSchema,
    system: generatePrompt(),
    prompt: prompt,
  });
  return object;
}

/**
 * Rewrite the relative dates in the prompt to absolute dates.
 * @param prompt - The prompt to rewrite the relative dates in.
 * @returns The prompt with the relative dates rewritten to absolute dates.
 */
async function rewriteRelativeDates(prompt: string) {
  const today = new Date().toISOString().split("T")[0];
  const { text } = await generateText({
    model: openai("gpt-4.1-nano"),
    system: `You are a date range detector for natural language prompts.
Your job:
- If the prompt contains date words or synonyms like day, week, month, year, or names of months and days, it means that isRangeInPrompt must be true, and other dates can be inferred from the current date and the word.
- Identify if the prompt contains any explicit or implicit date range, interval, or period, including both relative (e.g., "last 2 weeks", "in the last 2 weeks") and explicit absolute dates (e.g., "since February 20th", "from January 1, 2024", "after 2023-05-01").
- If the prompt uses words like "since," "from," "after," "starting," or phrases like "in the last," followed by a date or period, extract that as the start date and use the current date as the end date.
- If a single explicit date is provided with a range-indicating word, set the startDate accordingly.
- If the prompt use terms like latest, the ultimate, the fresh (refering to latest features) it means that isRangeInPrompt must be true and and the startDate must be the date from the past 2 weeks and the endDate must be the current date.
- If a date doesn't specify the year, use the current year: ${new Date().getFullYear()}.
- Always use the provided currentDate: ${today}.
If no date is found, return the original prompt; otherwise, return the rewritten prompt.`,
    prompt: prompt,
  });
  return text;
}
export { detectRange, type rangeDetectorSchema, rewriteRelativeDates };
