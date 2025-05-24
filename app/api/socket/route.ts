import type { Server as SocketIOServer } from "socket.io";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Store the io instance
const io: SocketIOServer | null = null;

// Store connected users
interface ConnectedUser {
  userId: string;
  socketId: string;
  role: string;
  rooms: string[];
  lastActivity: Date;
}

const connectedUsers: ConnectedUser[] = [];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // For debugging
    console.log(
      "Socket API route called, session:",
      session ? "authenticated" : "unauthenticated"
    );

    // Return success response
    return new NextResponse(
      JSON.stringify({
        success: true,
        message: "WebSocket server is available",
        authenticated: !!session,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in socket API route:", error);
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "Error checking WebSocket server",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}

// This is a workaround for Socket.IO with Next.js App Router
// The actual Socket.IO server is initialized in a custom server.js file
export const dynamic = "force-dynamic";
