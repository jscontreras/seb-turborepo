import { z } from "zod";
import { CustomTool } from "./tool";

// Echo function
async function toolExec({ a, b }: { a: number; b: number }): Promise<number> {
  return a + b;
}

// Define the tool config
export const sumTool: CustomTool = {
  description: "Add two numbers together",
  inputSchema: z.object({
    a: z.number().describe("The first number to add"),
    b: z.number().describe("The second number to add"),
  }),
  execute: toolExec,
};
