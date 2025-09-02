"use client";
import React from "react";
import type { Plan } from "../../account/types";

export default function PlanBadge({ plan }: { plan: Plan }) {
  return (
    <span
      className="tag"
      style={{
        background: "#dcfce7",
        borderColor: "#bbf7d0",
        color: "#166534",
      }}
    >
      {plan.title}
    </span>
  );
}
