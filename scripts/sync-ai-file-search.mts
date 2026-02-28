import {GoogleGenAI, type FileSearchStore, type Operation} from "@google/genai";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });;

// 1. COMMUNICATIVE SAFETY CHECK
// This ensures we abort early with a clear message if the key is missing.
const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

if (!API_KEY) {
  console.error("❌ ERROR: GOOGLE_GENERATIVE_AI_API_KEY is missing in .env.local");
  process.exit(1);
}

// 2. TYPE-SAFE INITIALIZATION
// Because we've already checked !API_KEY, TS correctly infers that
// API_KEY is a 'string', satisfying the GoogleGenAI constructor.
const genAI = new GoogleGenAI({ apiKey: API_KEY });
const STORE_DISPLAY_NAME = "aivantage-knowledge-base";
const KB_DIR = path.join(process.cwd(), "src/content/general");

try {
  console.log("🚀 Starting Knowledge Base Sync...");

  // 1. Fetch stores and find existing by Display Name
  const pager = await genAI.fileSearchStores.list({ config: { pageSize: 10 } });
  let store = pager.page.find((s: FileSearchStore) => s.displayName === STORE_DISPLAY_NAME);

  if (!store) {
    console.log(`✨ Creating new store: ${ STORE_DISPLAY_NAME }`);
    store = await genAI.fileSearchStores.create({
      config: { displayName: STORE_DISPLAY_NAME }
    });
  }

  const storeName = store.name as string;
  console.log(`📦 Using Store ID: ${ storeName }`);

  // Identify local files (Using inference)
  const localFiles = fs.readdirSync(KB_DIR)
    .filter(file => [".md", ".pdf", ".txt"].includes(path.extname(file)));

  if (localFiles.length === 0) {
    console.warn("⚠️ No files found in /src/content/general. Nothing to sync.");
    process.exit(0);
  }

  // Upload Loop
  for (const fileName of localFiles) {
    const filePath = path.join(KB_DIR, fileName);
    const ext = path.extname(fileName).toLowerCase();

    // Explicitly map extensions to MIME types Gemini Search Store expects
    let mimeType = "text/plain";
    if (ext === ".pdf") mimeType = "application/pdf";
    if (ext === ".md") mimeType = "text/markdown";

    console.log(`⬆️ Uploading ${ fileName } (as ${ mimeType })...`);

    try {

      // Read file as Buffer and convert to Blob to satisfy the SDK's Blob requirement
      const fileBuffer = fs.readFileSync(filePath);
      const fileBlob = new Blob([fileBuffer], { type: mimeType });

      // Operation<unknown> is required because Operation is a generic type
      let op: Operation<unknown> = await genAI.fileSearchStores.uploadToFileSearchStore({
        // Pass a File object or path with explicit metadata
        file: fileBlob,
        // mimeType: mimeType, // Hard-coding this prevents the 400 rejection
        fileSearchStoreName: storeName,
        config: { displayName: fileName }
      });

      while (!op.done) {
        process.stdout.write(".");
        await new Promise(resolve => setTimeout(resolve, 2000));
        op = await genAI.operations.get({ operation: op });
      }
      console.log(`\n✅ ${ fileName } indexed.`);
    } catch (fileError: unknown) {
      // This inner catch prevents one bad file from crashing the whole Windows process
      const errorMsg = fileError instanceof Error ? fileError.message : "Unknown file error";
      console.error(`\n❌ Failed to index ${ fileName }:`, errorMsg);
    }
  }
  console.log("\n🎉 Sync Complete to Google AI File Search.");
} catch (error: unknown) {
  // Hardened error handling
  const msg = error instanceof Error ? error.message : "An unexpected error occurred";
  console.error("\n❌ Sync Failed:", msg);

  // Optional: check for specific Google SDK errors
  if (msg.includes("API_KEY_INVALID")) {
    console.error("👉 Check your .env.local for a valid Google AI API Key.");
  }
  // Specific hint for common developer mistakes
  if (msg.includes("403") || msg.includes("permission")) {
    console.error("💡 Check if your API Key has the 'File Search' scope enabled.");
  }


  process.exit(1);
}