Failed to compile

./apps/ai-chatbot/app/api/chat/route.ts:1:1
Export OpenAIStream doesn't exist in target module
> 1 | import { OpenAIStream, StreamingTextResponse } from "ai";
    | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  2 | import { Configuration, OpenAIApi } from "openai-edge";
  3 |
  4 | // Create an OpenAI API client (that's edge friendly!)

The export OpenAIStream was not found in module [project]/node_modules/.pnpm/ai@4.1.44_react@19.0.0_zod@3.24.2/node_modules/ai/dist/index.mjs [app-edge-route] (ecmascript) <exports>.
