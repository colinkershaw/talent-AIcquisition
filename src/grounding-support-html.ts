import { getGroundedResponse } from './grounding-supports';
import { generateAssessmentHtml } from '@src/utils/html-generator';
import * as fs from 'fs';

async function main() {
  console.log("🤖 Running talent assessment...");

  const response = await getGroundedResponse("How would the candidate fit the role?");

  // Generate the interactive HTML
  const html = generateAssessmentHtml(response);

  // Save to disk
  fs.writeFileSync('../assessment.html', html);

  console.log("✅ Interactive HTML report generated: assessment.html");
  console.log(JSON.stringify(response, null, 2));
}

try {
  await main();
} catch (err) {
  console.error("❌ Assessment failed:", err);
  process.exit(1);
}