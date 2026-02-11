import { backendAssetUrl } from "@/lib/media";

export function LogoCircle({
  logoUrl,
  name,
}: {
  logoUrl: string | null;
  name: string;
}) {
  const src = logoUrl ? backendAssetUrl(logoUrl) : null;
  return (
    <div className="h-9 w-9 rounded-xl border bg-card/60 overflow-hidden flex items-center justify-center">
      {src ? (
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span className="text-[10px] font-bold text-muted-foreground">
          {name.slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  );
}

export function AvatarCircle({
  avatarUrl,
  label,
}: {
  avatarUrl?: string | null;
  label: string;
}) {
  const src = avatarUrl ? backendAssetUrl(avatarUrl) : null;
  return (
    <div className="h-9 w-9 rounded-full border bg-card/70 overflow-hidden flex items-center justify-center">
      {src ? (
        <img src={src} alt={label} className="h-full w-full object-cover" />
      ) : (
        <span className="text-[10px] font-bold text-muted-foreground">
          {label.slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  );
}

export function Equalizer() {
  return (
    <div className="flex items-end gap-1">
      {[8, 14, 10, 18, 12].map((h, i) => (
        <span
          key={i}
          className="w-1.5 rounded-full bg-primary/70"
          style={{
            height: `${h}px`,
            animation: `eq ${900 + i * 110}ms ease-in-out ${i * 60}ms infinite alternate`,
          }}
        />
      ))}
      <style>{`
        @keyframes eq {
          0% { transform: scaleY(0.45); opacity: .55; }
          100% { transform: scaleY(1.0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
