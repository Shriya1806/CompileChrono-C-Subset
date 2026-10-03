import type { ButtonHTMLAttributes, PropsWithChildren, ReactNode, SelectHTMLAttributes } from "react";
import { AnimatePresence, motion } from "framer-motion";

export type BrutalTone = "yellow" | "blue" | "red" | "white";

export function toneClass(tone: BrutalTone = "white") {
  if (tone === "yellow") return "bg-[#FEF08A]";
  if (tone === "blue") return "bg-[#BAE6FD]";
  if (tone === "red") return "bg-[#FCA5A5]";
  return "bg-white";
}

export function BrutalPanel({
  title,
  icon,
  action,
  children,
  className = ""
}: PropsWithChildren<{ title?: string; icon?: ReactNode; action?: ReactNode; className?: string }>) {
  return (
    <section className={`brutal-panel min-h-0 flex flex-col ${className}`}>
      {(title || action) && (
        <header className="brutal-panel-header shrink-0">
          <div className="flex min-w-0 items-center gap-2">
            {icon}
            {title && <h2 className="truncate text-xs font-black uppercase tracking-wider text-black">{title}</h2>}
          </div>
          {action}
        </header>
      )}
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  );
}

export function BrutalButton({
  tone = "white",
  className = "",
  children,
  onClick,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: BrutalTone }) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      whileHover={{ y: -1, x: -1 }}
      onClick={onClick}
      {...(props as any)}
      className={`brutal-button ${toneClass(tone)} ${className}`}
    >
      {children}
    </motion.button>
  );
}

export function BrutalSelect({ className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`brutal-input ${className}`} />;
}

export function BrutalBadge({
  tone = "white",
  children,
  className = ""
}: PropsWithChildren<{ tone?: BrutalTone; className?: string }>) {
  return <span className={`brutal-badge ${toneClass(tone)} ${className}`}>{children}</span>;
}

export function BrutalTabs<T extends string>({
  tabs,
  active,
  onChange
}: {
  tabs: readonly T[];
  active: T;
  onChange: (tab: T) => void;
}) {
  return (
    <div className="brutal-tabs">
      {tabs.map((tab, index) => {
        const isActive = active === tab;
        const activeTone = index % 3 === 0 ? "yellow" : index % 3 === 1 ? "blue" : "red";
        return (
          <motion.button
            key={tab}
            whileTap={{ scale: 0.96 }}
            onClick={() => onChange(tab)}
            className={`brutal-tab ${isActive ? toneClass(activeTone) : "bg-white"}`}
          >
            {tab}
          </motion.button>
        );
      })}
    </div>
  );
}

export function BrutalTabPanel({ id, children }: PropsWithChildren<{ id: string }>) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={id}
        className="h-full min-h-0"
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.12 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export function SectionHeader({ title, icon, action }: { title: string; icon?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3 border-b-2 border-black pb-2">
      <div className="flex items-center gap-2 text-xs font-black uppercase text-black">
        {icon}
        {title}
      </div>
      {action}
    </div>
  );
}

