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
  // 1. Clean up "Hallucinated" Indentation
  const cleanMarkdown = result.text
    .split('\n')
    .map(line => line.trimEnd()) // Only trim the end to avoid breaking deliberate lists
    .join('\n');

  // 2. Configure and Parse in one clean shot
  // Do NOT manually wrap in <p> tags before this
  const htmlBody = marked.parse(cleanMarkdown, {
    gfm: true,
    breaks: true
  }) as string;

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: sans-serif; padding: 40px; line-height: 1.6; }
        strong { font-weight: bold; color: #000; } /* Force visibility */
        table { border-collapse: collapse; width: 100%; }
        td, th { border: 1px solid #ddd; padding: 8px; }
    </style>
</head>
<body>
    <div class="assessment-content">
        ${htmlBody}
    </div>
</body>
</html>`;
}