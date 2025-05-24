// WebSocket service for real-time notifications
import io from "socket.io-client";

let socket: any = null;

// Initialize the WebSocket connection
export function initializeWebSocket() {
  if (typeof window === "undefined") return null;

  const socketUrl =
    process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";

  if (!socket) {
    socket = io(socketUrl, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true,
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      console.log("WebSocket connected");
    });

    socket.on("connect_error", (err: Error) => {
      console.error("WebSocket connection error:", err.message);
    });

    socket.on("disconnect", (reason: string) => {
      console.log("WebSocket disconnected:", reason);
    });
  }

  return socket;
}

// Get the WebSocket instance
export function getSocket() {
  if (typeof window === "undefined") return null;

  if (!socket) {
    return initializeWebSocket();
  }

  return socket;
}

// Join a room for a specific user
export function joinUserRoom(userId: string) {
  const socket = getSocket();
  if (!socket) return;

  socket.emit("join_user_room", { userId });
}

// Join a room for a specific organizer
export function joinOrganizerRoom(organizerId: string) {
  const socket = getSocket();
  if (!socket) return;

  socket.emit("join_organizer_room", { organizerId });
}

// Join a room for a specific competition
export function joinCompetitionRoom(competitionId: string) {
  const socket = getSocket();
  if (!socket) return;

  socket.emit("join_competition_room", { competitionId });
}

// Leave a room for a specific competition
export function leaveCompetitionRoom(competitionId: string) {
  const socket = getSocket();
  if (!socket) return;

  socket.emit("leave_competition_room", { competitionId });
}

// Broadcast a message to a specific user
export async function broadcastToUser(
  userId: string,
  event: string,
  data: any
) {
  try {
    // This function would be called from the server
    // In a real implementation, you would use a server-side socket.io instance
    // For now, we'll simulate it with a fetch request to our API
    const response = await fetch("/api/socket/broadcast", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        room: `user_${userId}`,
        event,
        data,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to broadcast: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error broadcasting to user:", error);
    throw error;
  }
}

// Broadcast a message to a specific organizer
export async function broadcastToOrganizer(
  organizerId: string,
  event: string,
  data: any
) {
  try {
    // This function would be called from the server
    // In a real implementation, you would use a server-side socket.io instance
    // For now, we'll simulate it with a fetch request to our API
    const response = await fetch("/api/socket/broadcast", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        room: `organizer_${organizerId}`,
        event,
        data,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to broadcast: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error broadcasting to organizer:", error);
    throw error;
  }
}

// Broadcast a message to a specific competition
export async function broadcastToCompetition(
  competitionId: string,
  event: string,
  data: any
) {
  try {
    // This function would be called from the server
    // In a real implementation, you would use a server-side socket.io instance
    // For now, we'll simulate it with a fetch request to our API
    const response = await fetch("/api/socket/broadcast", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        room: `competition_${competitionId}`,
        event,
        data,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to broadcast: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error broadcasting to competition:", error);
    throw error;
  }
}
