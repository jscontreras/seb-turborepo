import { z } from "zod";
import { initializeMcpApiHandler } from "../lib/mcp-api-handler";

export const mcpHandler = initializeMcpApiHandler(
  (server) => {
    // Add more tools, resources, and prompts here
    server.tool(
      "echo",
      "Returns the message you give it appending the server time",
      { message: z.string() },
      async ({ message }) => {
        const serverTime = new Date().toISOString();
        return {
          content: [
            {
              type: "text",
              text: `Tool echo: ${message} (Server Time: ${serverTime})`,
            },
          ],
        };
      },
    );
  },
  {
    capabilities: {
      tools: {
        echo: {
          description: "Echo a message",
        },
      },
    },
  },
);
