import { z } from "zod";
import { CustomTool } from "./tool";

// Echo function
async function toolExec({ message }: { message: string }): Promise<string> {
  const serverTime = new Date().toISOString();
  return `${message} (server time: ${serverTime})`;
}

// Define the tool config
export const echoTool: CustomTool = {
  description: "Echo message with server timestamp",
  inputSchema: z.object({
    message: z
      .string()
      .describe(
        "The message word or sentence to echo. The user needs to explicitly ask for this tool using the word 'echo'",
      ),
  }),
  execute: toolExec,
};
