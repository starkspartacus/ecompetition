export const OFFSIDE_RULES = [
  {
    value: "ENABLED",
    label: "Hors-jeu activé",
    description: "La règle du hors-jeu est appliquée",
  },
  {
    value: "DISABLED",
    label: "Hors-jeu désactivé",
    description: "La règle du hors-jeu n'est pas appliquée",
  },
];

export const SUBSTITUTION_RULES = [
  {
    value: "LIMITED",
    label: "Remplacements limités",
    description: "Nombre limité de remplacements (3-5)",
  },
  {
    value: "UNLIMITED",
    label: "Remplacements illimités",
    description: "Nombre illimité de remplacements",
  },
  {
    value: "FLYING",
    label: "Remplacements volants",
    description: "Remplacements sans arrêt de jeu",
  },
];

export const YELLOW_CARD_RULES = [
  {
    value: "STANDARD",
    label: "Standard",
    description: "Expulsion après 2 cartons jaunes",
  },
  {
    value: "STRICT",
    label: "Strict",
    description: "Expulsion après 1 carton jaune",
  },
  {
    value: "LENIENT",
    label: "Souple",
    description: "Expulsion après 3 cartons jaunes",
  },
];

export const MATCH_DURATIONS = [
  { value: "SHORT", label: "Court", description: "2x30 minutes" },
  { value: "STANDARD", label: "Standard", description: "2x45 minutes" },
  { value: "EXTENDED", label: "Prolongé", description: "2x60 minutes" },
];
