const { Server } = require("socket.io");

let io = null;

function initializeSocketServer(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Client connecté: ${socket.id}`);

    // Authentification de l'utilisateur
    socket.on("authenticate", (data) => {
      const { userId, role } = data;
      if (!userId) {
        socket.emit("authenticated", {
          success: false,
          error: "ID utilisateur manquant",
        });
        return;
      }

      // Stocker les informations de l'utilisateur dans l'objet socket
      socket.data.userId = userId;
      socket.data.role = role || "PARTICIPANT";

      // Rejoindre la room spécifique à l'utilisateur
      socket.join(`user-${userId}`);
      console.log(
        `👤 Utilisateur ${userId} (${role}) authentifié et a rejoint la room user-${userId}`
      );

      // Si c'est un organisateur, le faire rejoindre la room des organisateurs
      if (role === "ORGANIZER") {
        socket.join("organizers");
        socket.join(`organizer-${userId}`);
        console.log(
          `👑 Organisateur ${userId} a rejoint la room des organisateurs`
        );
      }

      socket.emit("authenticated", { success: true, userId });
    });

    // Rejoindre une room de compétition
    socket.on("join-competition", (competitionId) => {
      if (!competitionId) return;
      socket.join(`competition-${competitionId}`);
      console.log(
        `🏆 Client ${socket.id} a rejoint la room de la compétition ${competitionId}`
      );
    });

    // Rejoindre une room d'organisateur
    socket.on("join-organizer", (organizerId) => {
      if (!organizerId) return;
      socket.join(`organizer-${organizerId}`);
      console.log(
        `👑 Client ${socket.id} a rejoint la room de l'organisateur ${organizerId}`
      );
    });

    // Rejoindre une room générique
    socket.on("join-room", (room) => {
      if (!room) return;
      socket.join(room);
      console.log(`🚪 Client ${socket.id} a rejoint la room ${room}`);
    });

    // Ping pour maintenir la connexion active
    socket.on("ping", () => {
      socket.emit("pong", { timestamp: new Date() });
    });

    // Déconnexion
    socket.on("disconnect", (reason) => {
      console.log(`🔌 Client déconnecté: ${socket.id}, raison: ${reason}`);
    });
  });

  console.log("🚀 Serveur Socket.IO initialisé");
  return io;
}

function getSocketIO() {
  if (!io) {
    console.warn(
      "⚠️ Socket.IO n'est pas initialisé. Utilisez initializeSocketServer d'abord."
    );
    return null;
  }
  return io;
}

// Fonction pour envoyer une notification à un utilisateur spécifique
function sendNotificationToUser(userId, notification) {
  if (!io) {
    console.warn(
      "⚠️ Socket.IO n'est pas initialisé. Impossible d'envoyer la notification."
    );
    return false;
  }

  try {
    // Envoyer à la room spécifique de l'utilisateur
    io.to(`user-${userId}`).emit("notification", notification);

    // Si c'est une notification de participation, envoyer aussi comme événement spécifique
    if (
      notification.type === "PARTICIPATION_REQUEST" ||
      (notification.data && notification.data.type === "PARTICIPATION_REQUEST")
    ) {
      io.to(`user-${userId}`).emit("new-participation-request", {
        participationId: notification.data?.participationId,
        competitionId: notification.data?.competitionId,
        competitionTitle: notification.data?.competitionName,
        participantId: notification.data?.participantId,
        participantName: notification.data?.participantName,
        timestamp: new Date(),
        ...notification.data,
      });
    }

    console.log(
      `📨 Notification envoyée à l'utilisateur ${userId}:`,
      notification.title
    );
    return true;
  } catch (error) {
    console.error(
      `❌ Erreur lors de l'envoi de la notification à l'utilisateur ${userId}:`,
      error
    );
    return false;
  }
}

// Fonction pour envoyer une notification à tous les organisateurs
function sendNotificationToOrganizers(notification) {
  if (!io) {
    console.warn(
      "⚠️ Socket.IO n'est pas initialisé. Impossible d'envoyer la notification."
    );
    return false;
  }

  try {
    io.to("organizers").emit("notification", notification);
    console.log(
      "📨 Notification envoyée à tous les organisateurs:",
      notification.title
    );
    return true;
  } catch (error) {
    console.error(
      "❌ Erreur lors de l'envoi de la notification aux organisateurs:",
      error
    );
    return false;
  }
}

// Fonction pour envoyer une notification à tous les participants d'une compétition
function sendNotificationToCompetition(competitionId, notification) {
  if (!io) {
    console.warn(
      "⚠️ Socket.IO n'est pas initialisé. Impossible d'envoyer la notification."
    );
    return false;
  }

  try {
    io.to(`competition-${competitionId}`).emit("notification", notification);
    console.log(
      `📨 Notification envoyée à la compétition ${competitionId}:`,
      notification.title
    );
    return true;
  } catch (error) {
    console.error(
      `❌ Erreur lors de l'envoi de la notification à la compétition ${competitionId}:`,
      error
    );
    return false;
  }
}

// Fonction pour envoyer une mise à jour de statut à tous les participants d'une compétition
function sendStatusUpdateToCompetition(competitionId, update) {
  if (!io) {
    console.warn(
      "⚠️ Socket.IO n'est pas initialisé. Impossible d'envoyer la mise à jour."
    );
    return false;
  }

  try {
    io.to(`competition-${competitionId}`).emit("status-updated", update);
    console.log(
      `📊 Mise à jour de statut envoyée à la compétition ${competitionId}:`,
      update.newStatus
    );
    return true;
  } catch (error) {
    console.error(
      `❌ Erreur lors de l'envoi de la mise à jour à la compétition ${competitionId}:`,
      error
    );
    return false;
  }
}

module.exports = {
  initializeSocketServer,
  getSocketIO,
  sendNotificationToUser,
  sendNotificationToOrganizers,
  sendNotificationToCompetition,
  sendStatusUpdateToCompetition,
};
