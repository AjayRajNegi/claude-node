import { program } from "commander";
import { createLLMClient } from "./client/llm_client";

program.argument("<string>");
program.parse();
const prompt = program.args[0];

async function run(messages: Object[]) {
  const client = createLLMClient();
  for await (const event of client.chatCompletion(messages, true)) {
    console.log(event);
  }

  console.log(messages);
}

async function main(prompt: string | undefined) {
  const messages = [{ role: "user", content: prompt }];
  //await run(messages);

  console.log(prompt, "Main");
}

main(prompt);
