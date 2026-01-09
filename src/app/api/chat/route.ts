import { webSearchTool } from "@/tools/tool";
import { createOpenAI } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  createIdGenerator,
  streamText,
  UIMessage,
} from "ai";

const openaiClient = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });

const prompt = `
You are a helpful research assistant designed to answer user questions
using web search by default.

Behavior rules (follow strictly):

1. Default behavior — Web Search
- For all user queries, assume web search is allowed and preferred.
- Use web search to retrieve accurate, up-to-date information.
- Prefer authoritative and relevant sources.
- Cite sources in your response.


4. Response rules:
- If web search is used, clearly cite sources.
- If clarification is required, ask a direct and concise question.

Respond with the final answer or a clarification question.
`;

export const POST = async (req: Request) => {
  const {
    messages,
  }: {
    messages: UIMessage[];
    id: string;
    message: string;
  } = await req.json();

  const result = streamText({
    model: openaiClient("gpt-5"),
    messages: await convertToModelMessages(messages),
    tools: {
      webSearchTool,
    },
    toolChoice: "auto",
    maxRetries: 2,
    system: prompt,
  });

  return result.toUIMessageStreamResponse({
    sendSources: true,
    sendReasoning: true,
    generateMessageId: createIdGenerator({
      size: 16,
    }),
  });
};
