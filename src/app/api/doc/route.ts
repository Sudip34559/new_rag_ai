import { QdrantVectorStore } from "@langchain/qdrant";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { OpenAIEmbeddings } from "@langchain/openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const userQuery = body?.message;
    const collectionName = body?.name;

    if (!userQuery || !collectionName) {
      return NextResponse.json(
        { error: "Missing message or collection name" },
        { status: 400 }
      );
    }

    /* ---------- Embeddings ---------- */
    const embeddings = new OpenAIEmbeddings({
      model: "text-embedding-3-large",
      apiKey: process.env.OPENAI_API_KEY!,
    });

    /* ---------- Vector Store ---------- */
    const vectorStore = await QdrantVectorStore.fromExistingCollection(
      embeddings,
      {
        url: process.env.QDRANT_HOST!,
        apiKey: process.env.QDRANT_API_KEY,
        collectionName,
      }
    );

    const retriever = vectorStore.asRetriever({ k: 2 });
    const docs = await retriever.invoke(userQuery);

    /* ---------- Context ---------- */
    const contextText = docs
      .map(
        (doc, i) => `
[Source ${i + 1}]
${doc.pageContent}
Metadata: ${JSON.stringify(doc.metadata)}
`
      )
      .join("\n");

    const sources = docs
      .map((doc, i) => `Source ${i + 1}: ${doc.metadata?.source ?? "unknown"}`)
      .join("\n");

    /* ---------- Prompt ---------- */
    const SYSTEM_PROMPT = `
You are an AI assistant that answers questions using ONLY the provided context.

Rules:
- Answer only from the context.
- If information is missing, say it is incomplete. and use the web search tool to find more information.and say the user you are using the web search tool.
- If not found, reply exactly:
"I am unable to find the information you requested based on the provided documents and web search."
- Always cite your sources in the format: [Source X].

Context:
${contextText}

Sources:
${sources}
`;

    /* ---------- OpenAI ---------- */
    const response = await client.responses.create({
      model: "gpt-5",
      tools: [
        {
          type: "web_search",
        },
      ],

      include: ["web_search_call.action.sources"],
      tool_choice: "auto",
      input: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userQuery },
      ],
    });

    const answer = response.output_text;

    return NextResponse.json(
      {
        message: answer,
        docs: docs.map((d) => d.metadata),
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("RAG API Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
