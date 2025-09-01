import React from 'react';

export default function Loading() {
  return (
    <div className="container" style={{ padding: '16px 0' }}>
      <header style={{ marginBottom: 12 }}>
        <div style={{ height: 32, width: 320, borderRadius: 8, background: '#f3f4f6', border: '1px solid #e5e7eb' }} />
        <div style={{ marginTop: 6, height: 16, width: 480, borderRadius: 6, background: '#f3f4f6', border: '1px solid #e5e7eb' }} />
      </header>
      <div className="two-cols" style={{ alignItems: 'start' }}>
        <div className="panel">
          <div className="tasks-title">Загрузка типов…</div>
          <div className="tasks-grid">
            {new Array(6).fill(0).map((_, i) => (
              <div key={i} className="card" style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                …
              </div>
            ))}
          </div>
        </div>
        <div style={{ minWidth: 320, display: 'flex', flexDirection: 'column', gap: 12, position: 'sticky', top: 12 }}>
          <div className="panel">
            <div className="tasks-title">Выбрано</div>
            <div className="gen-tags" style={{ flexWrap: 'wrap' }}>
              <span className="tag">…</span>
              <span className="tag">…</span>
            </div>
          </div>
          <div className="panel">
            <div style={{ height: 24, width: 200, borderRadius: 6, background: '#f3f4f6', border: '1px solid #e5e7eb', marginBottom: 8 }} />
            <div style={{ height: 100, borderRadius: 8, background: '#f3f4f6', border: '1px solid #e5e7eb' }} />
          </div>
          <div className="panel">
            <div className="tasks-title">Результаты</div>
            <div style={{ height: 140, borderRadius: 8, background: '#f3f4f6', border: '1px solid #e5e7eb' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
