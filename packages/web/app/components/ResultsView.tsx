'use client';
import React from 'react';
import { absUrl } from '../lib/api';
import { GenerateResponse } from '../lib/types';
import Image from 'next/image';

export type ResultsViewProps = {
  result: GenerateResponse | null;
};

export default function ResultsView({ result }: ResultsViewProps) {
  return (
    <div className="results">
      <h2>Результаты</h2>
      {!result ? (
        <div className="muted">Ничего не сгенерировано</div>
      ) : (
        <>
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
                    <Image src={absUrl(f)} alt={`page ${i + 1}`} width={1200} height={1600} sizes="100vw" style={{ width: '100%', height: 'auto' }} unoptimized />
                  </a>
                ))}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
