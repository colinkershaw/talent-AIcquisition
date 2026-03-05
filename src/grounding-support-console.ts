import { getGroundedResponse } from './grounding-supports';

async function main() {
  const response = await getGroundedResponse("How would the candidate fit the role?");
  console.log(JSON.stringify(response, null, 2));
}

try {
  await main();
} catch (err) {
  console.error("❌ Assessment failed:", err);
  process.exit(1);
}