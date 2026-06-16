import { AI_CONFIG } from "./config";
import type { Item } from "../models/HomeModels";

export type BuyVerdict = "must_buy" | "consider" | "skip";

export type ProductInsight = {
  summary: string;
  pros: string[];
  cons: string[];
  health: string;
  verdict: BuyVerdict;
  confidence: number;
  disclaimer: string;
};

type GroqResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

function extractJsonObject(raw: string): string {
  const trimmed = raw.trim();

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const fenceMatch = trimmed.match(/```json\s*([\s\S]*?)```/i);
  if (fenceMatch?.[1]) {
    return fenceMatch[1].trim();
  }

  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first >= 0 && last > first) {
    return trimmed.slice(first, last + 1);
  }

  throw new Error("Invalid AI response format");
}

function cleanList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((x) => String(x ?? "").trim())
    .filter(Boolean)
    .slice(0, 4);
}

function toVerdict(value: unknown): BuyVerdict {
  const v = String(value ?? "").toLowerCase().trim();
  if (v === "must_buy") return "must_buy";
  if (v === "skip") return "skip";
  return "consider";
}

function normalizeInsight(value: any): ProductInsight {
  return {
    summary: String(value?.summary ?? "No summary available.").trim(),
    pros: cleanList(value?.pros),
    cons: cleanList(value?.cons),
    health: String(value?.health ?? "Health information unavailable.").trim(),
    verdict: toVerdict(value?.verdict),
    confidence: Math.max(0, Math.min(100, Number(value?.confidence ?? 60))),
    disclaimer: String(
      value?.disclaimer ??
        "AI-generated suggestion. Verify ingredients/allergens before purchase."
    ).trim(),
  };
}

export function canUseAiInsight() {
  return Boolean(AI_CONFIG.GROQ_API_KEY.trim());
}

export async function getProductInsight(item: Item): Promise<ProductInsight> {
  if (!canUseAiInsight()) {
    throw new Error("Groq key missing. Set EXPO_PUBLIC_GROQ_API_KEY.");
  }

  const prompt = [
    "Analyze this grocery/food product for a buyer.",
    `Name: ${item.name}`,
    `Price INR: ${item.price}`,
    `Description: ${item.description || "No description"}`,
    "Respond only as strict JSON with this exact shape:",
    '{"summary":"string","pros":["string"],"cons":["string"],"health":"string","verdict":"must_buy|consider|skip","confidence":0-100,"disclaimer":"string"}',
    "Keep language concise, practical, and user-friendly.",
  ].join("\n");

  const res = await fetch(AI_CONFIG.GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AI_CONFIG.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: AI_CONFIG.GROQ_MODEL,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You are a nutrition-aware shopping assistant. Return only valid JSON.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Groq request failed (${res.status})`);
  }

  const json = (await res.json()) as GroqResponse;
  const content = json?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Groq returned empty content");
  }

  const parsed = JSON.parse(extractJsonObject(content));
  return normalizeInsight(parsed);
}
