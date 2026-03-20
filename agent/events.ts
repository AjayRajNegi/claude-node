import type { TokenUsageResult } from "../client/response";

export const AgentEventType = Object.freeze({
  // Agent Lifecycle
  AGENT_START: "agentStart",
  AGENT_ENDING: "agentEnding",
  AGENT_ERROR: "agentError",

  //   Text Streaming
  TEXT_DELTA: "textDelta",
  TEXT_COMPLETE: "textComplete",
});

export type AgentEventTypeValue =
  (typeof AgentEventType)[keyof typeof AgentEventType];

interface AgentEvent {
  type: AgentEventTypeValue;
  data: Record<string, unknown>;
}

export const createAgentStart = (message: string) => {
  return {
    type: AgentEventType.AGENT_START,
    data: { message },
  };
};

export const createAgentEnd = (
  response?: string | null,
  usage: TokenUsageResult | null = null,
): AgentEvent => {
  return {
    type: AgentEventType.AGENT_ENDING,
    data: {
      response: response ?? null,
      usage: usage ?? null,
    },
  };
};

export const createAgentError = (
  error: string,
  details: Record<string, unknown> | null = null,
): AgentEvent => {
  return {
    type: AgentEventType.AGENT_ERROR,
    data: {
      error: error,
      details: details ?? null,
    },
  };
};

export const createTextDelta = (content: string): AgentEvent => {
  return {
    type: AgentEventType.TEXT_DELTA,
    data: {
      content: content,
    },
  };
};

export const createTextComplete = (content: string): AgentEvent => {
  return {
    type: AgentEventType.TEXT_COMPLETE,
    data: {
      content: content,
    },
  };
};
