const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = process.env.PORT || 3000;

// Initialize Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Store connected users
const connectedUsers = [];

app.prepare().then(() => {
  // Create HTTP server
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  });

  // Initialize Socket.IO
  const io = new Server(server, {
    cors: {
      origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Socket.IO event handlers
  io.on("connection", (socket) => {
    console.log(`✅ Client connected: ${socket.id}`);

    // Authentification de l'utilisateur
    socket.on("authenticate", (userData) => {
      try {
        if (!userData || !userData.userId) {
          console.warn(
            `⚠️ Tentative d'authentification sans userId: ${socket.id}`
          );
          return;
        }

        // Enregistrer l'utilisateur connecté
        const existingUserIndex = connectedUsers.findIndex(
          (u) => u.userId === userData.userId
        );

        if (existingUserIndex >= 0) {
          // Mettre à jour le socketId si l'utilisateur est déjà connecté
          connectedUsers[existingUserIndex].socketId = socket.id;
          connectedUsers[existingUserIndex].lastActivity = new Date();
          console.log(
            `🔄 Utilisateur reconnecté: ${userData.userId} (${userData.role}) - Socket: ${socket.id}`
          );
        } else {
          // Ajouter un nouvel utilisateur
          connectedUsers.push({
            userId: userData.userId,
            socketId: socket.id,
            role: userData.role || "PARTICIPANT",
            rooms: [],
            lastActivity: new Date(),
          });
          console.log(
            `👤 Nouvel utilisateur connecté: ${userData.userId} (${userData.role}) - Socket: ${socket.id}`
          );
        }

        // Rejoindre automatiquement la room de l'utilisateur
        socket.join(`user-${userData.userId}`);

        // Si c'est un organisateur, rejoindre la room des organisateurs
        if (userData.role === "ORGANIZER") {
          socket.join(`organizer-${userData.userId}`);
          socket.join("organizers"); // Room pour tous les organisateurs

          // Mettre à jour les rooms de l'utilisateur
          const userIndex = connectedUsers.findIndex(
            (u) => u.userId === userData.userId
          );
          if (userIndex >= 0) {
            connectedUsers[userIndex].rooms.push(
              `user-${userData.userId}`,
              `organizer-${userData.userId}`,
              "organizers"
            );
          }

          console.log(`👑 Organisateur ${userData.userId} a rejoint ses rooms`);
        }

        // Envoyer une confirmation
        socket.emit("authenticated", {
          success: true,
          userId: userData.userId,
        });
      } catch (error) {
        console.error("❌ Erreur lors de l'authentification WebSocket:", error);
        socket.emit("authenticated", {
          success: false,
          error: "Erreur d'authentification",
        });
      }
    });

    // Rejoindre une room spécifique à l'organisateur
    socket.on("join-organizer", (organizerId) => {
      if (!organizerId) return;

      socket.join(`organizer-${organizerId}`);

      // Mettre à jour les rooms de l'utilisateur
      const userIndex = connectedUsers.findIndex(
        (u) => u.socketId === socket.id
      );
      if (userIndex >= 0) {
        if (
          !connectedUsers[userIndex].rooms.includes(`organizer-${organizerId}`)
        ) {
          connectedUsers[userIndex].rooms.push(`organizer-${organizerId}`);
        }
        connectedUsers[userIndex].lastActivity = new Date();
      }

      console.log(
        `👑 Socket ${socket.id} a rejoint la room organizer-${organizerId}`
      );
    });

    // Rejoindre une room spécifique à une compétition
    socket.on("join-competition", (competitionId) => {
      if (!competitionId) return;

      socket.join(`competition-${competitionId}`);

      // Mettre à jour les rooms de l'utilisateur
      const userIndex = connectedUsers.findIndex(
        (u) => u.socketId === socket.id
      );
      if (userIndex >= 0) {
        if (
          !connectedUsers[userIndex].rooms.includes(
            `competition-${competitionId}`
          )
        ) {
          connectedUsers[userIndex].rooms.push(`competition-${competitionId}`);
        }
        connectedUsers[userIndex].lastActivity = new Date();
      }

      console.log(
        `🏆 Socket ${socket.id} a rejoint la room competition-${competitionId}`
      );
    });

    // Ping pour maintenir la connexion active
    socket.on("ping", () => {
      const userIndex = connectedUsers.findIndex(
        (u) => u.socketId === socket.id
      );
      if (userIndex >= 0) {
        connectedUsers[userIndex].lastActivity = new Date();
      }
      socket.emit("pong", { timestamp: new Date() });
    });

    socket.on("disconnect", () => {
      // Supprimer l'utilisateur de la liste des connectés
      const userIndex = connectedUsers.findIndex(
        (u) => u.socketId === socket.id
      );
      if (userIndex >= 0) {
        const userId = connectedUsers[userIndex].userId;
        connectedUsers.splice(userIndex, 1);
        console.log(
          `❌ Utilisateur déconnecté: ${userId} - Socket: ${socket.id}`
        );
      } else {
        console.log(`❌ Socket déconnecté: ${socket.id}`);
      }
    });
  });

  // Start server
  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> WebSocket server running on ws://${hostname}:${port}`);
  });
});
