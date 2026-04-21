import { createLLMClient } from "../client/llm_client";
import { StreamEventType } from "../client/response";
import {
  AgentEventType,
  createAgentEnd,
  createAgentError,
  createAgentStart,
  createTextComplete,
  createTextDelta,
} from "./events";

export const Agent = () => {
  let client = createLLMClient();

  async function* run(message: string) {
    // AgentEvent of start is yielded
    yield createAgentStart(message);

    let finalResponse = "";
    for await (const event of agenticLoop()) {
      yield event;

      if (event.type === AgentEventType.TEXT_COMPLETE) {
        finalResponse = String(event.data.content);
      }
    }
    // AgentEvent of end is yielded
    yield createAgentEnd(finalResponse);
  }

  async function* agenticLoop() {
    const messages = [{ role: "user", content: "Hey!" }];
    let responseText = "";

    for await (const event of client.chatCompletion(messages, true)) {
      if (event.type === StreamEventType.TEXT_DELTA) {
        const content = event.textDelta?.content;
        if (!content) return;
        responseText += content;

        // AgentEvent is yielded
        yield createTextDelta(content);
      } else if (event.type === StreamEventType.ERROR) {
        // AgentEvent is yielded
        yield createAgentError(
          event.error ? event.error : "Unknown error occured.",
        );
      }
    }
    if (responseText) {
      // AgentEvent is yielded
      yield createTextComplete(responseText);
    }
  }

  async function aenter(agent: typeof Agent) {
    return agent;
  }

  async function aexit() {
    await client.close();
  }

  return { run };
};
