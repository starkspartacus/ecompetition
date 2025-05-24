import { Server as SocketIOServer } from "socket.io";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

// Store the io instance
let io: SocketIOServer | null = null;

export async function GET(request: NextRequest) {
  if (!io) {
    // @ts-ignore - Next.js doesn't expose the HTTP server in app router
    const httpServer = (global as any).__httpServer;

    if (!httpServer) {
      return new Response("WebSocket server not initialized", { status: 500 });
    }

    io = new SocketIOServer(httpServer, {
      path: "/api/socket/io",
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
      },
    });

    io.on("connection", (socket) => {
      console.log("Client connected:", socket.id);

      socket.on("join-competition", (competitionId: string) => {
        socket.join(`competition-${competitionId}`);
        console.log(`Socket ${socket.id} joined competition ${competitionId}`);
      });

      socket.on("leave-competition", (competitionId: string) => {
        socket.leave(`competition-${competitionId}`);
        console.log(`Socket ${socket.id} left competition ${competitionId}`);
      });

      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
      });
    });

    console.log("WebSocket server initialized");
  }

  return new Response("WebSocket server is running", { status: 200 });
}

// Export the io instance for use in other API routes
export { io };
