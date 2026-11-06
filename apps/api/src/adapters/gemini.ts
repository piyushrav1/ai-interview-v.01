import type { AIModel } from "@testmeman/core";
import type { Phase } from "@testmeman/contracts";
import { GoogleGenAI } from "@google/genai";
import type { ZodType } from "zod";

/**
 * Real Gemini adapter using @google/genai.
 *
 * `chat()` uses `generateContentStream` for word-by-word streaming.
 * `structured()` uses `generateContent` with JSON response mode.
 */
export class GeminiModel implements AIModel {
  private readonly client: GoogleGenAI;
  private readonly modelName: string;

  constructor(params: { apiKey: string; modelName?: string }) {
    this.client = new GoogleGenAI({ apiKey: params.apiKey });
    this.modelName = params.modelName ?? "gemini-3.1-flash-lite";
  }

  async *chat(input: {
    system: string;
    messages: { role: "interviewer" | "candidate"; text: string }[];
    phase: Phase;
    signal?: AbortSignal;
  }): AsyncIterable<string> {
    // Map our message roles to Gemini roles
    const contents = input.messages.map((m) => ({
      role: m.role === "candidate" ? ("user" as const) : ("model" as const),
      parts: [{ text: m.text }],
    }));

    const response = await this.client.models.generateContentStream({
      model: this.modelName,
      contents,
      config: {
        systemInstruction: input.system,
      },
    });

    for await (const chunk of response) {
      if (input.signal?.aborted) break;
      const text = chunk.text;
      if (text) {
        yield text;
      }
    }
  }

  async structured<T>(params: {
    system: string;
    prompt: string;
    schema: ZodType<T>;
    temperature?: number;
  }): Promise<T> {
    // Convert the Zod schema description into the prompt since @google/genai
    // doesn't natively accept Zod. We ask for JSON and parse with Zod.
    const schemaDescription = JSON.stringify(schemaToJsonDescription(params.schema), null, 2);

    const fullPrompt = `${params.prompt}\n\nRespond with a JSON object matching this schema:\n${schemaDescription}`;

    const config: Record<string, unknown> = {
      systemInstruction: params.system,
      responseMimeType: "application/json",
    };
    if (params.temperature !== undefined) {
      config.temperature = params.temperature;
    }

    const response = await this.client.models.generateContent({
      model: this.modelName,
      contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
      config,
    });

    const text = response.text;
    if (!text) {
      throw new Error("Gemini returned empty response for structured output");
    }

    const parsed: unknown = JSON.parse(text);
    return params.schema.parse(parsed);
  }
}

/**
 * Converts a Zod schema into a simplified JSON schema description object.
 * This is a best-effort conversion for the evaluator schema shape.
 */
function schemaToJsonDescription(schema: ZodType<unknown>): Record<string, unknown> {
  const def = (schema as unknown as { _def: { typeName: string; shape?: () => Record<string, ZodType<unknown>>; innerType?: ZodType<unknown>; type?: ZodType<unknown>; checks?: { kind: string; value: unknown }[]; values?: Record<string, string>; options?: ZodType<unknown>[] } })._def;

  switch (def.typeName) {
    case "ZodObject": {
      const shape = def.shape?.() ?? {};
      const properties: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(shape)) {
        properties[key] = schemaToJsonDescription(value as ZodType<unknown>);
      }
      return { type: "object", properties };
    }
    case "ZodArray":
      return { type: "array", items: schemaToJsonDescription(def.type as ZodType<unknown>) };
    case "ZodString":
      return { type: "string" };
    case "ZodNumber": {
      const checks = def.checks ?? [];
      const result: Record<string, unknown> = { type: "number" };
      for (const check of checks) {
        if (check.kind === "int") result["type"] = "integer";
        if (check.kind === "min") result["minimum"] = check.value;
        if (check.kind === "max") result["maximum"] = check.value;
      }
      return result;
    }
    case "ZodBoolean":
      return { type: "boolean" };
    case "ZodNativeEnum":
      return { type: "string", enum: Object.values(def.values ?? {}) };
    case "ZodEnum":
      return { type: "string", enum: (def as unknown as { values: string[] }).values };
    case "ZodDefault":
      return schemaToJsonDescription(def.innerType as ZodType<unknown>);
    default:
      return { type: "string" };
  }
}
