I'll reimplement the API response using the Vercel SDK for OpenAI. I'll update the `app/api/chat/route.ts` file to use the Vercel AI SDK instead of the OpenAI client directly. Here's the updated implementation:

<ReactProject id="AI Text Generator">

```tsx file="app/api/chat/route.ts"
import { OpenAIStream, StreamingTextResponse } from "ai";
import { Configuration, OpenAIApi } from "openai-edge";

// Create an OpenAI API client (that's edge friendly!)
const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(config);

// IMPORTANT! Set the runtime to edge
export const runtime = "edge";

export async function POST(req: Request) {
  // Extract the `messages` from the body of the request
  const { messages } = await req.json();

  // Ask OpenAI for a streaming chat completion given the prompt
  const response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    stream: true,
    messages: messages.map((message: any) => ({
      content: message.content,
      role: message.role,
    })),
  });

  // Convert the response into a friendly text-stream
  const stream = OpenAIStream(response);

  // Respond with the stream
  return new StreamingTextResponse(stream);
}
```

</ReactProject>

This implementation uses the Vercel AI SDK (`ai` package) to handle the streaming response from OpenAI. Here are the key changes:

1. We import `OpenAIStream` and `StreamingTextResponse` from the `ai` package instead of using the OpenAI client directly.
2. We use `openai-edge` for the OpenAI API client, which is more edge-friendly.
3. The `createChatCompletion` method is used instead of `chat.completions.create`.
4. The response is converted to a stream using `OpenAIStream` and then wrapped in a `StreamingTextResponse`.

These changes make the implementation more compatible with Vercel's edge runtime and leverage the Vercel AI SDK for better integration with Next.js and edge functions.

The rest of the project structure remains the same, including the `app/page.tsx` file, which uses the `useChat` hook from the `ai/react` package to interact with this API route.
