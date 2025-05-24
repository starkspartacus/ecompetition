// Fonction pour émettre un événement à un utilisateur spécifique
export async function broadcastToUser(
  userId: string,
  event: string,
  data: any
) {
  try {
    // Essayer d'envoyer via l'API de broadcast si elle existe
    const broadcastUrl =
      process.env.SOCKET_BROADCAST_URL ||
      "http://localhost:3001/api/socket/broadcast";

    const response = await fetch(broadcastUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        room: `user-${userId}`,
        event: event,
        data: data,
      }),
    });

    if (!response.ok) {
      console.error(
        `Erreur lors de l'envoi de la notification WebSocket: ${response.status}`
      );
    } else {
      console.log(
        `✅ Notification WebSocket envoyée à l'utilisateur ${userId}`
      );
    }
  } catch (error) {
    console.error(
      "Erreur lors de l'envoi de la notification WebSocket:",
      error
    );
    // Ne pas faire échouer l'opération principale si le WebSocket échoue
  }
}

// Fonction pour émettre un événement à une room spécifique
export async function broadcastToRoom(room: string, event: string, data: any) {
  try {
    const broadcastUrl =
      process.env.SOCKET_BROADCAST_URL ||
      "http://localhost:3001/api/socket/broadcast";

    const response = await fetch(broadcastUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        room: room,
        event: event,
        data: data,
      }),
    });

    if (!response.ok) {
      console.error(
        `Erreur lors de l'envoi à la room ${room}: ${response.status}`
      );
    }
  } catch (error) {
    console.error("Erreur lors de l'envoi à la room:", error);
  }
}

// Fonction pour émettre un événement global
export async function broadcastGlobal(event: string, data: any) {
  return broadcastToRoom("global", event, data);
}
