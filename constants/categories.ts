import { CompetitionCategory } from "@prisma/client";

export const COMPETITION_CATEGORIES = [
  { value: CompetitionCategory.FOOTBALL, label: "Football" },
  { value: CompetitionCategory.BASKETBALL, label: "Basketball" },
  { value: CompetitionCategory.VOLLEYBALL, label: "Volleyball" },
  { value: CompetitionCategory.HANDBALL, label: "Handball" },
  { value: CompetitionCategory.TENNIS, label: "Tennis" },
  { value: CompetitionCategory.MARACANA, label: "Maracana" },
  { value: CompetitionCategory.OTHER, label: "Autre" },
];

export const TOURNAMENT_FORMATS = [
  { value: "ROUND_ROBIN", label: "Championnat (tous contre tous)" },
  { value: "GROUPS", label: "Phases de groupes" },
  { value: "KNOCKOUT", label: "Élimination directe" },
];
