import { program } from "commander";
import { Agent } from "./agent/agent";
import { AgentEventType } from "./agent/events";
import { createTUI } from "./ui/tui";

program.argument("<prompt>");
program.parse(process.argv);

const prompt = program.processedArgs[0];
main(prompt);

interface CLI {
  agent: ReturnType<typeof Agent> | null;
  tui: ReturnType<typeof createTUI> | null;
}

function createCLI(): CLI {
  return { agent: null, tui: null };
}

async function runSingle(cli: CLI, message: string) {
  const agent = Agent();
  cli.agent = agent;
  const tui = createTUI();
  cli.tui = tui;

  try {
    await processMessage(cli, message);
  } catch (error) {
    console.log(error);
  }
}

async function processMessage(cli: CLI, message: string) {
  if (!cli.agent) {
    return null;
  }

  let assistant_streaming = false;
  for await (const event of cli.agent.run(message)) {
    if (event.type === AgentEventType.TEXT_DELTA) {
      const content = event.data.content ?? "";
      cli.tui?.streamAssistantDelta(String(content));
    }
  }
  return null;
}

async function main(prompt: string | undefined) {
  const cli = createCLI();
  if (prompt) {
    await runSingle(cli, prompt);
  }
}

// main(prompt);
