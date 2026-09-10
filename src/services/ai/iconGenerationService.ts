import type { GenerateIconParams, GeneratedIcon } from "@/types";
import { validateSvg, sanitizeSvg, ensureViewBox } from "@/utils/svgSanitizer";

const MAX_RETRIES = 3;

function getConfiguredValues(pattern: RegExp, names: string[]): string[] {
  const env = import.meta.env as Record<string, unknown>;
  const values = Object.entries(env)
    .filter(([name]) => pattern.test(name))
    .sort(([left], [right]) => {
      const leftNumber = Number(left.match(/_(\d+)$/)?.[1] || 0);
      const rightNumber = Number(right.match(/_(\d+)$/)?.[1] || 0);
      return leftNumber - rightNumber || left.localeCompare(right);
    })
    .flatMap(([, value]) =>
      typeof value === "string" ? value.split(/[\n,]+/) : [],
    );

  return names
    .flatMap((name) =>
      typeof env[name] === "string" ? [env[name] as string] : [],
    )
    .flatMap((value) => value.split(/[\n,]+/))
    .concat(values)
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value, index, all) => all.indexOf(value) === index);
}

function getOpenRouterKeys(explicitKey?: string): string[] {
  return getConfiguredValues(
    /^VITE_OPENROUTER_API_KEYS?(?:_\d+)?$/,
    ["VITE_OPENROUTER_API_KEY", "VITE_OPENROUTER_API_KEYS"],
  )
    .concat(explicitKey?.trim() ? [explicitKey.trim()] : [])
    .filter((value, index, all) => all.indexOf(value) === index);
}

function getOpenRouterModels(): string[] {
  return getConfiguredValues(
    /^VITE_OPENROUTER_API_MODELS?(?:_\d+)?$/,
    ["VITE_OPENROUTER_API_MODEL", "VITE_OPENROUTER_API_MODELS"],
  ).concat("openai/gpt-4o-mini");
}

function getReplicateKeys(): string[] {
  return getConfiguredValues(
    /^(?:VITE_)?REPLICATE_API_TOKENS?(?:_\d+)?$/,
    ["VITE_REPLICATE_API_TOKEN", "REPLICATE_API_TOKEN"],
  );
}

function getReplicateModels(): string[] {
  return getConfiguredValues(
    /^(?:VITE_)?REPLICATE_API_MODELS?(?:_\d+)?$/i,
    ["VITE_REPLICATE_API_MODEL", "REPLICATE_API_MODEL", "REPLICATE_API_model"],
  ).concat("meta/meta-llama-3.1-8b-instruct");
}

function isRateLimitError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /429|rate limit|quota|free limit|limit exceeded|too many requests/i.test(
    message,
  );
}

const SYSTEM_PROMPT = `You are an expert SVG icon designer. Generate a clean, production-ready SVG icon based on the user's description.

The user can request ANY icon or visual concept. Do not rely on a predefined icon list. Interpret the user's natural-language description.

Requirements:
- SVG only
- viewBox="0 0 24 24"
- vector elements only (path, circle, rect, line, polyline, polygon, ellipse, g)
- no PNG, JPG, JPEG, WEBP, GIF or any raster images
- no base64 encoded content
- no external resources or URLs
- no JavaScript or HTML
- no scripts or event handlers
- no unnecessary metadata or comments
- no text elements unless explicitly requested
- clean geometry
- centered composition within the viewBox
- consistent proportions
- suitable for UI usage at small sizes

Return ONLY a JSON object with this exact structure:
{
  "title": "Short icon title",
  "description": "Brief description of the icon",
  "svg": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>...</svg>"
}`;

function buildUserPrompt(params: GenerateIconParams): string {
  const { prompt, style, complexity, cornerStyle } = params;

  let styleInstruction = "";
  if (style === "fill") {
    styleInstruction = `
Style: FILLED icon
- Use filled paths and shapes
- Use currentColor for fills
- Create clean silhouettes
- Avoid unnecessary strokes
- Make shapes solid and well-defined`;
  } else {
    styleInstruction = `
Style: STROKE/OUTLINE icon
- Use fill="none"
- Use stroke="currentColor"
- Use consistent stroke-width (1.5 to 2)
- Use stroke-linecap="round"
- Use stroke-linejoin="round"
- Clean line geometry`;
  }

  const complexityMap: Record<string, string> = {
    simple: "Keep the icon simple with minimal details. Basic shapes only.",
    medium: "Use moderate detail level with some decorative elements.",
    detailed: "Include fine details and decorative elements for a rich icon.",
  };
  const complexityInstruction = complexityMap[complexity];

  const cornerInstruction =
    cornerStyle === "rounded"
      ? "Use rounded corners and smooth curves where applicable."
      : "Use sharp, angular corners where applicable.";

  return `Generate an SVG icon for: "${prompt}"

${styleInstruction}

Complexity: ${complexityInstruction}
Corners: ${cornerInstruction}

Return the JSON response with title, description, and svg fields.`;
}

function parseAiResponse(responseText: string): {
  title: string;
  description: string;
  svg: string;
} {
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.svg && typeof parsed.svg === "string") {
        return {
          title: parsed.title || "Generated Icon",
          description: parsed.description || "AI-generated SVG icon",
          svg: parsed.svg,
        };
      }
    } catch {
      // JSON parsing failed, try to find SVG
    }
  }

  const svgMatch = responseText.match(/<svg[\s\S]*?<\/svg>/i);
  if (svgMatch) {
    return {
      title: "Generated Icon",
      description: "AI-generated SVG icon",
      svg: svgMatch[0],
    };
  }

  throw new Error("Could not parse SVG from AI response");
}

function normalizeReplicateOutput(output: unknown): string {
  if (typeof output === "string") {
    return output;
  }

  if (Array.isArray(output)) {
    return output
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }
        return JSON.stringify(item);
      })
      .join("\n");
  }

  if (output && typeof output === "object") {
    const record = output as Record<string, unknown>;
    if (typeof record.text === "string") {
      return record.text;
    }
    if (typeof record.content === "string") {
      return record.content;
    }
    if (Array.isArray(record.content)) {
      return record.content
        .map((item) => {
          if (typeof item === "string") {
            return item;
          }
          return JSON.stringify(item);
        })
        .join("\n");
    }
    return JSON.stringify(output);
  }

  return String(output ?? "");
}

async function fetchReplicateText(
  prompt: string,
  apiKey: string,
  model: string,
): Promise<string> {
  const modelPath = model.trim().replace(/^\/+|\/+$/g, "");
  if (!modelPath) {
    throw new Error("Replicate model is not configured");
  }

  const createResponse = await fetch(`/api/replicate/v1/models/${modelPath}/predictions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${apiKey}`,
    },
    body: JSON.stringify({
      input: {
        prompt,
        max_tokens: 2000,
        temperature: 0.7,
      },
    }),
  });

  if (!createResponse.ok) {
    const errorData = await createResponse.json().catch(() => ({}));
    const message =
      errorData?.error?.message ||
      errorData?.detail ||
      `Replicate API error: ${createResponse.status}`;
    throw new Error(message);
  }

  const prediction = await createResponse.json();
  const predictionId = prediction?.id;

  if (!predictionId) {
    throw new Error("No prediction id returned from Replicate");
  }

  for (let poll = 0; poll < 30; poll++) {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const pollResponse = await fetch(`/api/replicate/v1/predictions/${predictionId}`, {
      method: "GET",
      headers: {
        Authorization: `Token ${apiKey}`,
      },
    });

    if (!pollResponse.ok) {
      const errorData = await pollResponse.json().catch(() => ({}));
      const message =
        errorData?.error?.message ||
        errorData?.detail ||
        `Replicate polling error: ${pollResponse.status}`;
      throw new Error(message);
    }

    const data = await pollResponse.json();
    const status = data?.status;

    if (status === "succeeded") {
      return normalizeReplicateOutput(data.output);
    }

    if (status === "failed" || status === "canceled") {
      throw new Error(data?.error || `Replicate prediction ${status}`);
    }
  }

  throw new Error("Replicate generation timed out");
}

let abortController: AbortController | null = null;

export async function generateSvgIcon(
  params: GenerateIconParams,
  apiKey?: string,
): Promise<GeneratedIcon> {
  const openRouterKeys = getOpenRouterKeys(apiKey);
  const openRouterModels = getOpenRouterModels();
  const replicateKeys = getReplicateKeys();
  const replicateModels = getReplicateModels();

  if (!openRouterKeys.length && !replicateKeys.length) {
    throw new Error(
      "API key is required. Please configure VITE_OPENROUTER_API_KEY or REPLICATE_API_TOKEN in your .env file.",
    );
  }

  const userPrompt = buildUserPrompt(params);

  const providers = [
    ...openRouterKeys.flatMap((key) =>
      openRouterModels.map((model) => ({
        name: "openrouter" as const,
        key,
        model,
        call: async () => {
          abortController = new AbortController();
          const response = await fetch("/api/openrouter/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${key}`,
              "HTTP-Referer": window.location.origin,
              "X-Title": "PixelCoders - AI SVG Icon Generator",
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: userPrompt },
              ],
              temperature: 0.7,
              max_tokens: 2000,
            }),
            signal: abortController.signal,
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const msg =
              errorData?.error?.message || `API error: ${response.status}`;
            if (response.status === 429 || response.status === 402) {
              throw new Error(
                "Rate limit exceeded. Switching to Replicate fallback.",
              );
            }
            throw new Error(msg);
          }

          const data = await response.json();
          const content = data.choices?.[0]?.message?.content;

          if (!content) {
            throw new Error("Empty response from AI model");
          }

          return content;
        },
      })),
    ),
    ...replicateKeys.flatMap((key) =>
      replicateModels.map((model) => ({
        name: "replicate" as const,
        key,
        model,
        call: () => fetchReplicateText(userPrompt, key, model),
      })),
    ),
  ];

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    for (const provider of providers) {
      if (!provider.key) {
        continue;
      }

      try {
        const content = await provider.call();
        const parsed = parseAiResponse(content);
        const validation = validateSvg(parsed.svg);

        if (validation.isValid) {
          const sanitized = sanitizeSvg(parsed.svg);
          const finalSvg = ensureViewBox(sanitized);

          return {
            id: crypto.randomUUID(),
            svg: finalSvg,
            title: parsed.title,
            description: parsed.description,
            style: params.style,
            prompt: params.prompt,
            timestamp: Date.now(),
          };
        }

        if (attempt < MAX_RETRIES - 1) {
          continue;
        }

        const sanitized = sanitizeSvg(parsed.svg);
        const finalSvg = ensureViewBox(sanitized);

        return {
          id: crypto.randomUUID(),
          svg: finalSvg,
          title: parsed.title || "Generated Icon",
          description:
            parsed.description || "Generated icon (may need refinement)",
          style: params.style,
          prompt: params.prompt,
          timestamp: Date.now(),
        };
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === "AbortError") {
          throw new Error("Generation cancelled");
        }

        if (provider.name === "openrouter" && isRateLimitError(error)) {
          continue;
        }

        if (provider.name === "replicate" && attempt === MAX_RETRIES - 1) {
          throw error;
        }

        if (provider.name === "replicate") {
          continue;
        }

        if (attempt === MAX_RETRIES - 1) {
          throw error;
        }
      }
    }
  }

  throw new Error("Failed to generate icon after multiple attempts");
}

export function cancelGeneration(): void {
  if (abortController) {
    abortController.abort();
    abortController = null;
  }
}
