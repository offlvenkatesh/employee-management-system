import { AlertTriangle } from "lucide-react";
import { getErrorMessage } from "../lib/api";

export function ErrorBanner({ error }: { error: unknown }) {
  return (
    <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-red-800 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-200">
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5" size={18} />
        <p className="text-sm font-semibold">{getErrorMessage(error)}</p>
      </div>
    </div>
  );
}
