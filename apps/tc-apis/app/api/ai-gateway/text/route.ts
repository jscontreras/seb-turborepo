import { generateText } from "ai";

export async function POST(request: Request) {
  try {
    const modelArgs = await request.json();
    const defaultParams = {
      model: "xai/grok-3",
    };
    const params = { ...defaultParams, ...modelArgs };
    const result = await generateText(params);
    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to process request" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
