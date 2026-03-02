import { getGroundedResponse } from './grounding-supports';
import { generateAssessmentHtml } from '@src/utils/html-generator';
import * as fs from 'fs';

async function main() {
  console.log("🤖 Running talent assessment...");

  const response = await getGroundedResponse("How would John fit the role of a Staff-level SRE?");

  // Generate the interactive HTML
  const html = generateAssessmentHtml(response);

  // Save to disk
  fs.writeFileSync('../index.html', html);

  console.log("✅ Interactive HTML report generated: index.html");
  console.log(JSON.stringify(response, null, 2));
}

try {
  await main();
} catch (err) {
  console.error("❌ Assessment failed:", err);
  process.exit(1);
}