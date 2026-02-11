import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useQuery } from "@tanstack/react-query";
import { Frown, Loader2, OctagonAlert } from "lucide-react";
import { TeamService } from "./team.service";
import TeamCard from "./TeamCard";
import TeamCreateButton from "./TeamCreateButton";

export default function TeamList() {
  const {
    data: teams = [],
    isPending,
    isError,
    refetch,
    error,
  } = useQuery({
    queryKey: ["teams"],
    queryFn: TeamService.list,
  });

  if (isPending) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Loader2 className="animate-spin" />
          </EmptyMedia>
          <EmptyTitle>Caricamento...</EmptyTitle>
          <EmptyDescription>
            Attendi mentre vengono caricate le squadre
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (isError) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <OctagonAlert />
          </EmptyMedia>
          <EmptyTitle>Errore</EmptyTitle>
          <EmptyDescription>
            {(error as any)?.message ?? "Errore imprevisto"}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={() => refetch()}>Riprova</Button>
        </EmptyContent>
      </Empty>
    );
  }

  if (!teams.length) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Frown />
          </EmptyMedia>
          <EmptyTitle>Nessuna squadra</EmptyTitle>
          <EmptyDescription>
            Crea una squadra e aggiungi fino a 5 giocatori
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <TeamCreateButton />
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-6 items-start auto-rows-min">
      {teams.map((t) => (
        <TeamCard key={t.id} team={t} />
      ))}
    </div>
  );
}
