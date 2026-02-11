import { CardContent } from "@/components/ui/card";
import GoalfyCardShell from "./GoalfyCardShell";

export default function KpiCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <GoalfyCardShell className="rounded-2xl">
      <div className="relative px-5 pt-4">
        <div className="h-1.5 w-full rounded-full gradient-primary" />
      </div>

      <CardContent className="relative p-5 pt-4 flex items-center gap-4">
        <div className="h-11 w-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-extrabold tracking-tight text-foreground">
            {value}
          </p>
          {hint ? (
            <p className="mt-1 text-xs text-foreground/70 truncate">{hint}</p>
          ) : null}
        </div>
      </CardContent>
    </GoalfyCardShell>
  );
}
