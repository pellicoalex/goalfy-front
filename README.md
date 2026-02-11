
# FRONTED

Fare il clone del progetto da GitHub comando GIT CLONE https://github.com/pellicoalex/goalfy-front.git

## Avvio Fronted

1 Posizionarsi nella cartella del frontend del progetto:

goalfy-front

2 Installare tutte le dipendenze frontend (node_modules):

npm install

3 Avviare il frontend in modalità sviluppo:

npm run dev

4 All’interno della cartella goalfy-front, fuori dalla cartella src, creare il file .env.local seguendo l'esempio (.env.example)

VITE_BACKEND_URL=qui il backend url tipo http://localhost:8000


## Nota importante
Assicurarsi che anche il progetto backend sia aperto e sia in run il server di sviluppo alla porta 8000 perchè le fetch vadano a buon fine

## struttura progetto

- cartella COMPONENTS
- sottocartella UI
- componenti installate da schadcn
- componenti creati da me

- cartella FEATURES
- sottocartella brackett
- sottocartella dashboard
- sottocartella match
- sottocartella player
- sottocartella team
- sottocartella tournament

- cartella LAYOUTS
- layout di tutte le pagine tramite il file MainLayout.tsx

- cartella LIB
- apiErrors.ts per errori da parte del backend
- backend.ts per my fetch()
- env.ts per myenv
- media.ts per i media
- preloader per il preloader
- theme.ts per la dark e light mode
- utils.ts 

- cartella PAGES
- pagina HomePage
- pagina NotFoundPage
- pagina PlayerPage
- pagina Preloader
- pagina TeamPage
- pagina TournamentHistoryPage
- pagina TournamentPage
- pagina TournamentSetupPage
- pagina TournamentListPage


- cartella Assets
- sottocartella lotties con all'interno Footballer.json(animazione lottie per page 404)

## Tecnologie e librerie utilizzate
- React 18.x
- Vite 5.x
- TailwindCSS 4.x
- Shadcn/ui 3.x
- Tanstack React Query 5.x
- Tanstack React Query Devtools 5.x
- React Router 6.x
- React Flow 12.x
- Lucide React 0.x
- Sonner 1.x
- Zod 3.x
- React Hook Form 7.x


# Progetto     

Lo Sport scelto è il calco a 5 e il nome della piattaforma è GOALFY ispirato a SPOTIFY colosso della musica ma in ottica del futsal quindi da li il nome Goalfy da goal che rappresenta l'obbiettivo finale del medisimo sport. Il Tournament Manager consiste nella creazione di team, associazione dei team ai tornei creati, vedere i tornei in draft, in corso e conclusi tramite la pagina tornei e si può vedere lo storico tramite la pagina storico con il percorso della squadra vincente in tutte le sue partite fino alla conquista del tornei con MVP, Capocannoniere e miglior Portiere. Ogni Giocatore ha la sua scheda tecnica con info personali, squadra di appartenenza, e numeri del torneo(goal, presenze assist).


Il gestionale permette di:

- Creare squadre (max 5 giocatori)
- Assegnare ruoli futsal (GOALKEEPER, FIXO, ALA, PIVO, UNIVERSAL)
- Creare tornei a 8 squadre
- Generare automaticamente il bracket
- Salvare goal e assist per ogni match
- Avanzare automaticamente il vincitore
- Calcolare statistiche aggregate
- Gestire upload immagini (logo e avatar)
- Gestire stato torneo: draft → ongoing → completed


## Buon divertimento con GOALFY Tournament Manager

