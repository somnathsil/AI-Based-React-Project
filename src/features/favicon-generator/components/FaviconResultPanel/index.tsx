import { Button } from "@/components/common/Button";
import type {
  FaviconResult,
  FaviconSizeEntry,
} from "../../types/favicon.types";
import "./styles.scss";

interface FaviconResultProps {
  result: FaviconResult | null;
  originalUrl: string | null;
  disabled?: boolean;
  /** Called with a size entry for a single-size .ico download. */
  onDownload: (entry?: FaviconSizeEntry | null) => void;
  /** Bundles every size + the .ico into one ZIP download. */
  onDownloadAll: () => void;
}

/**
 * Result section: original vs AI favicon side-by-side, every generated
 * size available for individual download, plus the multi-resolution .ico.
 */
export function FaviconResultPanel({
  result,
  originalUrl,
  disabled = false,
  onDownload,
  onDownloadAll,
}: FaviconResultProps) {
  if (!result) return null;

  return (
    <section className="fg-card fg-result">
      <h2 className="fg-card__title">3. Your favicon is ready</h2>

      <div className="fg-result__grid">
        <div className="fg-result__cell">
          <span className="fg-result__label">Original logo</span>
          <div className="fg-result__frame fg-result__frame--original">
            {originalUrl && <img src={originalUrl} alt="Original logo" />}
          </div>
        </div>

        <div className="fg-result__cell">
          <span className="fg-result__label">AI Favicon</span>
          <div className="fg-result__frame fg-result__frame--result">
            <img src={result.previewUrl} alt={`Generated favicon preview`} />
          </div>
          <div className="fg-result__badges">
            <span className="fg-result__badge">AI-generated favicon</span>
            {/* <span className="fg-result__badge">{result.size} × {result.size}</span> */}
            <span className="fg-result__badge fg-result__badge--ico">ICO</span>
          </div>
        </div>
      </div>

      {result.explanation && (
        <p className="fg-result__explanation">
          <span aria-hidden="true">✨ </span>
          {result.explanation}
        </p>
      )}

      <div className="fg-result__sizes">
        <span className="fg-result__label">Download any size</span>
        <div className="fg-result__size-grid">
          {result.sizes.map((entry) => (
            <div key={entry.size} className="fg-result__size">
              <div
                className={`fg-result__size-frame ${entry.size <= 48 ? "fg-result__size-frame--checker" : ""}`}
              >
                <img
                  src={entry.url}
                  alt={`${entry.size} by ${entry.size} favicon`}
                  style={{ width: entry.size, height: entry.size }}
                />
              </div>
              <span className="fg-result__size-name">
                {entry.size} × {entry.size}
              </span>
              <button
                type="button"
                className="fg-result__size-dl"
                onClick={() => onDownload(entry)}
                disabled={disabled}
                aria-label={`Download ${entry.size} pixel ICO`}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                ICO
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="fg-result__download">
        <div className="fg-result__download-row">
          <Button
            variant="primary"
            size="lg"
            onClick={onDownloadAll}
            disabled={disabled}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 8v13H3V8" />
              <path d="M1 3h22v5H1z" />
              <line x1="10" y1="12" x2="14" y2="12" />
            </svg>
            Download all sizes (.zip)
          </Button>
        </div>
        <span className="fg-result__filename">
          {result.sizes.length + 1} .ico files included in the ZIP
        </span>
      </div>
    </section>
  );
}
