import { z } from "zod";

// Echo function
async function toolExec({ a, b }: { a: number, b: number }): Promise<number> {
  return a + b;
}

// Define the tool config
export const sumTool: {
  description: string;
  parameters: z.ZodObject<{ a: z.ZodNumber, b: z.ZodNumber }>;
  execute: ({ a, b }: { a: number, b: number }) => Promise<number>;
} = {
  description: "Add two numbers together",
  parameters: z.object({
    a: z.number().describe("The first number to add"),
    b: z.number().describe("The second number to add"),
  }),
  execute: toolExec,
};