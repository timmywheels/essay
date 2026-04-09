"use client";

import { AppMenu, AppMenuItem } from "@/components/app-menu";

export function ProfileMenu() {
  return (
    <AppMenu>
      <AppMenuItem href="/dashboard/settings">settings</AppMenuItem>
    </AppMenu>
  );
}
