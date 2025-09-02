'use server';

// Server Actions that emulate data fetching for the landing page.
// In real setup these can call your DB or REST API. We keep them cached.
import { cache } from 'react';

export type Category = {
  id: string;
  name: string;
  count: number;
  icon?: string;
};
export type GenCard = {
  id: string;
  title: string;
  tags: string[];
  views: number;
  likes: number;
};

// Cache functions during a single server instance lifetime
export const getCategories = cache(async (): Promise<Category[]> => {
  return [
    { id: 'math', name: 'Математика', count: 45 },
    { id: 'logic', name: 'Логика', count: 32 },
    { id: 'attention', name: 'Внимание', count: 28 },
    { id: 'creativity', name: 'Творчество', count: 19 },
  ];
});

export const getPopular = cache(async (): Promise<GenCard[]> => {
  return [
    {
      id: 'p1',
      title: 'Изучаем время на часах',
      tags: ['математика', 'логика'],
      views: 156,
      likes: 52,
    },
    {
      id: 'p2',
      title: 'Лабиринты для развития логики',
      tags: ['логика'],
      views: 89,
      likes: 34,
    },
    {
      id: 'p3',
      title: 'Сложение в пределах 100',
      tags: ['математика'],
      views: 203,
      likes: 112,
    },
    {
      id: 'p4',
      title: 'Творческие задания',
      tags: ['творчество'],
      views: 74,
      likes: 28,
    },
  ];
});

export const getNewest = cache(async (): Promise<GenCard[]> => {
  return [
    {
      id: 'n1',
      title: 'Найди отличия',
      tags: ['внимание'],
      views: 62,
      likes: 22,
    },
    {
      id: 'n2',
      title: 'Лабиринт «Космос»',
      tags: ['логика'],
      views: 47,
      likes: 18,
    },
    { id: 'n3', title: 'Пишем буквы', tags: ['письмо'], views: 83, likes: 31 },
    {
      id: 'n4',
      title: 'Сложение и вычитание',
      tags: ['математика'],
      views: 98,
      likes: 40,
    },
  ];
});

export const getTop = cache(
  async (): Promise<Array<{ rank: number; title: string; views: number }>> => {
    return [
      { rank: 1, title: 'Задачи на время', views: 312 },
      { rank: 2, title: 'Числовые последовательности', views: 287 },
      { rank: 3, title: 'Геометрические фигуры', views: 254 },
      { rank: 4, title: 'Логические цепочки', views: 195 },
    ];
  },
);
