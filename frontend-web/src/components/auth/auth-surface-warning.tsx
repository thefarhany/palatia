import Link from "next/link";
import { AlertCircle, ArrowRight } from "lucide-react";

export interface AuthSurfaceWarningProps {
  message: string;
  targetUrl: string;
  targetLabel: string;
  className?: string;
}

export function AuthSurfaceWarning({
  message,
  targetUrl,
  targetLabel,
  className = "",
}: AuthSurfaceWarningProps) {
  return (
    <div
      className={`rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200 ${className}`}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="grid gap-2 text-xs">
          <p className="font-medium leading-relaxed">{message}</p>
          <div>
            <Link
              href={targetUrl}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600"
            >
              Silakan Login ke {targetLabel}
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
