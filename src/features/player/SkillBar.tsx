import { CircleDot } from "lucide-react";

function SkillBar(props: {
  label: string;
  value: number; // 0..100
  animate?: boolean;
}) {
  const pct = Math.max(0, Math.min(100, props.value));

  return (
    <div
      className="rounded-2xl border px-4 py-3 bg-white"
      style={{
        borderColor: "rgba(43,84,146,0.20)",
        background:
          "linear-gradient(180deg, rgba(2,160,221,0.06), rgba(43,84,146,0.03))",
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border"
            style={{
              borderColor: "rgba(2,160,221,0.25)",
              background: "rgba(2,160,221,0.10)",
            }}
          >
            <CircleDot className="h-4 w-4" style={{ color: "#02A0DD" }} />
          </span>

          <span className="text-xs uppercase tracking-widest text-muted-foreground">
            {props.label}
          </span>
        </div>

        <span
          className="text-sm font-extrabold tabular-nums"
          style={{ color: "#2B5492" }}
        >
          {pct}
        </span>
      </div>

      {/* bar */}
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full"
          style={{
            width: props.animate ? `${pct}%` : "0%",
            background: "linear-gradient(90deg, #02A0DD, #2B5492)",
            transition: "width 900ms cubic-bezier(.2,.8,.2,1)",
          }}
        />
      </div>
    </div>
  );
}

export default SkillBar;
