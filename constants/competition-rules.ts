import {
  OffsideRule,
  SubstitutionRule,
  YellowCardRule,
  MatchDuration,
  TournamentFormat,
} from "@prisma/client";

export const COMPETITION_RULES = [
  {
    value: TournamentFormat.SINGLE_ELIMINATION,
    label: "Élimination directe",
    description: "Les participants sont éliminés après une défaite",
  },
  {
    value: TournamentFormat.DOUBLE_ELIMINATION,
    label: "Double élimination",
    description: "Les participants sont éliminés après deux défaites",
  },
  {
    value: TournamentFormat.ROUND_ROBIN,
    label: "Tournoi toutes rondes",
    description: "Chaque participant affronte tous les autres participants",
  },
  {
    value: TournamentFormat.SWISS_SYSTEM,
    label: "Système suisse",
    description: "Les participants s'affrontent selon leur classement actuel",
  },
  {
    value: TournamentFormat.GROUPS,
    label: "Phase de groupes",
    description:
      "Les participants sont répartis en groupes pour des matchs préliminaires",
  },
  {
    value: TournamentFormat.KNOCKOUT,
    label: "Phase à élimination",
    description: "Phase finale avec élimination directe",
  },
];

export type CompetitionRule = (typeof COMPETITION_RULES)[number]["value"];

export const COMPETITION_STATUS = [
  {
    value: "DRAFT",
    label: "Brouillon",
  },
  {
    value: "OPEN",
    label: "Publiée",
  },
  {
    value: "CLOSED",
    label: "Inscriptions fermées",
  },
  {
    value: "IN_PROGRESS",
    label: "En cours",
  },
  {
    value: "COMPLETED",
    label: "Terminée",
  },
  {
    value: "CANCELLED",
    label: "Annulée",
  },
];

export type CompetitionStatus = (typeof COMPETITION_STATUS)[number]["value"];

// Règles spécifiques pour le football et autres sports
export const OFFSIDE_RULES = [
  {
    value: OffsideRule.ENABLED,
    label: "Hors-jeu activé",
    description: "La règle du hors-jeu est appliquée",
  },
  {
    value: OffsideRule.DISABLED,
    label: "Hors-jeu désactivé",
    description: "La règle du hors-jeu n'est pas appliquée",
  },
];

export const SUBSTITUTION_RULES = [
  {
    value: SubstitutionRule.LIMITED,
    label: "Remplacements limités",
    description: "Nombre limité de remplacements (3-5)",
  },
  {
    value: SubstitutionRule.UNLIMITED,
    label: "Remplacements illimités",
    description: "Nombre illimité de remplacements",
  },
  {
    value: SubstitutionRule.FLYING,
    label: "Remplacements volants",
    description: "Remplacements sans arrêt de jeu",
  },
];

export const YELLOW_CARD_RULES = [
  {
    value: YellowCardRule.STANDARD,
    label: "Standard",
    description: "Expulsion après 2 cartons jaunes",
  },
  {
    value: YellowCardRule.STRICT,
    label: "Strict",
    description: "Expulsion après 1 carton jaune",
  },
  {
    value: YellowCardRule.LENIENT,
    label: "Souple",
    description: "Expulsion après 3 cartons jaunes",
  },
];

export const MATCH_DURATIONS = [
  { value: MatchDuration.SHORT, label: "Court", description: "2x30 minutes" },
  {
    value: MatchDuration.STANDARD,
    label: "Standard",
    description: "2x45 minutes",
  },
  {
    value: MatchDuration.EXTENDED,
    label: "Prolongé",
    description: "2x60 minutes",
  },
];

// Alias pour la compatibilité avec le code existant
export const competitionRules = COMPETITION_RULES;
