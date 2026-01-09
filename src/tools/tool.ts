import { QdrantVectorStore } from "@langchain/qdrant";
import { tool } from "ai";
import OpenAI from "openai";
import { z } from "zod";
import { OpenAIEmbeddings } from "@langchain/openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const webSearchTool = tool({
  description: "Search the web using the latest information available online.",
  inputSchema: z.object({
    query: z.string().describe("The search query to look up"),
  }),
  execute: async ({ query }: { query: string }) => {
    const response = await client.responses.create({
      model: "gpt-5",

      tools: [
        {
          type: "web_search",
        },
      ],

      include: ["web_search_call.action.sources"],
      tool_choice: "auto",

      input: query,
    });

    return {
      answer: response.output_text,
    };
  },
});

export const documentSearchTool = tool({
  description:
    "Search through uploaded documents to find relevant information. Use this when the user asks about uploaded documents or specific content from files.",
  inputSchema: z.object({
    query: z.string().describe("The search query to find relevant documents"),
    collectionName: z
      .string()
      .describe("The collection name to search in (e.g., pdf-docs, web-doc)"),
  }),
  execute: async ({ query, collectionName }) => {
    try {
      const embeddings = new OpenAIEmbeddings({
        model: "text-embedding-3-large",
        apiKey: process.env.OPENAI_API_KEY,
      });

      const vectorStore = await QdrantVectorStore.fromExistingCollection(
        embeddings,
        {
          url: process.env.QDRANT_HOST,
          apiKey: process.env.QDRANT_API_KEY,
          collectionName: collectionName,
        }
      );

      const retriever = vectorStore.asRetriever({ k: 3 });
      const results = await retriever.invoke(query);

      if (results.length === 0) {
        return {
          found: false,
          message: "No relevant documents found for this query.",
        };
      }

      const formattedResults = results.map((doc, i) => ({
        source: doc.metadata.source || `Document ${i + 1}`,
        content: doc.pageContent,
        metadata: doc.metadata,
      }));

      return {
        found: true,
        results: formattedResults,
        summary: `Found ${results.length} relevant document(s)`,
      };
    } catch (error) {
      return {
        found: false,
        error: error,
        message: "Failed to search documents. They may not exist.",
      };
    }
  },
});
export const finalizerTool = tool({
  description:
    "Uses OpenAI model to intelligently combine multiple tool outputs into a coherent final response with separated sources.",
  inputSchema: z.object({
    query: z.string().describe("Original user query"),
    toolResults: z
      .array(z.any())
      .describe("Array of results from various tools"),
  }),
  execute: async ({ query, toolResults }) => {
    // Stringify tool results with clear structure
    const toolData = toolResults.map((result, index) => ({
      id: index,
      type: result,
      data: result,
      raw: JSON.stringify(result, null, 2),
    }));

    const systemPrompt = `You are an expert response synthesizer. Combine multiple tool outputs into ONE coherent, well-formatted final answer.

CRITICAL RULES:
1. NEVER mention "tools", "OpenAI", "function calls", or technical implementation
2. Create a natural, human-like response to: "${query}"
3. Automatically separate and cite sources at the end
4. Use markdown formatting (## Headers, **bold**, bullet points)
5. Prioritize most relevant information
6. Keep response concise (max 400 words)

OUTPUT FORMAT:
1. Direct answer in 2-3 sentences
2. ## Key Findings (bullet points)
3. ## Sources (categorized list)`;

    const response = await client.responses.create({
      model: "gpt-4o-mini", // Fast and cost-effective
      input: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Query: ${query}\n\nTool Results:\n${JSON.stringify(
            toolData,
            null,
            2
          )}`,
        },
      ],
      temperature: 0.1,
    });

    const finalResponse = response.output_text;

    return {
      finalResponse,
      sourcesExtracted: toolData, // Helper to track original sources
      usedModel: "gpt-4o-mini",
    };
  },
});
