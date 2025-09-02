"use client";
import React from "react";
import { useT } from "../../i18n/I18nProvider";
import { absUrl } from "../../lib/api";

export type GenItem = {
  id: string;
  tags: string[];
  previewUrl: string;
  downloadUrl: string;
};

function useLocTask() {
  const t = useT();
  return React.useCallback(
    (slug: string): string => {
      const key = `task.${slug}.title` as any;
      const val = t(key);
      if (val && typeof val === "string" && !String(val).startsWith("task.")) {
        return val as string;
      }
      return slug;
    },
    [t],
  );
}

export default function GenCard({ item }: { item: GenItem }) {
  const t = useT();
  const locTask = useLocTask();
  const title = (t("generation.title", {
    tasks: item.tags.map(locTask).join(", "),
  }) as string) || item.tags.map(locTask).join(", ");

  return (
    <div className="card gen">
      <div className="gen-thumb" />
      <div className="gen-tags">
        {item.tags.slice(0, 4).map((tg) => (
          <span key={tg} className="tag">
            {locTask(tg)}
          </span>
        ))}
      </div>
      <div className="gen-title">{title}</div>
      <div className="gen-actions">
        <a
          href={absUrl(item.previewUrl)}
          target="_blank"
          rel="noreferrer"
          className="ui-btn ui-btn--secondary ui-btn--sm"
        >
          {t("buttons.preview")}
        </a>
        <a href={absUrl(item.downloadUrl)} className="ui-btn ui-btn--outline ui-btn--sm">
          {t("buttons.downloadPdf")}
        </a>
      </div>
    </div>
  );
}
