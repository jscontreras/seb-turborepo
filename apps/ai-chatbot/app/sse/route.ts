import { createServerResponseAdapter } from "@/lib/server-response-adapter";
import { mcpHandler } from "../mcp";

export const maxDuration = 400;

export async function GET(req: Request) {
  return createServerResponseAdapter(req.signal, (res) => {
    mcpHandler(req, res);
  });
}
