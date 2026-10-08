import React, { useState } from 'react';
import type { RoutePreviewDto } from '../../types/route';
import { buildGoogleMapsDirectionsUrl, copyToClipboard } from '../../utils/googleMaps';

interface RouteExportBarProps {
  preview?: RoutePreviewDto;
}

export const RouteExportBar: React.FC<RouteExportBarProps> = ({ preview }) => {
  const [copied, setCopied] = useState(false);
  const googleMapsUrl = buildGoogleMapsDirectionsUrl(preview);

  if (!googleMapsUrl) {
    return null;
  }

  const handleCopy = async () => {
    const success = await copyToClipboard(googleMapsUrl);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="route-export-card" aria-label="Експорт та навігація маршруту">
      <div className="route-export-info">
        <div className="route-export-badge" aria-hidden="true">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="3 11 22 2 13 21 11 13 3 11" />
          </svg>
        </div>
        <div className="route-export-text">
          <h4 className="route-export-title">Готові вирушати у подорож?</h4>
          <p className="route-export-desc">
            Відкрийте оптимізований маршрут у Google Maps для живої покрокової GPS-навігації або надішліть посилання супутникам.
          </p>
        </div>
      </div>

      <div className="route-export-actions">
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-google-maps"
          title="Відкрити маршрут у додатку або на сайті Google Maps"
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
            <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span>Відкрити в Google Maps</span>
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="ext-icon"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>

        <button
          type="button"
          className={`btn btn-copy-maps ${copied ? 'copied' : ''}`}
          onClick={handleCopy}
          title="Скопіювати посилання для навігації"
        >
          {copied ? (
            <>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Скопійовано! ✓</span>
            </>
          ) : (
            <>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              <span>Скопіювати посилання</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
