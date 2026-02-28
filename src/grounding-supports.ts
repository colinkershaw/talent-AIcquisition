import {GoogleGenAI, GroundingMetadata, ThinkingLevel} from '@google/genai'; // The modern 2026 SDK
import {injectCitationsFromMetadata} from '@src/utils/citation-engine';
import {JOB_DESCRIPTION} from "@src/input/job-description";

import dotenv from "dotenv";


dotenv.config({ path: "../.env.local" });

const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
if (!API_KEY) {
  console.error("❌ ERROR: GOOGLE_GENERATIVE_AI_API_KEY is missing in .env.local");
  process.exit(1);
}

const RAG_STORE_NAME = process.env.GEMINI_FILE_SEARCH_STORE_ID;
if (!RAG_STORE_NAME) {
  console.error("❌ ERROR: RAG_STORE_NAME is missing in .env.local");
  process.exit(1);
}


// 1. Types for your refined response object
export interface GroundedResult {
  text: string;           // The final text with [1.x] citations injected
  rawText: string;        // The original "clean" model output
  citationMap: Citation[];
  rawGroundingMetadata: GroundingMetadata;
}

export interface Citation {
  id: number;
  source: string;
  citedText: string;
  uri?: string;
}


const ai = new GoogleGenAI({ apiKey: API_KEY });

export async function getGroundedResponse(userQuery: string): Promise<GroundedResult> {
  const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: //"You are an expert technical recruiter. Use the provided files to answer.",
          // `You are a specialized Knowledge Base assistant for professional recruiters helping evaluate John Smith's fit for a specific role.
          //       The résumés obviously will provide a lot of specific information and would be the traditional favoured sources, *but* part of your core purpose is
          //       look beyond this to the other sources which are either articles or research done or commissioned by John, or other examples of his thoughts
          //       and perspectives. Traditional recruiter mechanisms tend to only include résumés and your purpose is to balance that out with a broader perspective,
          //       while still including résumé citations within this broader perspective.
          //
          //
          //       **Your Task as the Recruiter Assistant:**
          //       - Assess John's fit against the Job Description.
          //       - Provide accurate answers based ONLY on the provided source documents. If the answer is not in the documents, state that clearly.
          //       - **IMPORTANT**: Provide a unique grounding support for every individual claim, technical skill, or project mentioned. Do not group multiple claims into a single support segment

              `You are a specialized Staff Recruitment Evaluator. 
                Your task is to provide a rigorous, evidence-based assessment of John Smith's fit for the Job Description below.

                **GROUNDING & CITATION PROTOCOL:**
                1. **Strict Mapping**: You MUST support every claim with reference to the source documents.
                2. **Fidelity**: Do not summarize away the technical depth. Cite his research, articles, and career highlights specifically.
                
             
                **Job Description (Evaluation Rubric):**
                Job Description is: 
                
                ${JOB_DESCRIPTION}
                `,
        tools: [
          {
            fileSearch: {
              // Note: This must be an array of full resource names
              fileSearchStoreNames: [RAG_STORE_NAME!],
            }
          }
        ],
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.MEDIUM // Enables the model to reason about the files first
        }
      },
    contents: [{ role: 'user', parts: [{ text: userQuery }] }]
    });
  const candidate = response.candidates?.[0];
  const rawText = candidate?.content?.parts?.[0]?.text || "";
  const metadata = candidate?.groundingMetadata;

  // 2. Build the Source Reference List
  const citationMap: Citation[] = metadata?.groundingChunks?.map((chunk, i) => ({
    id: i + 1,
    source: chunk.retrievedContext?.title || "Unknown Source",
    citedText: chunk.retrievedContext?.text || "Unknown Cited Text",
    uri: chunk.retrievedContext?.uri
  })) || [];

  // 3. Inject the citations into the text using metadata offsets
  const textWithCitations = injectCitationsFromMetadata(rawText, metadata);

  return {
    text: textWithCitations,
    rawText: rawText,
    citationMap: citationMap,
    rawGroundingMetadata: metadata
  };
}

