import React, { Suspense } from 'react';
import Link from 'next/link';
import Button from './components/ui/button';
import RecentSection from './components/generations/RecentSection';
import { getCategories, getPopular, getNewest, getTop } from './home-actions';

async function Hero() {
  return (
    <section className="container hero">
      <div className="hero-left">
        <div className="badge">Новое поколение обучения</div>
        <h1>
          Генератор
          <br />
          Учебных Заданий
        </h1>
        <p className="muted">
          Создавайте персонализированные рабочие листы для детей. Математика,
          логика, внимание и творчество — всё в одном месте.
        </p>
        <div className="hero-cta">
          <Link href="/generator" className="ui-btn btn-gradient ui-btn--lg">
            Создать рабочий лист
          </Link>
          <Link href="#popular" className="ui-btn ui-btn--outline ui-btn--lg">
            Посмотреть примеры
          </Link>
        </div>
        <div className="hero-stats">
          <div>
            <strong>1000+</strong>
            <span>Сгенерировано</span>
          </div>
          <div>
            <strong>25+</strong>
            <span>Типов заданий</span>
          </div>
          <div>
            <strong>5★</strong>
            <span>Рейтинг</span>
          </div>
        </div>
      </div>
      <div className="hero-right" aria-hidden>
        <div className="hero-illustration" />
      </div>
    </section>
  );
}

async function Categories() {
  const categories = await getCategories();
  return (
    <section id="categories" className="container section">
      <h2>Категории заданий</h2>
      <p className="muted">Выберите подходящую тему для обучения</p>
      <div className="grid-categories">
        {categories.map((c) => (
          <Link key={c.id} href={`/#cat-${c.id}`} className="card category">
            <div className="category-icon" />
            <div className="category-title">{c.name}</div>
            <div className="category-count">{c.count} заданий</div>
            <span className="category-more">Смотреть все</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

async function Popular() {
  const items = await getPopular();
  return (
    <section id="popular" className="container section">
      <div className="section-header">
        <h2>Популярные генерации</h2>
        <Link href="/gallery" className="ui-btn ui-btn--outline ui-btn--sm">
          Смотреть все
        </Link>
      </div>
      <div className="grid-cards">
        {items.map((i) => (
          <div key={i.id} className="card gen">
            <div className="gen-thumb" />
            <div className="gen-tags">
              {i.tags.slice(0, 2).map((t) => (
                <span key={t} className="tag">
                  {t}
                </span>
              ))}
            </div>
            <div className="gen-title">{i.title}</div>
            <div className="gen-actions">
              <Link
                href={`/gallery/${i.id}`}
                className="ui-btn ui-btn--secondary ui-btn--sm"
              >
                Посмотреть
              </Link>
              <Button size="sm" variant="outline">
                Скачать
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

async function NewestAndTop() {
  const [newest, top] = await Promise.all([getNewest(), getTop()]);
  return (
    <section id="newest" className="container section two-cols">
      <div className="col-main">
        <h3>Свежие задания</h3>
        <div className="grid-cards">
          {newest.map((i) => (
            <div key={i.id} className="card gen">
              <div className="gen-thumb" />
              <div className="gen-tags">
                {i.tags.slice(0, 2).map((t) => (
                  <span key={t} className="tag">
                    {t}
                  </span>
                ))}
              </div>
              <div className="gen-title">{i.title}</div>
              <div className="gen-actions">
                <Link
                  href={`/gallery/${i.id}`}
                  className="ui-btn ui-btn--secondary ui-btn--sm"
                >
                  Посмотреть
                </Link>
                <Button size="sm" variant="outline">
                  Скачать
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="col-side">
        <div className="panel card">
          <h4>Лучшее за неделю</h4>
          <ol className="top-list">
            {top.map((t) => (
              <li key={t.rank}>
                <span className="rank">{t.rank}</span> {t.title}{' '}
                <span className="muted">· {t.views}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="cta-block card">
          <div className="cta-icon" />
          <div className="cta-content">
            <h4>Создайте свой лист</h4>
            <p className="muted">Персонализированные задания за 2 минуты</p>
            <Link href="/generator" className="ui-btn btn-gradient">
              Попробовать сейчас
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default async function Page() {
  return (
    <div>
      <Suspense fallback={<div className="container">Загрузка...</div>}>
        <Hero />
      </Suspense>
      <Suspense fallback={<div className="container">Загрузка категорий…</div>}>
        <Categories />
      </Suspense>
      <Suspense fallback={<div className="container">Загрузка последних…</div>}>
        <RecentSection />
      </Suspense>
      <Suspense
        fallback={<div className="container">Загрузка популярных…</div>}
      >
        <Popular />
      </Suspense>
      <Suspense fallback={<div className="container">Загрузка новых…</div>}>
        <NewestAndTop />
      </Suspense>
    </div>
  );
}
