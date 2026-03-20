import { program } from "commander";
import { createLLMClient } from "./client/llm_client";

program.argument("<string>");
program.parse();
const prompt = program.args[0];
console.log(program.args[0]);

async function main(prompt: string | undefined) {
  const client = createLLMClient();
  const messages = [{ role: "user", content: prompt }];

  for await (const event of client.chatCompletion(messages, true)) {
    console.log(event);
  }
}

main(prompt);
