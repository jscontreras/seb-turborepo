import { z } from "zod";
import { generateObject, generateText } from "ai";
import { gateway } from "@ai-sdk/gateway";

// define a schema for the notifications
const rangeDetectorSchema = z.object({
  isRangeInPrompt: z
    .boolean()
    .describe("Is there a date range implicit on the prompt?"),
  startDate: z.string().describe("Start date of the range.").nullable(),
  endDate: z.string().describe("End date of the range.").nullable(),
  currentDate: z.string().describe("Current date."),
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
  try {
    const { object } = await generateObject({
      model: gateway("openai/gpt-4.1-nano"),
      schema: rangeDetectorSchema,
      system: generatePrompt(),
      prompt: prompt,
    });
    return object;
  } catch (error) {
    console.error(">>>error", error);
    throw error;
  }
}

const systemPrompt = `You are a date range detector for natural language prompts.
Your job:
If no date range is found, return the original prompt; otherwise, return the rewritten prompt using the following criteria:
- If the prompt contains date words or synonyms like day, week, month, year, or names of months and days, it means that isRangeInPrompt must be true, and other dates can be inferred from the current date and the word.
- Identify if the prompt contains any explicit or implicit date range, interval, or period, including both relative (e.g., "last 2 weeks", "in the last 2 weeks") and explicit absolute dates (e.g., "since February 20th", "from January 1, 2024", "after 2023-05-01").
- If the prompt uses words like "since," "from," "after," "starting," or phrases like "in the last," followed by a date or period, extract that as the start date and use the current date as the end date.
- If a single explicit date is provided with a range-indicating word, set the startDate accordingly.
- If the prompt uses terms like latest, the ultimate, the fresh (referring to latest features), it means that isRangeInPrompt must be true and the startDate must be the date from the past 4 weeks and the endDate must be the current date.
- For prompts containing wordslike "give me last X features" where X is a number, calculate the startDate based on the formula: startDate = currentDate - (30 + X) days and print the startDate and endDate accordingly.
- If a date doesn't specify the year, use the current year: ${new Date().getFullYear()}.
- Always use the provided currentDate: ${new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split("T")[0]}.
And JUST return the rewritten prompt. Feel free to rewrite the prompt to make it more clear and concise always using the dates.`;

/**
 * Rewrite the relative dates in the prompt to absolute dates.
 * @param prompt - The prompt to rewrite the relative dates in.
 * @returns The prompt with the relative dates rewritten to absolute dates.
 */
async function rewriteRelativeDates(prompt: string) {
  const { text } = await generateText({
    model: gateway("openai/gpt-4.1-nano"),
    system: systemPrompt,
    prompt: prompt,
  });
  return text;
}
export {
  detectRange,
  type rangeDetectorSchema,
  rangeDetectorSchema as ZodrangeDetectorSchema,
  rewriteRelativeDates,
};
