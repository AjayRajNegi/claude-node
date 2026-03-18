// EventType enum
export const EventType = Object.freeze({
  TEXT_DELTA: "text_delta",
  MESSAGE_COMPLETE: "message_complete",
  ERROR: "error",
} as const);

export type EventTypeValue = (typeof EventType)[keyof typeof EventType];

// TextDelta factory
export const TextDelta = (content: string) => ({
  content,
  toString() {
    return content;
  },
});

export interface TokenUsageParams {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  cachedTokens?: number;
}

export interface TokenUsageResult {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cachedTokens: number;
  add(other: TokenUsageResult): TokenUsageResult;
}

export const TokenUsage = ({
  promptTokens = 0,
  completionTokens = 0,
  totalTokens = 0,
  cachedTokens = 0,
}: TokenUsageParams = {}): TokenUsageResult => ({
  promptTokens,
  completionTokens,
  totalTokens,
  cachedTokens,
  add(other: TokenUsageResult): TokenUsageResult {
    return TokenUsage({
      promptTokens: promptTokens + other.promptTokens,
      completionTokens: completionTokens + other.completionTokens,
      totalTokens: totalTokens + other.totalTokens,
      cachedTokens: cachedTokens + other.cachedTokens,
    });
  },
});

// StreamEvent factory
export interface StreamEventParams {
  type: EventTypeValue;
  textDelta?: ReturnType<typeof TextDelta> | null;
  error?: string | null;
  finishReason?: string | null;
  usage?: ReturnType<typeof TokenUsage> | null;
}

export const StreamEvent = ({
  type,
  textDelta = null,
  error = null,
  finishReason = null,
  usage = null,
}: StreamEventParams) => ({
  type,
  textDelta,
  error,
  finishReason,
  usage,
});
