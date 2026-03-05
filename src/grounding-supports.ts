import {createModelContent, GoogleGenAI, GroundingMetadata, ThinkingLevel} from '@google/genai'; // The modern 2026 SDK
import {injectCitationsFromMetadata} from '@src/utils/citation-engine';
import {JOB_DESCRIPTION} from "@src/input/job-description";

import dotenv from "dotenv";
import {marked} from "marked";


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
      // model: 'gemini-3.1-pro-preview',
      config: {
        systemInstruction: `You are a Staff Recruitment Evaluator. Assess the candidate's fit for the Job Description. You understand that résumés/CVs are a lossy
        format and so your goal is to use all the sources you have to make more holistic - and better! - conclusions.        
          
          **GROUNDING & CITATION PROTOCOL (CRITICAL):**
          1. **Atomic Claims**: Write in discrete "fact-units." Every sentence must represent a specific technical claim, project, or trait found in the sources.
          2. **No Filler**: Do not use transition sentences (e.g., "In addition to this...") or general summaries that cannot be traced to a specific file byte-offset.
          3. **Identity Match**: Use the candidate in the files, which include resume/CV, articles, discussions, research papers, etc.
          4. **Sentence-Level Mapping**: Every single sentence must be "groundable." If a sentence contains two distinct facts, split it into two sentences so each can receive its own unique grounding support.
          5. **Synthesis via Alignment**: You may synthesize concepts (e.g., matching a candidate's SQL experience to the JD's requirements), but you must do so by directly citing the underlying evidence.
  
          **CITATION PRIORITY:**
          Resumes and CVs: These are the primary sources for verifying technical toolsets (e.g., Node.js, Kubernetes) and chronological tenure.
          Long-form articles, research papers, and strategic vision assessments: These should be used as primary sources to evaluate thinking, culture-fit, architectural depth, and strategic philosophy.
          Chat logs and code snippets: These should be utilized as primary sources for verifying collaborative style, communication habits, and technical implementation details.

          **Job Description:**
          ${JOB_DESCRIPTION}`,


        // **EVALUATION STRATEGY:**
        // 1. **Technical Foundation**: Use the Resumes / CVs to verify specific tools (Node.js, K8s, TypeScript).
        // 2. **Strategic Value**: Use the candidate's Articles and Papers (e.g., GemStone, Smalltalk Vision) to assess his thinking — eg views on design, system complexity, and long-term stability.
        // 3. **Synthesis**: When the candidate's philosophy explains his technical choices (e.g., why he prefers certain automation patterns), cite both the resume and the relevant paper.

        // **CITATION STYLE:**
        // - Every factual claim must be grounded.
        // - If a claim is supported by multiple sources, ensure you provide enough detail so the grounding engine can map to all relevant sources.


    // systemInstruction: `You are a Staff Recruitment Evaluator. Your goal is to provide a rigorous, evidence-based assessment of the candidate's fit for the Job Description.
        //
        //   **GROUNDING & CITATION PROTOCOL (CRITICAL):**
        //   1. **Atomic Claims**: Write in discrete "fact-units." Every sentence must represent a specific technical claim, project, or trait found in the sources.
        //   2. **No Filler**: Do not use transition sentences (e.g., "In addition to this...") or general summaries that cannot be traced to a specific file byte-offset.
        //   3. **Identity Match**: Use the candidate in the files, which include resume/CV, articles, discussions, research papers, etc.
        //   4. **Sentence-Level Mapping**: Every single sentence must be "groundable." If a sentence contains two distinct facts, split it into two sentences so each can receive its own unique grounding support.
        //   5. **Synthesis via Alignment**: You may synthesize concepts (e.g., matching a candidate's SQL experience to the JD's requirements), but you must do so by directly citing the underlying evidence.
        //
        //   **Job Description:**
        //   ${JOB_DESCRIPTION}`,
        // systemInstruction: //"You are an expert technical recruiter. Use the provided files to answer.",
        //   // `You are a specialized Knowledge Base assistant for professional recruiters helping evaluate John Smith's fit for a specific role.
        //   //       The résumés obviously will provide a lot of specific information and would be the traditional favoured sources, *but* part of your core purpose is
        //   //       look beyond this to the other sources which are either articles or research done or commissioned by John, or other examples of his thoughts
        //   //       and perspectives. Traditional recruiter mechanisms tend to only include résumés and your purpose is to balance that out with a broader perspective,
        //   //       while still including résumé citations within this broader perspective.
        //   //
        //   //
        //   //       **Your Task as the Recruiter Assistant:**
        //   //       - Assess John's fit against the Job Description.
        //   //       - Provide accurate answers based ONLY on the provided source documents. If the answer is not in the documents, state that clearly.
        //   //       - **IMPORTANT**: Provide a unique grounding support for every individual claim, technical skill, or project mentioned. Do not group multiple claims into a single support segment
        //
        //       `You are a specialized Staff Recruitment Evaluator.
        //         Your task is to provide a rigorous, evidence-based assessment of the candiate's fit for the Job Description below.
        //         Provide response in Markdown.
        //         **Fidelity**: Do not summarize away the technical depth. Cite his research, articles, and career highlights specifically.
        //
        //
        //         **GROUNDING & CITATION PROTOCOL:**
        //         - **IMPORTANT**: Provide a unique grounding support for every individual claim, technical skill, or project mentioned. Do not group multiple claims into a single support segment
        //         - IMPORTANT: Include all the groundingChunks and groundingSupports in the rawGroundingMetadata.
        //         - CHECK: Verify that the fact you are mentioning actually exists within the specific source you are "citing" (via the groundingChunks and groundingSupports).
        //         - If information is not available, state that clearly.
        //
        //
        //         **Job Description (Evaluation Rubric):**
        //         Job Description is:
        //
        //         ${JOB_DESCRIPTION}
        //         `,
        tools: [
          {
            fileSearch: {
              // Note: This must be an array of full resource names
              fileSearchStoreNames: [RAG_STORE_NAME!],
              topK: 40
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

  // !! Firebase snippet
  // !! Optimized Multi-Citation Injection
  let altText = response.text;
  const altGroundingSupports = response.candidates?.[0]?.groundingMetadata?.groundingSupports;
  const altGroundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

  if (altGroundingSupports && altGroundingChunks) {
    // Sort supports by endIndex descending to avoid shifting string indices during injection
    const sortedSupports = [...altGroundingSupports].sort((a, b) =>
      (b.segment?.endIndex || 0) - (a.segment?.endIndex || 0)
    );

    for (const support of sortedSupports) {
      const endIndex = support.segment?.endIndex;
      if (endIndex !== undefined) {
        // Extract unique source titles for this specific segment
        const sources = support.groundingChunkIndices
          .map(idx => altGroundingChunks[idx]?.retrievedContext?.title || "Unknown")
          .filter((value, index, self) => self.indexOf(value) === index);

        if (sources.length > 0) {
          const citationTag = ` [[${sources.join(", ")}]]`;
          altText = altText.slice(0, endIndex) + citationTag + altText.slice(endIndex);
        }
      }
    }
  }

  console.log("Firebase: modified altText: ", altText);
  console.log("The RAW response from grounding-supports:");
  console.log(JSON.stringify(response,  null, 2));
  console.log("END raw response from grounding-supports.");


  return {
    text: textWithCitations,
    rawText: rawText,
    citationMap: citationMap,
    rawGroundingMetadata: metadata
  };
}

