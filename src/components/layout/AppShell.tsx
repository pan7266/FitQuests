import type { PropsWithChildren } from "react";
import type { AppTab } from "../../stores/appStore";
import { APP_ICON_SRC, APP_NAME } from "../../utils/appIdentity";
import { BottomNav } from "./BottomNav";

interface AppShellProps extends PropsWithChildren {
  activeTab: AppTab;
  title: string;
  onTabChange: (tab: AppTab) => void;
}

export function AppShell({ activeTab, title, onTabChange, children }: AppShellProps) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[96rem] flex-col px-4 pb-[calc(var(--safe-bottom)+6.5rem)] pt-[calc(var(--safe-top)+1rem)] sm:px-6 md:px-8 lg:px-10 xl:px-12">
      <header className="mb-5 flex items-center justify-between lg:mb-7">
        <div>
          <p className="text-app-muted text-xs font-bold uppercase tracking-[0.18em]">{APP_NAME}</p>
          <h1 className="text-app text-2xl font-black capitalize tracking-normal lg:text-4xl">
            {title}
          </h1>
        </div>
        <img
          alt={`${APP_NAME} app icon`}
          className="h-12 w-12 rounded-3xl border border-[var(--border-soft)] object-cover shadow-[var(--accent-glow)]"
          height={48}
          src={APP_ICON_SRC}
          width={48}
        />
      </header>
      <main className="flex-1">{children}</main>
      <BottomNav activeTab={activeTab} onChange={onTabChange} />
    </div>
  );
}
