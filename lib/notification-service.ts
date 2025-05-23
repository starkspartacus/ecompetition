/**
 * Service de notification qui utilise MongoDB natif tout en respectant le schéma Prisma
 */
import {
  validateNotification,
  type Notification,
  type NotificationType,
} from "./prisma-schema";

const {
  createDocument,
  findDocumentById,
  findDocuments,
  updateDocument,
  deleteDocument,
  countDocuments,
} = require("./mongodb-client");

// Collection pour les notifications
const COLLECTION_NAME = "Notification";

// Interface pour les options de requête de notifications
interface NotificationQueryOptions {
  limit?: number;
  skip?: number;
  unreadOnly?: boolean;
}

// Interface pour les données de création de notification
interface CreateNotificationData {
  type: NotificationType;
  title: string;
  message: string;
  userId: string;
  link?: string;
  isRead?: boolean;
  metadata?: Record<string, any>;
}

/**
 * Crée une nouvelle notification
 */
export async function createNotification(
  notificationData: CreateNotificationData
): Promise<Notification> {
  try {
    // Préparer les données de la notification
    const notification = {
      ...notificationData,
      isRead:
        notificationData.isRead !== undefined ? notificationData.isRead : false,
      createdAt: new Date(),
    };

    // Valider les données selon le schéma Prisma
    const validatedNotification = validateNotification(notification);

    // Créer la notification dans la base de données
    const createdNotification = await createDocument(
      COLLECTION_NAME,
      validatedNotification
    );

    console.log(`✅ Notification créée avec succès: ${createdNotification.id}`);
    return createdNotification as Notification;
  } catch (error) {
    console.error("❌ Erreur lors de la création de la notification:", error);
    throw error;
  }
}

/**
 * Récupère une notification par son ID
 */
export async function getNotificationById(
  id: string
): Promise<Notification | null> {
  try {
    const notification = await findDocumentById(COLLECTION_NAME, id);
    return notification as Notification | null;
  } catch (error) {
    console.error(
      "❌ Erreur lors de la récupération de la notification:",
      error
    );
    throw error;
  }
}

/**
 * Récupère les notifications d'un utilisateur
 */
export async function getNotificationsByUserId(
  userId: string,
  options: NotificationQueryOptions = {}
): Promise<Notification[]> {
  try {
    const filter: Record<string, any> = { userId };

    // Filtrer uniquement les notifications non lues si demandé
    if (options.unreadOnly) {
      filter.isRead = false;
    }

    // Options de pagination et de tri
    const queryOptions: Record<string, any> = {
      sort: { createdAt: -1 }, // Tri par date de création décroissante
    };

    if (options.limit) {
      queryOptions.limit = options.limit;
    }

    if (options.skip) {
      queryOptions.skip = options.skip;
    }

    const notifications = await findDocuments(
      COLLECTION_NAME,
      filter,
      queryOptions
    );
    return notifications as Notification[];
  } catch (error) {
    console.error(
      "❌ Erreur lors de la récupération des notifications:",
      error
    );
    throw error;
  }
}

/**
 * Marque une notification comme lue
 */
export async function markNotificationAsRead(
  id: string
): Promise<Notification> {
  try {
    const result = await updateDocument(COLLECTION_NAME, id, { isRead: true });
    console.log(`✅ Notification marquée comme lue: ${id}`);
    return result as Notification;
  } catch (error) {
    console.error(
      "❌ Erreur lors du marquage de la notification comme lue:",
      error
    );
    throw error;
  }
}

/**
 * Marque toutes les notifications d'un utilisateur comme lues
 */
export async function markAllNotificationsAsRead(
  userId: string
): Promise<number> {
  try {
    // Récupérer toutes les notifications non lues de l'utilisateur
    const unreadNotifications = await getNotificationsByUserId(userId, {
      unreadOnly: true,
    });

    // Marquer chaque notification comme lue
    const updatePromises = unreadNotifications.map(
      (notification: Notification) =>
        updateDocument(COLLECTION_NAME, notification.id, { isRead: true })
    );

    await Promise.all(updatePromises);

    console.log(
      `✅ ${unreadNotifications.length} notifications marquées comme lues pour l'utilisateur: ${userId}`
    );
    return unreadNotifications.length;
  } catch (error) {
    console.error(
      "❌ Erreur lors du marquage de toutes les notifications comme lues:",
      error
    );
    throw error;
  }
}

/**
 * Supprime une notification
 */
export async function deleteNotification(id: string): Promise<{ id: string }> {
  try {
    const result = await deleteDocument(COLLECTION_NAME, id);
    console.log(`✅ Notification supprimée avec succès: ${id}`);
    return result;
  } catch (error) {
    console.error(
      "❌ Erreur lors de la suppression de la notification:",
      error
    );
    throw error;
  }
}

/**
 * Supprime toutes les notifications lues d'un utilisateur
 */
export async function deleteReadNotifications(userId: string): Promise<number> {
  try {
    // Récupérer toutes les notifications lues de l'utilisateur
    const readNotifications = await findDocuments(COLLECTION_NAME, {
      userId,
      isRead: true,
    });

    // Supprimer chaque notification lue
    const deletePromises = readNotifications.map((notification: Notification) =>
      deleteDocument(COLLECTION_NAME, notification.id)
    );

    await Promise.all(deletePromises);

    console.log(
      `✅ ${readNotifications.length} notifications lues supprimées pour l'utilisateur: ${userId}`
    );
    return readNotifications.length;
  } catch (error) {
    console.error(
      "❌ Erreur lors de la suppression des notifications lues:",
      error
    );
    throw error;
  }
}

/**
 * Compte le nombre de notifications non lues d'un utilisateur
 */
export async function countUnreadNotifications(
  userId: string
): Promise<number> {
  try {
    return await countDocuments(COLLECTION_NAME, { userId, isRead: false });
  } catch (error) {
    console.error(
      "❌ Erreur lors du comptage des notifications non lues:",
      error
    );
    throw error;
  }
}

/**
 * Crée une notification de participation acceptée
 */
export async function createParticipationAcceptedNotification(
  userId: string,
  competitionTitle: string,
  competitionId: string
): Promise<Notification> {
  return createNotification({
    type: "PARTICIPATION_ACCEPTED",
    title: "Participation acceptée",
    message: `Votre demande de participation à la compétition "${competitionTitle}" a été acceptée.`,
    userId,
    link: `/participant/competitions/${competitionId}`,
  });
}

/**
 * Crée une notification de participation rejetée
 */
export async function createParticipationRejectedNotification(
  userId: string,
  competitionTitle: string,
  reason?: string
): Promise<Notification> {
  let message = `Votre demande de participation à la compétition "${competitionTitle}" a été rejetée.`;
  if (reason) {
    message += ` Raison: ${reason}`;
  }

  return createNotification({
    type: "PARTICIPATION_REJECTED",
    title: "Participation rejetée",
    message,
    userId,
  });
}

/**
 * Crée une notification de nouvelle demande de participation
 */
export async function createNewParticipationRequestNotification(
  organizerId: string,
  participantName: string,
  competitionTitle: string,
  competitionId: string
): Promise<Notification> {
  return createNotification({
    type: "NEW_PARTICIPATION_REQUEST",
    title: "Nouvelle demande de participation",
    message: `${participantName} souhaite participer à votre compétition "${competitionTitle}".`,
    userId: organizerId,
    link: `/organizer/competitions/${competitionId}/participants`,
  });
}

/**
 * Crée une notification de rappel de date limite d'inscription
 */
export async function createRegistrationDeadlineReminderNotification(
  userId: string,
  competitionTitle: string,
  competitionId: string,
  daysLeft: number
): Promise<Notification> {
  return createNotification({
    type: "REGISTRATION_DEADLINE_REMINDER",
    title: "Rappel de date limite d'inscription",
    message: `Il ne reste que ${daysLeft} jour(s) pour s'inscrire à la compétition "${competitionTitle}".`,
    userId,
    link: `/participant/competitions/${competitionId}`,
  });
}

/**
 * Crée une notification de début de compétition
 */
export async function createCompetitionStartNotification(
  userId: string,
  competitionTitle: string,
  competitionId: string
): Promise<Notification> {
  return createNotification({
    type: "COMPETITION_START",
    title: "Début de compétition",
    message: `La compétition "${competitionTitle}" commence aujourd'hui.`,
    userId,
    link: `/participant/competitions/${competitionId}`,
  });
}
