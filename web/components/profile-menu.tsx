"use client";

import { AppMenu, AppMenuItem } from "@/components/app-menu";

interface Props {
  initialProfilePublic: boolean;
}

export function ProfileMenu({ initialProfilePublic: _ }: Props) {
  return (
    <AppMenu>
      <AppMenuItem href="/dashboard/settings">settings</AppMenuItem>
    </AppMenu>
  );
}
