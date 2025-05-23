/**
 * Service WebSocket pour les mises à jour en temps réel
 */
import { Server as SocketIOServer } from "socket.io";
import type { Server as HTTPServer } from "http";
import type { StatusUpdateResult } from "./competition-status-manager";

let io: SocketIOServer | null = null;

/**
 * Initialise le serveur WebSocket
 */
export function initializeWebSocket(server: HTTPServer): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`✅ Client connecté: ${socket.id}`);

    // Rejoindre une room spécifique à l'organisateur
    socket.on("join-organizer", (organizerId: string) => {
      socket.join(`organizer-${organizerId}`);
      console.log(`👤 Organisateur ${organizerId} rejoint la room`);
    });

    // Rejoindre une room spécifique à une compétition
    socket.on("join-competition", (competitionId: string) => {
      socket.join(`competition-${competitionId}`);
      console.log(`🏆 Client rejoint la compétition ${competitionId}`);
    });

    socket.on("disconnect", () => {
      console.log(`❌ Client déconnecté: ${socket.id}`);
    });
  });

  return io;
}

/**
 * Diffuse une mise à jour de statut à tous les clients concernés
 */
export async function broadcastStatusUpdate(
  update: StatusUpdateResult
): Promise<void> {
  if (!io) {
    console.warn("⚠️ WebSocket non initialisé");
    return;
  }

  try {
    // Diffuser à tous les clients de la compétition
    io.to(`competition-${update.competitionId}`).emit("status-updated", update);

    // Diffuser à l'organisateur (si connecté)
    // Note: Il faudrait récupérer l'organizerId depuis la base de données

    console.log(
      `📡 Mise à jour diffusée pour la compétition ${update.competitionId}`
    );
  } catch (error) {
    console.error("❌ Erreur lors de la diffusion WebSocket:", error);
  }
}

/**
 * Diffuse une notification générale
 */
export async function broadcastNotification(notification: {
  type: string;
  title: string;
  message: string;
  targetUsers?: string[];
}): Promise<void> {
  if (!io) {
    console.warn("⚠️ WebSocket non initialisé");
    return;
  }

  try {
    if (notification.targetUsers) {
      // Diffuser à des utilisateurs spécifiques
      notification.targetUsers.forEach((userId) => {
        io!.to(`organizer-${userId}`).emit("notification", notification);
      });
    } else {
      // Diffuser à tous les clients connectés
      io.emit("notification", notification);
    }

    console.log(`📢 Notification diffusée: ${notification.title}`);
  } catch (error) {
    console.error("❌ Erreur lors de la diffusion de notification:", error);
  }
}

/**
 * Obtient le nombre de clients connectés
 */
export function getConnectedClientsCount(): number {
  return io ? io.engine.clientsCount : 0;
}
