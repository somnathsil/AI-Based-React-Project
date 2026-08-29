import type { GenerateIconParams, GeneratedIcon } from "@/types";
import { validateSvg, sanitizeSvg, ensureViewBox } from "@/utils/svgSanitizer";

const MAX_RETRIES = 3;

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
  // Try to extract JSON from the response
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

  // Try to find SVG directly
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

let abortController: AbortController | null = null;

export async function generateSvgIcon(
  params: GenerateIconParams,
  apiKey?: string,
): Promise<GeneratedIcon> {
  if (!apiKey) {
    throw new Error(
      "API key is required. Please configure your OpenRouter API key in Settings.",
    );
  }

  const userPrompt = buildUserPrompt(params);

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    abortController = new AbortController();

    try {
      const model =
        import.meta.env.VITE_OPENROUTER_API_MODEL || "openai/gpt-4o-mini";
      const response = await fetch("/api/openrouter/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": window.location.origin,
          "X-Title": "PixelCoders - AI SVG Icon Generator",
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
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
        if (response.status === 429) {
          throw new Error(
            "Rate limit exceeded. Please wait a moment and try again.",
          );
        }
        throw new Error(msg);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error("Empty response from AI model");
      }

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

      // SVG is invalid, retry
      if (attempt < MAX_RETRIES - 1) {
        continue;
      }

      // Last attempt but still invalid - return what we have after sanitization
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
      if (attempt === MAX_RETRIES - 1) {
        throw error;
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
