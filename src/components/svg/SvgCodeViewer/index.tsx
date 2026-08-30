import { useState } from "react";
import "./styles.scss";

interface SvgCodeViewerProps {
  svg: string;
}

export function SvgCodeViewer({ svg }: SvgCodeViewerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formattedSvg = formatSvg(svg);
  const displaySvg = isExpanded ? formattedSvg : formattedSvg.slice(0, 500);

  return (
    <div className="svg-code-viewer">
      <div className="svg-code-viewer__header">
        <span className="svg-code-viewer__label">SVG Code</span>
        {/* <button
          className="svg-code-viewer__toggle"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </button> */}
      </div>
      <pre className="svg-code-viewer__code">
        <code>
          {displaySvg}
          {!isExpanded && formattedSvg.length > 500 ? "\n..." : ""}
        </code>
      </pre>
    </div>
  );
}

function formatSvg(svg: string): string {
  try {
    let formatted = svg.replace(/>\s*</g, ">\n<").replace(/\n\s*\n/g, "\n");

    const lines = formatted.split("\n");
    let indent = 0;
    const indentStr = "  ";

    const formattedLines = lines.map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return "";

      if (trimmed.startsWith("</")) {
        indent = Math.max(0, indent - 1);
      }

      const result = indentStr.repeat(indent) + trimmed;

      if (
        trimmed.startsWith("<") &&
        !trimmed.startsWith("</") &&
        !trimmed.endsWith("/>") &&
        !trimmed.includes("</")
      ) {
        indent++;
      }

      return result;
    });

    return formattedLines.filter(Boolean).join("\n");
  } catch {
    return svg;
  }
}
