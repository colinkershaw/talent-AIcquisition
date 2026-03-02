import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

interface FileSearchDocument {
  name: string;
  displayName?: string;
  state?: "STATE_ACTIVE" | "STATE_PROCESSING" | "STATE_FAILED";
}

async function removeFiles(): Promise<void> {
  const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!API_KEY) {
    console.error("❌ ERROR: GOOGLE_GENERATIVE_AI_API_KEY is missing in .env.local");
    process.exit(1);
  }

  const genAI = new GoogleGenAI({ apiKey: API_KEY });
  const STORE_DISPLAY_NAME = "aivantage-knowledge-base";

  // Use command-line arguments: --all or --id <docId>
  const args = process.argv.slice(2);
  const deleteAll = args.includes("--all");
  const docIdArgIndex = args.indexOf("--id");
  const targetDocId = docIdArgIndex !== -1 ? args[docIdArgIndex + 1] : null;

  if (!deleteAll && !targetDocId) {
    console.log("Usage:");
    console.log("  npx tsx scripts/remove-ai-file-search.mts --all              (Remove all files in the default store)");
    console.log("  npx tsx scripts/remove-ai-file-search.mts --id <id>         (Remove a specific document by its full resource name)");
    return;
  }

  try {
    if (targetDocId) {
      console.log(`🗑️ Deleting document: ${targetDocId}`);
      await genAI.fileSearchStores.documents.delete({
        name: targetDocId,
        config: { force: true }
      });
      console.log("✅ Document deleted.");
      return;
    }

    if (deleteAll) {
      console.log(`🔍 Finding store: ${STORE_DISPLAY_NAME}...`);
      const pager = await genAI.fileSearchStores.list({ config: { pageSize: 10 } });
      const store = pager.page.find((s) => s.displayName === STORE_DISPLAY_NAME);

      if (!store || !store.name) {
        console.error(`❌ Store "${STORE_DISPLAY_NAME}" not found.`);
        return;
      }

      const storeId = store.name;
      console.log(`📦 Store ID: ${storeId}`);

      const docsResponse = await genAI.fileSearchStores.documents.list({
        parent: storeId
      });
      const docs = (docsResponse.page || []) as FileSearchDocument[];

      if (docs.length === 0) {
        console.log("ℹ️ No documents found to delete.");
        return;
      }

      console.log(`⚠️ Deleting ${docs.length} documents...`);
      for (const doc of docs) {
        console.log(`  🗑️ Deleting ${doc.displayName || "Unnamed"} (${doc.name})...`);
        try {
          await genAI.fileSearchStores.documents.delete({
            name: doc.name,
            config: { force: true }
          });
        } catch (err: any) {
          if (err.message?.includes("non-empty")) {
            console.warn(`  ⚠️ Failed to delete ${doc.displayName} even with force: true.`);
            console.warn(`  💡 This should not happen if force: true is supported and working.`);
          }
          throw err;
        }
      }
      console.log("✅ All documents in the store have been deleted.");
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("\n❌ Operation Failed:", msg);
  }
}

void removeFiles();
