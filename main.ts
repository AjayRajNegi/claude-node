import { createLLMClient } from "./client/llm_client";

async function main() {
  const client = createLLMClient();
  const messages = [{ role: "user", content: "What's up?" }];

  for await (const event of client.chatCompletion(messages, false)) {
    console.log(event);
  }

  console.log("Done");
}

main();
