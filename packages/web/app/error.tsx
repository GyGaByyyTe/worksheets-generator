"use client";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container">
      <h2>Ошибка загрузки страницы</h2>
      <p>{error?.message || "Произошла ошибка."}</p>
      <div className="row">
        <button onClick={() => reset()}>Повторить</button>
      </div>
    </div>
  );
}
