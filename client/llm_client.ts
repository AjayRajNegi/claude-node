import { OpenAI } from "openai";
import { EventType, StreamEvent, TextDelta, TokenUsage } from "./response";

export const createLLMClient = () => {
  let client: OpenAI | null = null;

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
    const kwargs = {
      model: "nvidia/nemotron-3-nano-30b-a3b:free",
      messages,
      stream,
    };

    if (!client) {
      return;
    }
    if (stream === true) {
      await streamResponse(client, kwargs);
    } else {
      const event = await nonStreamResponse(client, {
        model: "nvidia/nemotron-3-nano-30b-a3b:free",
        messages,
        stream,
      });
      yield event;
    }
  }

  async function streamResponse(openaiClient: OpenAI, kwargs: object) {}

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
