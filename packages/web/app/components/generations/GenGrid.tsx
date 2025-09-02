"use client";
import React from "react";
import GenCard, { GenItem } from "./GenCard";

export default function GenGrid({ items }: { items: GenItem[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="grid-cards">
      {items.map((i) => (
        <GenCard key={i.id} item={i} />
      ))}
    </div>
  );
}
