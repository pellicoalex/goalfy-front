function BigStat(props: { label: string; value: string | number }) {
  return (
    <div
      className="rounded-2xl border px-4 py-3 text-center"
      style={{
        borderColor: "rgba(43,84,146,0.20)",
        background:
          "linear-gradient(180deg, rgba(2,160,221,0.08), rgba(43,84,146,0.03))",
      }}
    >
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
        {props.label}
      </p>
      <p className="mt-1 text-3xl font-extrabold tabular-nums text-primary">
        {props.value}
      </p>
    </div>
  );
}

export default BigStat;
