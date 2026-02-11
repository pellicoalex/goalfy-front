import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function GoalfyCardShell({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card
      className={cn(
        "group relative overflow-hidden rounded-[22px] border bg-card gap-0",
        "transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-26px_rgba(2,160,221,0.65)]",
        className,
      )}
      style={{ borderColor: "rgba(43,84,146,0.25)" }}
    >
      <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-white via-slate-50 to-slate-100 dark:from-card dark:via-card/95 dark:to-black" />
      <div className="pointer-events-none bg-secondary absolute -top-24 -left-24 h-64 w-64 rounded-full blur-3xl opacity-20" />
      <div className="pointer-events-none bg-primary absolute -bottom-28 -right-24 h-72 w-72 rounded-full blur-3xl opacity-15" />
      <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/5 via-transparent to-black/5" />
      {children}
    </Card>
  );
}
