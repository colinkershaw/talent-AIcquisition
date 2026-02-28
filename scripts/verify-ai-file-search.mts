import { GoogleGenAI,  } from "@google/genai";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

// The SDK does not export the Document interface directly for use as a type cast
// so we define a local interface based on the official API response schema
interface FileSearchDocument {
  name: string;
  displayName?: string;
  state?: "STATE_ACTIVE" | "STATE_PROCESSING" | "STATE_FAILED";
}

async function verify(): Promise<void> {
  const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!API_KEY) {
    throw new Error("❌ GOOGLE_GENERATIVE_AI_API_KEY is missing in .env.local");
  }

  const genAI = new GoogleGenAI({ apiKey: API_KEY });

  try {
    console.log("🔍 Fetching Stores...");

    // In @google/genai, .list() returns an object with a 'page' property
    const storesResponse = await genAI.fileSearchStores.list();
    const stores = storesResponse.page;

    if (!stores || stores.length === 0) {
      console.log("❌ No stores found.");
      return;
    }

    for (const store of stores) {
      const storeId = store.name;
      if (!storeId) continue;

      console.log(`\n📂 Store: ${store.displayName} (${storeId})`);

      // Verified SDK Path: genAI.fileSearchStores.documents.list({ parent: storeId })
      const docsResponse = await genAI.fileSearchStores.documents.list({
        parent: storeId
      });

      // Use our local interface to avoid 'any' while dealing with the SDK's internal types
      const docs = (docsResponse.page || []) as FileSearchDocument[];

      if (docs.length === 0) {
        console.log("   (empty)");
      } else {
        docs.forEach((d: FileSearchDocument) => {
          const status = d.state === "STATE_ACTIVE" ? "✅" : "⏳";
          console.log(`   ${status} ${d.displayName || 'Unnamed'} [ID: ${d.name}]`);
        });
      }
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("\n❌ Verification Failed:", msg);
  }
}

void verify();