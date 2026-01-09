import { Worker } from "bullmq";
import { QdrantVectorStore } from "@langchain/qdrant";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveUrlLoader } from "@langchain/community/document_loaders/web/recursive_url";
import { compile } from "html-to-text";
import { Document } from "@langchain/core/documents";
import * as cheerio from "cheerio";
import { GithubRepoLoader } from "@langchain/community/document_loaders/web/github";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import "dotenv/config";
import { OpenAIEmbeddings } from "@langchain/openai";
import { fetchTranscript } from "youtube-transcript-plus";

function toDoc(
  bucket: { text: string; start: number; duration: number }[],
  bucketStart: number,
  videoDoc: Document
): Document {
  return new Document({
    pageContent: bucket.map((c) => c.text).join(" "),
    metadata: {
      ...videoDoc.metadata,
      startSec: bucketStart,
      endSec:
        bucket[bucket.length - 1].start + bucket[bucket.length - 1].duration,
      source: `${videoDoc.metadata.source}?t=${bucketStart}`,
    },
  });
}

function chunkYouTubeTwoMin(videoDoc: Document): Document[] {
  const TWO_MIN = 120; // seconds
  const caps = videoDoc.metadata.timestamped_captions ?? [];

  console.log(videoDoc);

  /* ─────── A. Real timestamps available ─────── */
  if (caps.length) {
    const out = [];
    let bucket = [];
    let bucketStart = caps[0].start;

    for (const c of caps) {
      if (c.start >= bucketStart + TWO_MIN && bucket.length) {
        out.push(toDoc(bucket, bucketStart, videoDoc));
        bucket = [];
        bucketStart = c.start;
      }
      bucket.push(c);
    }
    if (bucket.length) out.push(toDoc(bucket, bucketStart, videoDoc));
    return out;
  }

  /* ─────── B. No timestamps – split by words ─────── */
  const WORDS_PER_CHUNK = 155 * 2; // ≈310 words
  const words = videoDoc.pageContent.split(/\s+/);
  const docs = [];

  for (let i = 0; i < words.length; i += WORDS_PER_CHUNK) {
    const startSec = (i / WORDS_PER_CHUNK) * TWO_MIN; // 0,120,240…
    docs.push(
      new Document({
        pageContent: words.slice(i, i + WORDS_PER_CHUNK).join(" "),
        metadata: {
          ...videoDoc.metadata,
          syntheticTime: true,
          startSec,
          source: `${videoDoc.metadata.source}?t=${startSec}`,
        },
      })
    );
  }
  return docs;
}

new Worker(
  "file-upload-queue",
  async (job) => {
    try {
      console.log("Received job:", job.data);

      job.log("Starting PDF processing...");

      const { path } = JSON.parse(job.data);

      // Load PDF and extract text
      const loader = new PDFLoader(path);
      const rawdocs = await loader.load();

      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000, // ~1k characters
        chunkOverlap: 200, // overlap helps preserve context
      });

      const docs = await splitter.splitDocuments(rawdocs);
      console.log("Split into chunks:", docs.length);

      // Setup HuggingFace embeddings
      // const embeddings = new OllamaEmbeddings("nomic-embed-text");
      const embeddings = new OpenAIEmbeddings({
        model: "text-embedding-3-large",
        apiKey: process.env.OPENAI_API_KEY,
      });
      // Connect to Qdrant collection
      const vectorStore = await QdrantVectorStore.fromExistingCollection(
        embeddings,
        {
          url: process.env.QDRANT_HOST,
          apiKey: process.env.QDRANT_API_KEY,
          collectionName: "pdf-doc",
        }
      );

      console.log("Vector store connected. Inserting documents...");
      await vectorStore.addDocuments(docs);

      console.log("✅ Documents added:", docs.length);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("❌ Worker error:", error.message);
      } else {
        console.error("❌ Worker error:", error);
      }
    }
  },
  { concurrency: 100, connection: { host: "localhost", port: 6379 } }
);

new Worker(
  "web-load-queue",
  async (job) => {
    const { url } = JSON.parse(job.data);
    console.log(`Starting to scrape: ${url}`);
    try {
      await job.updateProgress(10);
      console.log(`Starting to scrape: ${url}`);

      const toText = compile({
        wordwrap: false, // Don't wrap text
        preserveNewlines: true,
        selectors: [
          { selector: "a", options: { ignoreHref: false } }, // Keep links
          { selector: "img", format: "skip" }, // Skip images
        ],
      });

      // Enhanced extractor to get ALL content
      const enhancedExtractor = (html: string) => {
        const $ = cheerio.load(html);

        // Remove unwanted elements (scripts, styles, etc.)
        $(
          "script, style, noscript, iframe, svg, " +
            "nav, footer, header, .cookie-banner, .popup, " +
            ".advertisement, .sidebar, .menu, .ads, " +
            '[role="navigation"], [role="banner"], [role="complementary"]'
        ).remove();

        // Extract main content areas first
        const mainContent =
          $("main").html() ||
          $('[role="main"]').html() ||
          $("article").html() ||
          $(".content").html() ||
          $("#content").html() ||
          $("body").html() ||
          "";

        // Load cleaned content
        const $clean = cheerio.load(mainContent);

        // Get all text content with structure
        let textContent = "";

        // Extract headings with hierarchy
        $clean("h1, h2, h3, h4, h5, h6").each((_, elem) => {
          const heading = $(elem).text().trim();
          if (heading) {
            textContent += `\n\n${heading}\n`;
          }
        });

        // Extract paragraphs
        $clean("p").each((_, elem) => {
          const text = $(elem).text().trim();
          if (text) {
            textContent += `${text}\n\n`;
          }
        });

        // Extract lists
        $clean("ul, ol").each((_, elem) => {
          $(elem)
            .find("li")
            .each((_, li) => {
              const text = $(li).text().trim();
              if (text) {
                textContent += `• ${text}\n`;
              }
            });
          textContent += "\n";
        });

        // Extract table data
        $clean("table").each((_, table) => {
          $(table)
            .find("tr")
            .each((_, tr) => {
              const cells: string[] = [];
              $(tr)
                .find("th, td")
                .each((_, cell) => {
                  cells.push($(cell).text().trim());
                });
              if (cells.length > 0) {
                textContent += cells.join(" | ") + "\n";
              }
            });
          textContent += "\n";
        });

        // Extract code blocks
        $clean("pre, code").each((_, elem) => {
          const code = $(elem).text().trim();
          if (code) {
            textContent += `\n\`\`\`\n${code}\n\`\`\`\n\n`;
          }
        });

        // Get any remaining text not captured above
        const remainingText = $clean("body").text().replace(/\s+/g, " ").trim();

        // Combine everything and clean up
        const finalText = (textContent + " " + remainingText)
          .replace(/\n{3,}/g, "\n\n") // Remove excessive newlines
          .replace(/\s{2,}/g, " ") // Remove excessive spaces
          .trim();

        return finalText || toText(html);
      };

      await job.updateProgress(20);

      // Configure crawler to scrape entire website
      const loader = new RecursiveUrlLoader(url, {
        extractor: enhancedExtractor,
        maxDepth: 100, // Very deep crawl - adjust based on site size
        timeout: 30000, // 30 seconds timeout per page
        excludeDirs: [
          "/cdn-cgi/",
          "/wp-admin/",
          "/wp-includes/",
          "/admin/",
          "/login/",
          "/logout/",
          "/register/",
          "/cart/",
          "/checkout/",
        ], // Skip common non-content paths
        preventOutside: true, // Stay within the domain
      });

      await job.updateProgress(30);
      console.log("Starting crawl...");

      // Load all documents
      const docs = await loader.load();
      console.log(`✅ Loaded ${docs.length} pages from website`);

      await job.updateProgress(60);

      // Split documents into chunks for better retrieval
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1500,
        chunkOverlap: 300,
        separators: ["\n\n", "\n", ". ", " ", ""],
      });

      const splitDocs = await textSplitter.splitDocuments(docs);
      console.log(`Split into ${splitDocs.length} chunks`);

      await job.updateProgress(70);

      // Setup embeddings
      const embeddings = new OpenAIEmbeddings({
        model: "text-embedding-3-large",
        apiKey: process.env.OPENAI_API_KEY,
      });

      await job.updateProgress(80);

      // Store in Qdrant - create new collection or add to existing
      const vectorStore = await QdrantVectorStore.fromExistingCollection(
        embeddings,
        {
          url: process.env.QDRANT_HOST,
          apiKey: process.env.QDRANT_API_KEY,
          collectionName: "web-doc",
        }
      );

      await vectorStore.addDocuments(splitDocs);
      console.log(
        `✅ Successfully scraped and stored ${docs.length} pages (${splitDocs.length} chunks)`
      );
      await job.updateProgress(100);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("❌ Worker error:", error.message);
        throw new Error(`Scraping failed: ${error.message}`);
      } else {
        console.error("❌ Worker error:", error);
        throw error;
      }
    }
  },
  {
    concurrency: 5, // Reduced from 100 to avoid overwhelming sites
    connection: {
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
    },
    limiter: {
      max: 10, // Max 10 jobs per duration
      duration: 1000, // 1 second
    },
  }
);

new Worker(
  "youtube-video-load-queue",
  async (job) => {
    const { url } = JSON.parse(job.data);

    try {
      const transcript = await fetchTranscript(url, {
        videoFetch: async ({ url, lang, userAgent }) => {
          return fetch(url, {
            headers: new Headers({
              ...(lang ? { "Accept-Language": lang } : {}),
              "User-Agent": userAgent || "",
            }),
          });
        },
      });
      // console.log("..............", transcript);

      // Convert to LangChain Document format
      const fullText = transcript.map((t) => t.text).join(" ");
      const videoDoc = new Document({
        pageContent: fullText,
        metadata: {
          source: url,
          timestamps: transcript.map((t) => ({
            text: t.text,
            offset: t.offset,
            duration: t.duration,
          })),
        },
      });

      // console.log(videoDoc);

      /* 2. Split into caption-level chunks */
      const docs = chunkYouTubeTwoMin(videoDoc);
      // console.log("Chunks ready:", docs);

      /* 3. Embeddings */
      const embeddings = new OpenAIEmbeddings({
        model: "text-embedding-3-large",
        apiKey: process.env.OPENAI_API_KEY,
      });

      /* 4. Connect to Qdrant */
      const vectorStore = await QdrantVectorStore.fromExistingCollection(
        embeddings,
        {
          url: process.env.QDRANT_HOST,
          apiKey: process.env.QDRANT_API_KEY,
          collectionName: "youtube-vedio-trans",
        }
      );

      /* 5. Upsert */
      await vectorStore.addDocuments(docs);
      console.log("✅ Stored chunks:", docs.length);
    } catch (err) {
      console.error("❌ Job failed:", err);
      throw err;
    }
  },
  { concurrency: 3, connection: { host: "localhost", port: 6379 } }
);

new Worker(
  "git-repo-analize",
  async (job) => {
    const { url } = JSON.parse(job.data);

    try {
      // 1. Load repo files
      const loader = new GithubRepoLoader(url, {
        branch: "master",
        recursive: true,
        unknown: "warn",
        maxConcurrency: 3,
        ignorePaths: [
          "node_modules/**",
          ".git/**",
          "dist/**",
          "build/**",
          "*.log",
          "*.lock",
          "*.pdf",
          "*.zip",
          "*.tar.gz",
          "*.jpg",
          "*.png",
          "*.gif",
          "*.svg",
        ],
        processSubmodules: false,
      });

      const rawDocs = await loader.load();
      console.log("📂 Loaded repo files:", rawDocs.length);

      // 2. Split into smaller chunks
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000, // ~1k characters
        chunkOverlap: 200, // overlap helps preserve context
      });

      const docs = await splitter.splitDocuments(rawDocs);
      console.log("✂️ Split into chunks:", docs.length);

      // 3. Embeddings
      // const embeddings = new OllamaEmbeddings("nomic-embed-text");

      const embeddings = new OpenAIEmbeddings({
        model: "text-embedding-3-small",
        apiKey: process.env.OPENAI_API_KEY,
      });

      // 4. Connect Qdrant
      const vectorStore = await QdrantVectorStore.fromExistingCollection(
        embeddings,
        {
          url: process.env.QDRANT_HOST,
          apiKey: process.env.QDRANT_API_KEY,
          collectionName: "git-repo",
        }
      );

      // 5. Store chunks
      await vectorStore.addDocuments(docs);
      console.log("✅ Stored chunks:", docs.length);
    } catch (err) {
      console.error("❌ Job failed:", err);
      throw err;
    }
  },
  { concurrency: 20, connection: { host: "localhost", port: 6379 } }
);

console.log("worker running....");
