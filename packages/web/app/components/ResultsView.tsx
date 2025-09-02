'use client';
import React from 'react';
import { absUrl } from 'lib/api';
import { GenerateResponse } from 'lib/types';

export type ResultsViewProps = {
  result: GenerateResponse | null;
};

function EyeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function DownloadIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

export default function ResultsView({ result }: ResultsViewProps) {
  if (!result) {
    return (
      <div className="results">
        <h2>Результаты</h2>
        <div className="muted">Ничего не сгенерировано</div>
      </div>
    );
  }

  const totalPages = result.days.reduce(
    (acc, d) => acc + (d.files?.length || 0),
    0,
  );
  return (
    <div className="results">
      <h2>Результаты</h2>
      <div className="muted" style={{ marginBottom: 8 }}>
        Создано {totalPages} страниц заданий
      </div>
      <div className="results-list">
        {result.days.map((d) => {
          const previewUrl = absUrl(d.indexHtml);
          const downloadUrl = absUrl((d.files && d.files[0]) || d.indexHtml);
          return (
            <div
              key={d.day}
              className="result-card"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 10,
                border: '1px solid #fde68a',
                background: '#fef9c3',
                borderRadius: 10,
                marginBottom: 8,
              }}
            >
              <div style={{ fontWeight: 600 }}>День {d.day}</div>
              <div style={{ display: 'inline-flex', gap: 8 }}>
                <a
                  className="ui-btn ui-btn--outline ui-btn--sm"
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Предпросмотр дня ${d.day}`}
                >
                  <EyeIcon />
                </a>
                <a
                  className="ui-btn ui-btn--outline ui-btn--sm"
                  href={downloadUrl}
                  download
                  aria-label={`Скачать день ${d.day}`}
                >
                  <DownloadIcon />
                </a>
              </div>
            </div>
          );
        })}
      </div>
      <div className="row" style={{ justifyContent: 'flex-start' }}>
        <a
          className="ui-btn ui-btn--secondary"
          href={absUrl(result.days[0]?.indexHtml || result.outDir)}
          target="_blank"
          rel="noreferrer"
        >
          Предпросмотр всех страниц
        </a>
        <a
          className="ui-btn btn-gradient"
          href={absUrl(`${result.outDir}/download`)}
          download
        >
          Скачать PDF
        </a>
      </div>
    </div>
  );
}
