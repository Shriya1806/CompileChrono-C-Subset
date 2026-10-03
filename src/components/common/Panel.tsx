import type { PropsWithChildren, ReactNode } from "react";

interface PanelProps extends PropsWithChildren {
  title?: string;
  action?: ReactNode;
  className?: string;
}

export function Panel({ title, action, className = "", children }: PanelProps) {
  return (
    <section className={`brutal-panel min-h-0 ${className}`}>
      {(title || action) && (
        <header className="brutal-panel-header">
          {title && <h2 className="text-sm font-black uppercase text-[#111111]">{title}</h2>}
          {action}
        </header>
      )}
      <div className="min-h-0">{children}</div>
    </section>
  );
}
