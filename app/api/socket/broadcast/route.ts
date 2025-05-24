import { type NextRequest, NextResponse } from "next/server";
import { Server as SocketIOServer } from "socket.io";
import { createServer } from "http";

// Variable globale pour stocker l'instance du serveur Socket.IO
let io: SocketIOServer | null = null;

// Initialiser le serveur Socket.IO s'il n'existe pas
function getSocketIOServer() {
  if (!io) {
    // Créer un serveur HTTP minimal
    const httpServer = createServer();

    // Créer un nouveau serveur Socket.IO
    io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ["websocket", "polling"],
    });

    // Gérer les connexions
    io.on("connection", (socket) => {
      console.log(`✅ Utilisateur connecté: ${socket.id}`);

      // Rejoindre une room spécifique à l'utilisateur
      socket.on("join-user-room", (userId: string) => {
        socket.join(`user-${userId}`);
        console.log(`👤 Utilisateur ${userId} a rejoint sa room`);
      });

      // Gérer la déconnexion
      socket.on("disconnect", () => {
        console.log(`❌ Utilisateur déconnecté: ${socket.id}`);
      });
    });

    // Démarrer l'écoute sur un port
    const port = Number.parseInt(process.env.SOCKET_PORT || "3001", 10);
    httpServer.listen(port, () => {
      console.log(`🚀 Serveur Socket.IO en écoute sur le port ${port}`);
    });
  }

  return io;
}

export async function POST(request: NextRequest) {
  try {
    // Récupérer le corps de la requête
    const body = await request.json();
    const { event, userId, data } = body;

    if (!event || !userId) {
      return NextResponse.json(
        { error: "Les paramètres event et userId sont requis" },
        { status: 400 }
      );
    }

    // Obtenir le serveur Socket.IO
    const socketServer = getSocketIOServer();

    // Envoyer la notification à la room de l'utilisateur
    const room = `user-${userId}`;
    socketServer.to(room).emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });

    console.log(`📡 Notification envoyée à la room ${room}:`, { event, data });

    return NextResponse.json({
      success: true,
      message: "Notification envoyée avec succès",
      room,
      event,
    });
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi de la notification:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi de la notification" },
      { status: 500 }
    );
  }
}

// Endpoint pour obtenir le statut du serveur WebSocket
export async function GET() {
  try {
    const socketServer = getSocketIOServer();
    const connectedClients = socketServer.engine.clientsCount;

    return NextResponse.json({
      status: "active",
      connectedClients,
      port: process.env.SOCKET_PORT || "3001",
    });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération du statut:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du statut" },
      { status: 500 }
    );
  }
}
