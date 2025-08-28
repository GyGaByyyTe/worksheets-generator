'use client';
import React from 'react';
import { absUrl } from '../lib/api';
import { GenerateResponse } from '../lib/types';

export type ResultsViewProps = {
  result: GenerateResponse | null;
};

export default function ResultsView({ result }: ResultsViewProps) {
  if (!result) return null;
  return (
    <div className="results">
      <h2>Результаты</h2>
      <div className="outdir">
        Папка:{' '}
        <a href={absUrl(result.outDir)} target="_blank" rel="noreferrer">
          {absUrl(result.outDir)}
        </a>
      </div>
      {result.days.map((d) => (
        <div key={d.day} className="day">
          <h3>
            День {d.day} —{' '}
            <a href={absUrl(d.indexHtml)} target="_blank" rel="noreferrer">
              просмотр страниц
            </a>
          </h3>
          <div className="images">
            {d.files.map((f, i) => (
              <a key={i} href={absUrl(f)} target="_blank" rel="noreferrer">
                <img src={absUrl(f)} alt={`page ${i + 1}`} />
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
