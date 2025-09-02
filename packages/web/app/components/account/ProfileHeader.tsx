"use client";
import React from "react";
import { useT } from "../../i18n/I18nProvider";
import PlanBadge from "./PlanBadge";
import type { Profile } from "../../account/types";

export default function ProfileHeader({
  profile,
  userEmail,
}: {
  profile: Profile | null;
  userEmail: string;
}) {
  const t = useT();
  const displayName = profile?.name || userEmail;
  const initial = profile?.name ? profile.name[0] : userEmail[0]?.toUpperCase();
  return (
    <div className="card" style={{ display: "flex", gap: 16, alignItems: "center" }}>
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          background: "#e5e7eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: 22,
        }}
      >
        {initial}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>{displayName}</div>
        <div className="muted">{userEmail}</div>
        {profile?.plan && (
          <div style={{ marginTop: 6 }}>
            <PlanBadge plan={profile.plan} />
          </div>
        )}
      </div>
      <div>
        {/* Контекстное поле переключения (плейсхолдер) */}
        <select className="ui-select">
          <option>{t("account.range.lastMonth")}</option>
          <option>{t("account.range.last3Months")}</option>
          <option>{t("account.range.lastYear")}</option>
        </select>
      </div>
    </div>
  );
}
