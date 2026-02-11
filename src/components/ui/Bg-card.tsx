import { Card, CardContent } from "./card";

function BgCard(props: {
  title: string;
  subtitle: string;
  description: string;
  image: string;
  icon: React.ReactNode;
  action?: React.ReactNode;

  bgFit?: "cover" | "contain";
  bgPos?: string;
}) {
  const bgFit = props.bgFit ?? "cover";
  const bgPos = props.bgPos ?? "center";

  return (
    <Card
      className={[
        "group relative overflow-hidden rounded-[22px] border bg-card transition",
        "h-full flex flex-col",
        "min-h-[280px] sm:min-h-[320px] lg:min-h-[340px]",
      ].join(" ")}
      style={{ borderColor: "rgba(43,84,146,0.25)" }}
    >
      {/* backgruond image (FULL CARD) */}
      <div
        className="absolute inset-0 transition-transform duration-500"
        style={{
          backgroundImage: `url(${props.image})`,
          backgroundSize: bgFit,
          backgroundPosition: bgPos,
          backgroundRepeat: "no-repeat",
        }}
      />

      <div
        className="absolute inset-0 bg-linear-to-r from-background/75 via-background/75 to-background/60"
        // style={{
        //   background:
        //     "linear-gradient(90deg, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.75) 50%, rgba(255,255,255,0.60) 100%)",
        // }}
      />

      {/* extra layer per aumentare contrasto testo */}
      <div
        className="absolute inset-0 bg-linear-to-b from-background/20 via-background/50 to-background/60"
        // style={{
        //   background:
        //     "linear-gradient(180deg, rgba(255,255,255,0.20) 0%, rgba(255,255,255,0.52) 65%, rgba(255,255,255,0.66) 100%)",
        // }}
      />

      {/* glow */}
      <div
        className="pointer-events-none absolute -inset-10 blur-3xl opacity-80"
        style={{
          background:
            "radial-gradient(circle_at_15%_10%, rgba(2,160,221,0.22), transparent 60%)," +
            "radial-gradient(circle_at_85%_25%, rgba(43,84,146,0.16), transparent 60%)",
        }}
      />

      {/* CONTENUTO CENTRATO IN VERTICALE  */}
      <CardContent className="relative flex-1 p-6 sm:p-7 lg:p-8">
        <div className="flex h-full flex-col justify-center">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border"
                style={{
                  borderColor: "rgba(2,160,221,0.25)",
                  background: "rgba(2,160,221,0.10)",
                }}
              >
                {props.icon}
              </span>

              <div className="min-w-0">
                <p className="font-extrabold leading-tight text-lg sm:text-xl text-primary dark:text-white">
                  {props.title}
                </p>

                <p className="text-sm font-medium text-foreground/60">
                  {props.subtitle}
                </p>
              </div>
            </div>

            {/* description */}
            <p className="text-sm sm:text-base text-foreground/80 max-w-[52ch]">
              {props.description}
            </p>

            {/* CTA (se presente) */}
            {props.action ? <div className="pt-1">{props.action}</div> : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default BgCard;
