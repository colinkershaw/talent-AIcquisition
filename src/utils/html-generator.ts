import { marked, Tokens } from 'marked';
import { GroundedResult } from '../grounding-supports';

/**
 * Escapes strings for HTML tooltips.
 */
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function generateAssessmentHtml(result: GroundedResult): string {
  const { text, citationMap } = result;

  const renderer = new marked.Renderer();

  // FIX: Explicitly type the token and access token.text
  renderer.text = (token: Tokens.Text | Tokens.Escape): string => {
    // We only want to process the citation replacement on the raw text
    return token.text.replace(/\[1\.(\d+)\]/g, (match, id) => {
      const citationId = parseInt(id, 10);
      const citation = citationMap.find(c => c.id === citationId);
      if (!citation) return match;

      const safeCitedText = escapeHtml(citation.citedText).replace(/\n/g, '<br>');
      const safeSource = escapeHtml(citation.source);

      return `<span class="cite-badge">${citationId}<div class="tooltip"><span class="source-tag">Source: ${safeSource}</span><span class="content-text">${safeCitedText}</span></div></span>`;
    });
  };

  // marked.parse is often async in newer versions or requires specific options
  // We use the synchronous parse here
  const htmlContent = marked.parse(text, { renderer, gfm: true, breaks: true }) as string;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Candidate Assessment</title>
    <style>
        body { font-family: -apple-system, system-ui, sans-serif; line-height: 1.6; color: #202124; max-width: 900px; margin: 40px auto; padding: 20px; background: #f8f9fa; }
        .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
        
        /* Table Styling */
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #dadce0; padding: 12px; text-align: left; }
        th { background-color: #f1f3f4; }

        h3 { color: #1a73e8; border-bottom: 2px solid #e8eaed; padding-bottom: 8px; margin-top: 30px; }
        
        /* Citation Styles */
            .cite-badge { display: inline-flex; align-items: center; justify-content: center; background: #1a73e8; color: white; font-size: 0.65rem; font-weight: bold; width: 1.2rem; height: 1.2rem; border-radius: 50%; margin-left: 0.25rem; cursor: pointer; position: relative; vertical-align: super; }
            .tooltip { visibility: hidden; opacity: 0; width: min(500px, 90vw); max-height: 50vh; overflow-y: auto; background: white; color: #3c4043; border: 1px solid #dadce0; border-radius: 8px; padding: 1rem; position: fixed; z-index: 1000; top: 50%; left: 50%; transform: translate(-50%, -50%); box-shadow: 0 10px 40px rgba(0,0,0,0.25); font-weight: normal; font-style: normal; transition: opacity 0.2s; pointer-events: none; }
            .cite-badge:hover .tooltip { visibility: visible; opacity: 1; pointer-events: auto; }
            .source-tag { display: block; font-size: 1.2rem; font-weight: bold; color: #1a73e8; margin-bottom: 0.5rem; border-bottom: 1px solid #f1f3f4; }
    </style>
</head>
<body>
    <div class="container">
        ${htmlContent}
    </div>
</body>
</html>`;
}