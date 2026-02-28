import { getGroundedResponse } from './grounding-supports';

async function main() {
  const response = await getGroundedResponse("How would John fit the role of a Staff-level SRE?");
  console.log(JSON.stringify(response, null, 2));
}

await main();