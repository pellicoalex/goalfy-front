import { memo, useEffect, useState } from "react";
import type { NodeProps } from "@xyflow/react";
import { Handle, Position } from "@xyflow/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { backendAssetUrl } from "@/lib/media";
import { Trophy, ShieldCheck, Clock, Plus, X } from "lucide-react";

export type BracketNodeData = {
  roundLabel: string;
  roundShort: "Q" | "S" | "F";
  matchNumber: number;

  matchId?: number;
  status?: string;
  scoreA?: number | null;
  scoreB?: number | null;
  winnerName?: string | null;
  onOpenResult?: (matchId: number) => void;

  teamA?: string | null;
  teamB?: string | null;
  teamALogoUrl?: string | null;
  teamBLogoUrl?: string | null;

  side?: "left" | "right" | "center";

  builderMode?: boolean;
  slotAId?: number;
  slotBId?: number;
  onDropTeam?: (match: {
    id: number;
    teamId: number;
    teamName: string;
  }) => void;
  onClearSlot?: (id: number) => void;
};

type Props = NodeProps & { data: BracketNodeData };

function useIsMobile(breakpointPx = 640) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpointPx - 1}px)`);
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, [breakpointPx]);

  return isMobile;
}

function initials(name?: string | null) {
  if (!name) return "—";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("");
}

function statusLabel(status?: string | null) {
  if (status === "played") return "Disputata";
  if (status === "scheduled") return "In programma";
  if (status === "waiting") return "In attesa";
  return status ?? "—";
}

const BracketNode = memo((props: Props) => {
  const { data } = props;
  const isMobile = useIsMobile(640);

  const hasBothTeams = !!data.teamA && !!data.teamB;

  const isPlayed = data.status === "played";

  // giocabile = posso inserire/modificare SOLO se non played (status torneo)
  const playable = !data.builderMode && hasBothTeams && !isPlayed;

  // - se played => "Vedi risultato" (locked)
  // - se non played => "Inserisci risultato"
  const showResultBtn = !data.builderMode && hasBothTeams;

  const isLeftSide = data.side === "left";
  const isRightSide = data.side === "right";
  const isCenter = data.side === "center";

  const flowSidePosition = isLeftSide
    ? Position.Right
    : isRightSide
      ? Position.Left
      : Position.Right;

  const showTargetHandles = data.roundShort !== "Q";
  const showSourceHandle = data.roundShort !== "F";

  const topA = "42%";
  const topB = "64%";
  const topOut = "53%";

  const teamAWins =
    isPlayed &&
    typeof data.scoreA === "number" &&
    typeof data.scoreB === "number" &&
    data.scoreA > data.scoreB;

  const teamBWins =
    isPlayed &&
    typeof data.scoreA === "number" &&
    typeof data.scoreB === "number" &&
    data.scoreB > data.scoreA;

  // mobile sizing
  const cardW = isMobile ? "w-[240px]" : "w-[300px] xl:w-[320px]";
  const headerPad = isMobile ? "pb-2 px-3 pt-3" : "pb-3";
  const contentPad = isMobile ? "px-3 pb-3 pt-0" : "";
  const teamRowPad = isMobile ? "p-2" : "p-2";
  const avatarSize = isMobile ? "h-8 w-8" : "h-9 w-9";
  const teamNameClass = isMobile
    ? "text-[13px] font-semibold"
    : "text-sm font-medium";
  const scoreClass = isMobile
    ? "text-sm font-extrabold"
    : "text-sm font-semibold";
  const badgeClass = isMobile ? "text-[10px] px-2 py-0.5" : "";
  const buttonClass = isMobile ? "h-9 text-[12px] rounded-xl" : "";

  const handleSize = isMobile ? 12 : 10;

  return (
    <div className="relative">
      {/* (slot A/B) */}
      {showTargetHandles && (
        <>
          <Handle
            type="target"
            id="in-A"
            position={isCenter ? Position.Left : flowSidePosition}
            style={{
              top: topA,
              width: handleSize,
              height: handleSize,
              borderRadius: 999,
              background: "rgba(2,160,221,0.85)",
              border: "2px solid rgba(255,255,255,0.85)",
            }}
          />
          <Handle
            type="target"
            id="in-B"
            position={isCenter ? Position.Right : flowSidePosition}
            style={{
              top: topB,
              width: handleSize,
              height: handleSize,
              borderRadius: 999,
              background: "rgba(2,160,221,0.85)",
              border: "2px solid rgba(255,255,255,0.85)",
            }}
          />
        </>
      )}

      {/* SOURCE (uscita vincitore) */}
      {showSourceHandle && (
        <Handle
          type="source"
          id="out"
          position={flowSidePosition}
          style={{
            top: topOut,
            width: handleSize,
            height: handleSize,
            borderRadius: 999,
            background: "rgba(43,84,146,0.9)",
            border: "2px solid rgba(255,255,255,0.85)",
          }}
        />
      )}

      <Card className={cn(cardW, "border bg-background shadow-sm")}>
        <CardHeader className={cn("space-y-2", headerPad)}>
          <div className="flex items-center justify-between gap-2">
            <CardTitle
              className={cn(
                isMobile ? "text-[12px]" : "text-sm",
                "font-semibold",
              )}
            >
              {data.roundLabel} • Match {data.matchNumber}
            </CardTitle>

            {!data.builderMode ? (
              <Badge
                className={cn(
                  "gap-1",
                  badgeClass,
                  isPlayed
                    ? "bg-emerald-600/15 text-emerald-700 border-emerald-600/20"
                    : "bg-sky-500/15 text-sky-700 border-sky-500/20",
                )}
                variant="outline"
              >
                {isPlayed ? (
                  <>
                    <ShieldCheck
                      className={cn(isMobile ? "h-3 w-3" : "h-3.5 w-3.5")}
                    />{" "}
                    Disputata
                  </>
                ) : (
                  <>
                    <Clock
                      className={cn(isMobile ? "h-3 w-3" : "h-3.5 w-3.5")}
                    />{" "}
                    {statusLabel(data.status)}
                  </>
                )}
              </Badge>
            ) : (
              <Badge variant="outline" className={cn("gap-1", badgeClass)}>
                <Trophy className={cn(isMobile ? "h-3 w-3" : "h-3.5 w-3.5")} />{" "}
                Builder
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className={cn("space-y-2.5", contentPad)}>
          {/* TEAM A */}
          <div
            className={cn(
              "flex items-center justify-between gap-2 rounded-lg border transition-colors",
              teamRowPad,
              teamAWins &&
                "border-emerald-500 bg-emerald-500/5 shadow-[0_0_0_1px_rgba(16,185,129,0.4)]",
            )}
            onDrop={(e) => {
              e.preventDefault();
              const dragData = JSON.parse(
                e.dataTransfer.getData("application/goalfy-team"),
              );
              if (dragData.teamId && data.onDropTeam) {
                data.onDropTeam({
                  id: data.matchId!,
                  teamId: dragData.teamId,
                  teamName: "teamAId",
                });
              }
            }}
            onDragOver={(e) => e.preventDefault()}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Avatar className={cn(avatarSize)}>
                <AvatarImage
                  src={
                    data.teamALogoUrl ? backendAssetUrl(data.teamALogoUrl) : ""
                  }
                  alt={data.teamA ?? ""}
                />
                <AvatarFallback>{initials(data.teamA)}</AvatarFallback>
              </Avatar>

              <div className="leading-tight min-w-0">
                <p className={cn(teamNameClass, "truncate max-w-[140px]")}>
                  {data.teamA ?? "—"}
                </p>
                {!data.builderMode && !isMobile ? (
                  <p className="text-xs text-muted-foreground">Slot A</p>
                ) : null}
              </div>
            </div>

            {data.builderMode && data.slotAId ? (
              <div className="flex items-center gap-1">
                {data.teamA ? (
                  <Button
                    size="icon"
                    variant="ghost"
                    className={cn(isMobile ? "h-8 w-8" : "h-8 w-8")}
                    onClick={() => data.onClearSlot?.(data.slotAId!)}
                    title="Svuota slot"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                ) : (
                  <Badge
                    variant="outline"
                    className={cn("text-xs", isMobile && "text-[10px]")}
                  >
                    <Plus
                      className={cn(
                        isMobile ? "h-3 w-3" : "h-3.5 w-3.5",
                        "mr-1",
                      )}
                    />
                    Drop
                  </Badge>
                )}
              </div>
            ) : null}

            {!data.builderMode ? (
              <div className={cn(scoreClass, "tabular-nums shrink-0")}>
                {data.scoreA ?? "—"}
              </div>
            ) : null}
          </div>

          {/* TEAM B */}
          <div
            className={cn(
              "flex items-center justify-between gap-2 rounded-lg border transition-colors",
              teamRowPad,
              teamBWins &&
                "border-emerald-500 bg-emerald-500/5 shadow-[0_0_0_1px_rgba(16,185,129,0.4)]",
            )}
            onDrop={(e) => {
              e.preventDefault();
              const dragData = JSON.parse(
                e.dataTransfer.getData("application/goalfy-team"),
              );
              if (data.slotBId && dragData.teamId && data.onDropTeam) {
                data.onDropTeam({
                  id: data.matchId!,
                  teamId: dragData.teamId,
                  teamName: "teamBId",
                });
              }
            }}
            onDragOver={(e) => e.preventDefault()}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Avatar className={cn(avatarSize)}>
                <AvatarImage
                  src={
                    data.teamBLogoUrl ? backendAssetUrl(data.teamBLogoUrl) : ""
                  }
                  alt={data.teamB ?? ""}
                />
                <AvatarFallback>{initials(data.teamB)}</AvatarFallback>
              </Avatar>

              <div className="leading-tight min-w-0">
                <p className={cn(teamNameClass, "truncate max-w-[140px]")}>
                  {data.teamB ?? "—"}
                </p>
                {!data.builderMode && !isMobile ? (
                  <p className="text-xs text-muted-foreground">Slot B</p>
                ) : null}
              </div>
            </div>

            {data.builderMode && data.slotBId ? (
              <div className="flex items-center gap-1">
                {data.teamB ? (
                  <Button
                    size="icon"
                    variant="ghost"
                    className={cn(isMobile ? "h-8 w-8" : "h-8 w-8")}
                    onClick={() => data.onClearSlot?.(data.slotBId!)}
                    title="Svuota slot"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                ) : (
                  <Badge
                    variant="outline"
                    className={cn("text-xs", isMobile && "text-[10px]")}
                  >
                    <Plus
                      className={cn(
                        isMobile ? "h-3 w-3" : "h-3.5 w-3.5",
                        "mr-1",
                      )}
                    />
                    Drop
                  </Badge>
                )}
              </div>
            ) : null}

            {!data.builderMode ? (
              <div className={cn(scoreClass, "tabular-nums shrink-0")}>
                {data.scoreB ?? "—"}
              </div>
            ) : null}
          </div>

          {/* CTA / Winner */}
          {!data.builderMode ? (
            <>
              {showResultBtn ? (
                <Button
                  size="sm"
                  className={cn("w-full", buttonClass)}
                  disabled={!hasBothTeams}
                  onClick={() => data.onOpenResult?.(data.matchId!)}
                  variant={isPlayed ? "secondary" : "default"}
                  style={{
                    background: !isPlayed
                      ? `linear-gradient(90deg, secondary, primary)`
                      : undefined,
                  }}
                >
                  {isPlayed ? "Vedi risultato" : "Inserisci risultato"}
                </Button>
              ) : null}

              {!hasBothTeams ? (
                <p
                  className={cn(
                    isMobile ? "text-[11px]" : "text-xs",
                    "text-muted-foreground",
                  )}
                >
                  In attesa di avversario
                </p>
              ) : isPlayed && data.winnerName ? (
                <p
                  className={cn(
                    isMobile ? "text-[11px]" : "text-xs",
                    "text-muted-foreground",
                  )}
                >
                  Vincitore:{" "}
                  <span className="font-semibold text-primary">
                    {data.winnerName}
                  </span>
                </p>
              ) : null}
            </>
          ) : (
            <p
              className={cn(
                isMobile ? "text-[11px]" : "text-xs",
                "text-muted-foreground",
              )}
            >
              Trascina le squadre dal pannello builder oppure usa “Random”.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

BracketNode.displayName = "BracketNode";
export default BracketNode;
