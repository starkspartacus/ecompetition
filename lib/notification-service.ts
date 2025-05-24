import prismaNoTransactions from "@/lib/prisma-no-transactions-alt";

// Interface pour les données de création de notification
interface CreateNotificationData {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
}

// Fonction pour créer une notification dans la base de données
export async function createNotification(notification: CreateNotificationData) {
  try {
    // Créer la notification en base de données
    const result = await prismaNoTransactions.notification.create({
      data: {
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        link: notification.link,
        isRead: false,
      },
    });

    // Envoyer la notification via WebSocket
    await sendWebSocketNotification({
      ...notification,
      notificationId: result.id,
    });

    return { success: true, notificationId: result.id };
  } catch (error) {
    console.error("Erreur lors de la création de la notification:", error);
    return { success: false, error };
  }
}

// Fonction pour envoyer une notification via WebSocket
export async function sendWebSocketNotification(
  notification: CreateNotificationData & { notificationId?: string }
) {
  try {
    const broadcastUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const broadcastEndpoint = `${broadcastUrl}/api/socket/broadcast`;

    const response = await fetch(broadcastEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event: "notification",
        userId: notification.userId,
        data: {
          id: notification.notificationId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          link: notification.link,
          timestamp: new Date().toISOString(),
        },
      }),
    });

    if (!response.ok) {
      console.warn(
        `⚠️ Erreur lors de l'envoi de la notification WebSocket: ${response.statusText}`
      );
    } else {
      console.log("✅ Notification WebSocket envoyée avec succès");
    }

    return { success: true };
  } catch (error) {
    console.warn(
      "⚠️ Erreur lors de l'envoi de la notification via WebSocket:",
      error
    );
    return { success: false, error };
  }
}

// Fonction pour marquer une notification comme lue
export async function markNotificationAsRead(notificationId: string) {
  try {
    await prismaNoTransactions.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
      },
    });

    return { success: true };
  } catch (error) {
    console.error(
      "Erreur lors du marquage de la notification comme lue:",
      error
    );
    return { success: false, error };
  }
}

// Fonction pour récupérer les notifications d'un utilisateur
export async function getUserNotifications(
  userId: string,
  options: {
    limit?: number;
    skip?: number;
    unreadOnly?: boolean;
  } = {}
) {
  try {
    const where: any = { userId };

    if (options.unreadOnly) {
      where.isRead = false;
    }

    const notifications = await prismaNoTransactions.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: options.skip || 0,
      take: options.limit || 20,
    });

    return { success: true, notifications };
  } catch (error) {
    console.error("Erreur lors de la récupération des notifications:", error);
    return { success: false, error };
  }
}

// Fonction pour compter les notifications non lues d'un utilisateur
export async function countUnreadNotifications(userId: string) {
  try {
    const count = await prismaNoTransactions.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return { success: true, count };
  } catch (error) {
    console.error("Erreur lors du comptage des notifications non lues:", error);
    return { success: false, error };
  }
}

// Fonction pour supprimer une notification
export async function deleteNotification(notificationId: string) {
  try {
    await prismaNoTransactions.notification.delete({
      where: { id: notificationId },
    });

    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la suppression de la notification:", error);
    return { success: false, error };
  }
}

// Fonction pour marquer toutes les notifications d'un utilisateur comme lues
export async function markAllNotificationsAsRead(userId: string) {
  try {
    await prismaNoTransactions.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return { success: true };
  } catch (error) {
    console.error(
      "Erreur lors du marquage de toutes les notifications comme lues:",
      error
    );
    return { success: false, error };
  }
}
