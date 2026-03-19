import { APIConnectionError, APIError, OpenAI, RateLimitError } from "openai";
import {
  EventType,
  StreamEvent,
  TextDelta,
  TokenUsage,
  type TokenUsageResult,
} from "./response";

export const createLLMClient = () => {
  let client: OpenAI | null = null;
  let maxTries: number = 3;

  function getClient(): OpenAI {
    if (client === null) {
      client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: "https://openrouter.ai/api/v1",
      });
    }

    return client;
  }

  async function close() {
    if (client) {
      client = null;
    }
  }

  async function* chatCompletion(messages: any, stream: boolean = true) {
    client = getClient();

    if (!client) {
      console.log("No OpenAIClient.");
      return;
    }
    for (let attempt = 1; attempt <= maxTries + 1; attempt++) {
      try {
        if (stream === true) {
          for await (const event of streamResponse(client, {
            model: "nvidia/nemotron-3-nano-30b-a3b:free",
            messages,
            stream,
          })) {
            yield event;
          }
        } else {
          const event = await nonStreamResponse(client, {
            model: "nvidia/nemotron-3-nano-30b-a3b:free",
            messages,
            stream,
          });
          yield event;
        }
      } catch (e) {
        if (e instanceof RateLimitError || e instanceof APIConnectionError) {
          if (attempt < maxTries) {
            const waitTime = 2 ** attempt * 1000;
            await new Promise((resolve) => setTimeout(resolve, waitTime));
          } else {
            const prefix =
              e instanceof RateLimitError
                ? "Rate limit exceeded"
                : "Connection error";
            yield StreamEvent({
              type: EventType.ERROR,
              error: `${prefix}: ${e.message}`,
            });
            return;
          }
        } else if (e instanceof APIError) {
          yield StreamEvent({
            type: EventType.ERROR,
            error: `API error: ${e.message}`,
          });
          return;
        } else {
          throw e;
        }
      }
    }
  }

  async function* streamResponse(
    openaiClient: OpenAI,
    kwargs: {
      model: string;
      messages: OpenAI.Chat.ChatCompletionMessageParam[];
      stream?: true;
    },
  ) {
    const response = await openaiClient.chat.completions.create({
      ...kwargs,
      stream: true,
    });

    let usage: TokenUsageResult | null = null;
    let finishReason: string | null = null;

    for await (const chunk of response) {
      if ("usage" in chunk && chunk.usage) {
        const tokenUsage = chunk.usage;
        usage = TokenUsage({
          promptTokens: tokenUsage.prompt_tokens,
          completionTokens: tokenUsage.completion_tokens,
          totalTokens: tokenUsage.total_tokens,
          cachedTokens: tokenUsage.prompt_tokens_details?.cached_tokens ?? 0,
        });
      }

      if (!chunk.choices) continue;

      const choice = chunk.choices[0];
      const delta = choice?.delta;

      if (choice?.finish_reason) {
        finishReason = choice.finish_reason;
      }

      if (delta?.content) {
        yield StreamEvent({
          type: EventType.TEXT_DELTA,
          textDelta: TextDelta(delta.content),
        });
      }
    }

    yield StreamEvent({
      type: EventType.MESSAGE_COMPLETE,
      finishReason: finishReason,
      usage: usage,
    });
  }

  async function nonStreamResponse(
    openaiClient: OpenAI,
    kwargs: {
      model: string;
      messages: OpenAI.Chat.ChatCompletionMessageParam[];
      stream?: false;
    },
  ) {
    const response = await openaiClient.chat.completions.create(kwargs);
    const choice = response.choices[0];
    const message = choice?.message;

    let textDelta = null;
    if (message?.content) {
      textDelta = TextDelta(message.content);
    }

    let usage = null;
    if (response.usage) {
      usage = TokenUsage({
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
        cachedTokens: response.usage.prompt_tokens_details?.cached_tokens ?? 0,
      });
    }

    return StreamEvent({
      type: EventType.MESSAGE_COMPLETE,
      textDelta: textDelta,
      finishReason: choice?.finish_reason,
      usage: usage,
    });
  }

  return { chatCompletion, close };
};
