import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { userId, event, data } = await request.json();

    if (!event || !userId) {
      return NextResponse.json(
        { error: "Les paramètres event et userId sont requis" },
        { status: 400 }
      );
    }

    // Ici, nous allons simplement simuler l'envoi d'un événement WebSocket
    // Dans un environnement de production, vous utiliseriez une connexion réelle à votre serveur Socket.IO

    // Simuler un délai pour l'envoi
    await new Promise((resolve) => setTimeout(resolve, 100));

    console.log(
      `[SOCKET EMIT] Événement "${event}" envoyé à l'utilisateur ${userId}:`,
      data
    );

    // Dans un environnement réel, vous utiliseriez quelque chose comme:
    // const io = getSocketIO();
    // io.to(`user-${userId}`).emit(event, data);

    return NextResponse.json({
      success: true,
      message: `Événement "${event}" envoyé avec succès à l'utilisateur ${userId}`,
    });
  } catch (error) {
    console.error("Erreur lors du traitement de la requête:", error);
    return NextResponse.json(
      { error: "Erreur lors du traitement de la requête" },
      { status: 500 }
    );
  }
}
