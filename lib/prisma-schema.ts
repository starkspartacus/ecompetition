/**
 * Types et enums du schéma Prisma mis à jour
 */

// Enums du schéma Prisma
export enum UserRole {
  ORGANIZER = "ORGANIZER",
  PARTICIPANT = "PARTICIPANT",
  ADMIN = "ADMIN",
}

export enum CompetitionCategory {
  FOOTBALL = "FOOTBALL",
  BASKETBALL = "BASKETBALL",
  VOLLEYBALL = "VOLLEYBALL",
  HANDBALL = "HANDBALL",
  TENNIS = "TENNIS",
  MARACANA = "MARACANA",
  OTHER = "OTHER",
}

export enum CompetitionStatus {
  DRAFT = "DRAFT",
  OPEN = "OPEN",
  CLOSED = "CLOSED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum ParticipationStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
}

export enum TournamentFormat {
  ROUND_ROBIN = "ROUND_ROBIN",
  GROUPS = "GROUPS",
  KNOCKOUT = "KNOCKOUT",
  SINGLE_ELIMINATION = "SINGLE_ELIMINATION",
  DOUBLE_ELIMINATION = "DOUBLE_ELIMINATION",
  SWISS_SYSTEM = "SWISS_SYSTEM",
}

export enum TournamentPhase {
  GROUP_STAGE = "GROUP_STAGE",
  ROUND_OF_16 = "ROUND_OF_16",
  QUARTER_FINALS = "QUARTER_FINALS",
  SEMI_FINALS = "SEMI_FINALS",
  FINALS = "FINALS",
}

export enum AuthMethod {
  EMAIL = "EMAIL",
  PHONE = "PHONE",
  GOOGLE = "GOOGLE",
}

export enum OffsideRule {
  ENABLED = "ENABLED",
  DISABLED = "DISABLED",
}

export enum SubstitutionRule {
  LIMITED = "LIMITED",
  UNLIMITED = "UNLIMITED",
  FLYING = "FLYING",
}

export enum YellowCardRule {
  STANDARD = "STANDARD",
  STRICT = "STRICT",
  LENIENT = "LENIENT",
}

export enum MatchDuration {
  SHORT = "SHORT",
  STANDARD = "STANDARD",
  EXTENDED = "EXTENDED",
}

// Types de notifications
export type NotificationType =
  | "PARTICIPATION_ACCEPTED"
  | "PARTICIPATION_REJECTED"
  | "NEW_PARTICIPATION_REQUEST"
  | "REGISTRATION_DEADLINE_REMINDER"
  | "COMPETITION_START"
  | "COMPETITION_UPDATE"
  | "MATCH_SCHEDULED"
  | "MATCH_RESULT"
  | "SYSTEM_NOTIFICATION"
  | "WELCOME"
  | "PROFILE_UPDATE"
  | "PASSWORD_RESET";

// Types pour les modèles Prisma
export interface User {
  id: string;
  email?: string;
  password?: string;
  phoneNumber?: string;
  phoneCountryCode?: string;
  countryCode: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  city: string;
  commune?: string;
  address: string;
  photoUrl?: string;
  role: UserRole;
  preferredAuthMethod: AuthMethod;
  competitionCategory?: CompetitionCategory;
  bio?: string;
  socialLinks?: any;
  lastLogin?: Date;
  isVerified: boolean;
  verificationToken?: string;
  resetToken?: string;
  resetTokenExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Competition {
  id: string;
  title: string;
  address: string;
  venue: string;
  maxParticipants: number;
  imageUrl?: string;
  bannerUrl?: string;
  category: CompetitionCategory;
  registrationStartDate: Date;
  registrationDeadline: Date;
  startDate?: Date;
  endDate?: Date;
  description?: string;
  rules?: string[] | any; // Updated to handle both string and array
  prizes?: any;
  uniqueCode: string;
  status: CompetitionStatus;
  tournamentFormat?: TournamentFormat;
  isPublic: boolean;
  offsideRule?: OffsideRule;
  substitutionRule?: SubstitutionRule;
  yellowCardRule?: YellowCardRule;
  matchDuration?: MatchDuration;
  customRules?: any;
  organizerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Participation {
  id: string;
  status: ParticipationStatus;
  message?: string;
  responseMessage?: string;
  competitionId: string;
  participantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Team {
  id: string;
  name: string;
  logoUrl?: string;
  colors?: string;
  description?: string;
  competitionId: string;
  ownerId: string;
  groupId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Player {
  id: string;
  name: string;
  age: number;
  position?: string;
  number?: number;
  photoUrl?: string;
  stats?: any;
  teamId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Match {
  id: string;
  phase: TournamentPhase;
  matchNumber: number;
  homeScore?: number;
  awayScore?: number;
  played: boolean;
  scheduledDate?: Date;
  location?: string;
  highlights?: string;
  stats?: any;
  competitionId: string;
  homeTeamId: string;
  awayTeamId: string;
  groupId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Group {
  id: string;
  name: string;
  competitionId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  userId: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

// Fonctions de validation pour s'assurer que les données respectent le schéma Prisma
export function validateUser(user: any): User {
  // Validation des champs essentiels
  if (!user.firstName || !user.lastName) {
    const missingFields = [];
    if (!user.firstName) missingFields.push("firstName");
    if (!user.lastName) missingFields.push("lastName");
    throw new Error(
      `Données utilisateur incomplètes: ${missingFields.join(", ")} manquant(s)`
    );
  }

  // Fournir des valeurs par défaut pour les champs obligatoires selon le schéma
  user.countryCode = user.countryCode || "FR";
  user.dateOfBirth = user.dateOfBirth
    ? new Date(user.dateOfBirth)
    : new Date("2000-01-01");
  user.city = user.city || "Non spécifiée";
  user.address = user.address || "Non spécifiée";

  // Validation des enums
  if (user.role && !Object.values(UserRole).includes(user.role)) {
    throw new Error(`Role invalide: ${user.role}`);
  }

  if (
    user.preferredAuthMethod &&
    !Object.values(AuthMethod).includes(user.preferredAuthMethod)
  ) {
    throw new Error(
      `Méthode d'authentification invalide: ${user.preferredAuthMethod}`
    );
  }

  if (
    user.competitionCategory &&
    !Object.values(CompetitionCategory).includes(user.competitionCategory)
  ) {
    throw new Error(
      `Catégorie de compétition invalide: ${user.competitionCategory}`
    );
  }

  // Conversion des dates
  if (user.lastLogin && !(user.lastLogin instanceof Date)) {
    user.lastLogin = new Date(user.lastLogin);
  }

  if (user.resetTokenExpiry && !(user.resetTokenExpiry instanceof Date)) {
    user.resetTokenExpiry = new Date(user.resetTokenExpiry);
  }

  // Valeurs par défaut
  user.createdAt = user.createdAt || new Date();
  user.updatedAt = user.updatedAt || new Date();
  user.isVerified = user.isVerified !== undefined ? user.isVerified : false;
  user.preferredAuthMethod = user.preferredAuthMethod || AuthMethod.EMAIL;
  user.role = user.role || UserRole.PARTICIPANT;

  return user as User;
}

export function validateCompetition(competition: any): Competition {
  // Validation de base
  if (
    !competition.title ||
    !competition.address ||
    !competition.venue ||
    !competition.maxParticipants ||
    !competition.category ||
    !competition.registrationStartDate ||
    !competition.registrationDeadline ||
    !competition.organizerId
  ) {
    throw new Error("Données de compétition incomplètes");
  }

  // Validation des enums
  if (
    competition.category &&
    !Object.values(CompetitionCategory).includes(competition.category)
  ) {
    throw new Error(`Catégorie invalide: ${competition.category}`);
  }

  if (
    competition.status &&
    !Object.values(CompetitionStatus).includes(competition.status)
  ) {
    throw new Error(`Statut invalide: ${competition.status}`);
  }

  if (
    competition.tournamentFormat &&
    !Object.values(TournamentFormat).includes(competition.tournamentFormat)
  ) {
    throw new Error(
      `Format de tournoi invalide: ${competition.tournamentFormat}`
    );
  }

  if (
    competition.offsideRule &&
    !Object.values(OffsideRule).includes(competition.offsideRule)
  ) {
    throw new Error(`Règle de hors-jeu invalide: ${competition.offsideRule}`);
  }

  if (
    competition.substitutionRule &&
    !Object.values(SubstitutionRule).includes(competition.substitutionRule)
  ) {
    throw new Error(
      `Règle de substitution invalide: ${competition.substitutionRule}`
    );
  }

  if (
    competition.yellowCardRule &&
    !Object.values(YellowCardRule).includes(competition.yellowCardRule)
  ) {
    throw new Error(
      `Règle de carton jaune invalide: ${competition.yellowCardRule}`
    );
  }

  if (
    competition.matchDuration &&
    !Object.values(MatchDuration).includes(competition.matchDuration)
  ) {
    throw new Error(`Durée de match invalide: ${competition.matchDuration}`);
  }

  // Conversion des dates
  if (
    competition.registrationStartDate &&
    !(competition.registrationStartDate instanceof Date)
  ) {
    competition.registrationStartDate = new Date(
      competition.registrationStartDate
    );
  }

  if (
    competition.registrationDeadline &&
    !(competition.registrationDeadline instanceof Date)
  ) {
    competition.registrationDeadline = new Date(
      competition.registrationDeadline
    );
  }

  if (competition.startDate && !(competition.startDate instanceof Date)) {
    competition.startDate = new Date(competition.startDate);
  }

  if (competition.endDate && !(competition.endDate instanceof Date)) {
    competition.endDate = new Date(competition.endDate);
  }

  // Valeurs par défaut
  competition.createdAt = competition.createdAt || new Date();
  competition.updatedAt = competition.updatedAt || new Date();
  competition.status = competition.status || CompetitionStatus.DRAFT;
  competition.isPublic =
    competition.isPublic !== undefined ? competition.isPublic : true;

  return competition as Competition;
}

export function validateParticipation(participation: any): Participation {
  // Validation de base
  if (!participation.competitionId || !participation.participantId) {
    throw new Error("Données de participation incomplètes");
  }

  // Validation des enums
  if (
    participation.status &&
    !Object.values(ParticipationStatus).includes(participation.status)
  ) {
    throw new Error(`Statut invalide: ${participation.status}`);
  }

  // Valeurs par défaut
  participation.createdAt = participation.createdAt || new Date();
  participation.updatedAt = participation.updatedAt || new Date();
  participation.status = participation.status || ParticipationStatus.PENDING;

  return participation as Participation;
}

export function validateTeam(team: any): Team {
  // Validation de base
  if (!team.name || !team.competitionId || !team.ownerId) {
    throw new Error("Données d'équipe incomplètes");
  }

  // Valeurs par défaut
  team.createdAt = team.createdAt || new Date();
  team.updatedAt = team.updatedAt || new Date();

  return team as Team;
}

export function validatePlayer(player: any): Player {
  // Validation de base
  if (!player.name || !player.age || !player.teamId) {
    throw new Error("Données de joueur incomplètes");
  }

  // Valeurs par défaut
  player.createdAt = player.createdAt || new Date();
  player.updatedAt = player.updatedAt || new Date();

  return player as Player;
}

export function validateMatch(match: any): Match {
  // Validation de base
  if (
    !match.phase ||
    !match.matchNumber ||
    !match.competitionId ||
    !match.homeTeamId ||
    !match.awayTeamId
  ) {
    throw new Error("Données de match incomplètes");
  }

  // Validation des enums
  if (match.phase && !Object.values(TournamentPhase).includes(match.phase)) {
    throw new Error(`Phase invalide: ${match.phase}`);
  }

  // Conversion des dates
  if (match.scheduledDate && !(match.scheduledDate instanceof Date)) {
    match.scheduledDate = new Date(match.scheduledDate);
  }

  // Valeurs par défaut
  match.createdAt = match.createdAt || new Date();
  match.updatedAt = match.updatedAt || new Date();
  match.played = match.played !== undefined ? match.played : false;

  return match as Match;
}

export function validateGroup(group: any): Group {
  // Validation de base
  if (!group.name || !group.competitionId) {
    throw new Error("Données de groupe incomplètes");
  }

  // Valeurs par défaut
  group.createdAt = group.createdAt || new Date();
  group.updatedAt = group.updatedAt || new Date();

  return group as Group;
}

export function validateNotification(notification: any): Notification {
  // Validation de base
  if (
    !notification.type ||
    !notification.title ||
    !notification.message ||
    !notification.userId
  ) {
    const missingFields = [];
    if (!notification.type) missingFields.push("type");
    if (!notification.title) missingFields.push("title");
    if (!notification.message) missingFields.push("message");
    if (!notification.userId) missingFields.push("userId");

    throw new Error(
      `Données de notification incomplètes: ${missingFields.join(
        ", "
      )} manquant(s)`
    );
  }

  // Valeurs par défaut
  notification.createdAt = notification.createdAt || new Date();
  notification.isRead =
    notification.isRead !== undefined ? notification.isRead : false;

  return notification as Notification;
}
