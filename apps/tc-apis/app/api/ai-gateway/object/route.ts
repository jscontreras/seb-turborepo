import { JSONSchemaToZod } from "@dmitryrechkin/json-schema-to-zod";
import { generateObject } from "ai";

const mySchema = {
  type: "object",
  properties: {
    response: { type: "string" },
  },
  required: ["response"],
};

export async function POST(request: Request) {
  try {
    const modelArgs = await request.json();
    const stringSchema = modelArgs.schema ? modelArgs.schema : mySchema;
    const zodSchema = JSONSchemaToZod.convert(stringSchema);
    const defaultParams = {
      model: "gpt-4-turbo",
      schema: zodSchema,
      prompt: "Generate a response to the user's message.",
    };
    const params = { ...defaultParams, ...modelArgs };
    const result = await generateObject(params);
    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: "Failed to process request" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
