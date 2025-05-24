import { type NextRequest, NextResponse } from "next/server";
import { Server as SocketIOServer } from "socket.io";
import { createServer } from "http";

// Global variable to store the Socket.IO server instance
let io: SocketIOServer | null = null;

// Initialize Socket.IO server if it doesn't exist
function getSocketIOServer() {
  if (!io) {
    // Create a minimal HTTP server
    const httpServer = createServer();

    // Create a new Socket.IO server
    io = new SocketIOServer(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    // Start listening on a port
    const port = Number.parseInt(process.env.SOCKET_PORT || "3001", 10);
    httpServer.listen(port, () => {
      console.log(`Socket.IO server listening on port ${port}`);
    });
  }

  return io;
}

export async function POST(request: NextRequest) {
  try {
    // Get request body
    const body = await request.json();
    const { room, event, data } = body;

    if (!room || !event) {
      return NextResponse.json(
        { error: "Room and event are required" },
        { status: 400 }
      );
    }

    // Get Socket.IO server
    const io = getSocketIOServer();

    // Broadcast to the room
    io.to(room).emit(event, data);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error broadcasting message:", error);
    return NextResponse.json(
      { error: "Failed to broadcast message" },
      { status: 500 }
    );
  }
}
