# AGENTS.md

## Project

Dit project heet RouteMaat.

RouteMaat is een privé familie-reisplanner. De app wordt eerst gebruikt voor een Japanreis, maar moet later ook bruikbaar zijn voor andere reizen.

De app is bedoeld voor familie en vrienden, niet als commerciële applicatie.

## Stack

Gebruik deze stack:

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- lucide-react
- Firebase Auth
- Firestore
- Firebase Storage
- GitHub
- Vercel

## Algemene regels

- Gebruik TypeScript strict.
- Gebruik geen `any`.
- Gebruik duidelijke types voor data uit Firestore.
- Gebruik React function components.
- Gebruik Next.js App Router.
- Gebruik mobile-first design.
- Gebruik Nederlandse UI-teksten.
- Gebruik `@/*` als import alias.
- Houd componenten klein en overzichtelijk.
- Voeg geen ongevraagde features toe.
- Maak kleine, reviewbare wijzigingen.
- Controleer bestaande code voordat je bestanden wijzigt.
- Zorg dat `npm run lint` slaagt.
- Zorg dat `npm run build` slaagt.

## Styling en UI

De app moet fris, licht, jeugdig, overzichtelijk en mobielvriendelijk zijn.

Designrichting:

- lichte achtergrond
- witte cards
- afgeronde hoeken
- subtiele schaduw
- duidelijke hiërarchie
- neon-accenten, maar niet overdreven
- rustige spacing
- moderne iconen via lucide-react
- shadcn/ui gebruiken waar dat logisch is

Kleurgevoel:

- lichtblauw
- zacht roze
- neon cyaan
- neon roze
- lime accent
- donkere tekst op lichte achtergrond

Gebruik waar mogelijk bestaande shadcn/ui componenten zoals:

- Button
- Card
- Input
- Label
- Textarea
- Select
- Badge
- Dialog
- DropdownMenu

## Taal

Alle zichtbare UI-teksten zijn Nederlands.

Gebruik bijvoorbeeld:

- Idee toevoegen
- Idee bewerken
- Verwijderen
- Opslaan
- Annuleren
- Reizen
- Planning
- Documenten
- Leden
- Instellingen
- Geen ideeën gevonden

Interne typewaarden mogen Engels zijn.

## Functionele scope eerste fase

Bouw eerst alleen de basis voor:

- reizenlijst
- trip detail layout
- ideeënmodule
- categorieën
- tags
- filters
- status
- prioriteit
- Google Maps-link
- website-link
- notities

Nog niet bouwen:

- budget
- stemfunctie
- notificaties
- volledige PWA
- uitgebreide planning
- hotels
- vervoer
- taalmodule
- regels/gewoontes
- checklist
- uitnodigingen via e-mail
- volledige Firebase Auth-flow, tenzij expliciet gevraagd

## Rollen

Gebruik deze rollen:

- owner
- admin
- editor
- viewer

Nederlandse labels:

- owner = Eigenaar
- admin = Beheerder
- editor = Bewerker
- viewer = Kijker

Rechten:

- owner mag alles
- admin mag beheren en bewerken
- editor mag ideeën/planning bewerken
- viewer mag alleen bekijken

Alleen owner, admin en editor mogen ideeën toevoegen of bewerken.

## Basisdatamodel

Gebruik deze hoofdstructuur als uitgangspunt:

```txt
users/{userId}

trips/{tripId}

trips/{tripId}/members/{userId}

trips/{tripId}/ideas/{ideaId}
Idea types

Gebruik deze types voor ideeën:

export type IdeaStatus = "idea" | "maybe" | "planned" | "booked" | "skipped";

export type IdeaPriority = "low" | "medium" | "high";

export type IdeaCategory =
  | "sightseeing"
  | "restaurant"
  | "hotel"
  | "shop"
  | "activity"
  | "transport"
  | "practical"
  | "language"
  | "custom"
  | "document"
  | "other";

export type TripIdea = {
  id: string;
  tripId: string;
  title: string;
  description: string;
  category: IdeaCategory;
  tags: string[];
  city?: string;
  locationName?: string;
  googleMapsUrl?: string;
  websiteUrl?: string;
  notes?: string;
  status: IdeaStatus;
  priority: IdeaPriority;
  addedBy: string;
  createdAt: Date;
  updatedAt: Date;
};
Nederlandse labels voor ideeën

Categorieën:

export const ideaCategoryLabels: Record<IdeaCategory, string> = {
  sightseeing: "Bezienswaardigheid",
  restaurant: "Restaurant",
  hotel: "Hotel",
  shop: "Winkel",
  activity: "Activiteit",
  transport: "Vervoer",
  practical: "Praktisch",
  language: "Taal",
  custom: "Gewoonte / regel",
  document: "Document",
  other: "Overig",
};

Statussen:

export const ideaStatusLabels: Record<IdeaStatus, string> = {
  idea: "Idee",
  maybe: "Misschien",
  planned: "Gepland",
  booked: "Geboekt",
  skipped: "Afgevallen",
};

Prioriteiten:

export const ideaPriorityLabels: Record<IdeaPriority, string> = {
  low: "Laag",
  medium: "Normaal",
  high: "Hoog",
};
Gewenste routes eerste fase

Gebruik deze routes als basis:

/
 /trips
 /trips/[tripId]
 /trips/[tripId]/ideas

Later kunnen deze routes erbij komen:

/trips/[tripId]/planning
/trips/[tripId]/hotels
/trips/[tripId]/transport
/trips/[tripId]/documents
/trips/[tripId]/checklist
/trips/[tripId]/members
/trips/[tripId]/settings
Gewenste mappenstructuur

Gebruik bij voorkeur deze structuur:

src/
  app/
    trips/
      page.tsx
      [tripId]/
        page.tsx
        ideas/
          page.tsx

  components/
    layout/
      AppShell.tsx
      BottomNav.tsx
      PageHeader.tsx

  features/
    ideas/
      ideaTypes.ts
      ideaLabels.ts
      ideaMockData.ts
      IdeaCard.tsx
      IdeaForm.tsx
      IdeaFilters.tsx
      IdeasPageClient.tsx

    trips/
      tripTypes.ts
      tripMockData.ts
      TripCard.tsx

  lib/
    firebase.ts
    utils.ts
Ideeënmodule eisen

De eerste versie van de ideeënmodule moet dit ondersteunen:

ideeën tonen uit mockdata
idee toevoegen in client state
idee bewerken in client state
idee verwijderen uit client state
zoeken op titel, stad, locatie en tags
filteren op categorie
filteren op status
filteren op prioriteit
filteren op tags
tags invoeren als komma-gescheiden tekst
titel is verplicht
nette empty state als er geen ideeën zijn
nette empty state als filters geen resultaten geven
UI voor ideeën

Een ideekaart toont minimaal:

titel
categorie
status
prioriteit
stad of locatie
tags
korte omschrijving
knoppen voor bewerken en verwijderen
link naar Google Maps als aanwezig
website-link als aanwezig
Firebase

Firebase wordt later toegevoegd of verder uitgewerkt.

Wanneer Firebase wordt gebruikt:

Firebase-configuratie staat in src/lib/firebase.ts.
Gebruik environment variables met NEXT_PUBLIC_.
Gebruik geen Firebase Admin SDK tenzij expliciet gevraagd.
Firestore-data moet getypeerd zijn.
Firestore servicefuncties horen per feature in een eigen servicebestand.

Voorbeeld:

src/features/ideas/ideaService.ts
src/features/trips/tripService.ts
Wat voorlopig niet doen

Bouw niet ongevraagd:

server actions
database buiten Firebase
Prisma
NextAuth
Redux
Zustand
budgetmodule
notificaties
PWA
betalingen
commerciële features
uitgebreide adminomgeving
Belangrijk voor Codex

Werk taakgericht.

Als een taak gaat over de ideeënmodule, wijzig dan alleen bestanden die daarvoor nodig zijn.

Als iets onduidelijk is, kies de eenvoudigste oplossing die past bij:

Next.js
TypeScript
Firebase
mobile-first
Nederlandse UI
geen any

Maak geen grote refactors zonder duidelijke reden.
```
