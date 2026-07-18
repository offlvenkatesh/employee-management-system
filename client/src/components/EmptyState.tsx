import { SearchX } from "lucide-react";

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="panel grid place-items-center px-6 py-14 text-center">
      <div className="grid size-14 place-items-center rounded-3xl bg-stone-100 text-stone-500 dark:bg-white/10 dark:text-stone-300">
        <SearchX />
      </div>
      <h3 className="mt-4 text-lg font-black tracking-tight">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-stone-500 dark:text-stone-400">{description}</p>
    </div>
  );
}
