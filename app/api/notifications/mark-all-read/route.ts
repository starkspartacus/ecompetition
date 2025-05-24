import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { markAllNotificationsAsRead } from "@/lib/notification-service";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const result = await markAllNotificationsAsRead(session.user.id);

    if (!result.success) {
      return NextResponse.json(
        { error: "Erreur lors du marquage des notifications" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur lors du marquage des notifications:", error);
    return NextResponse.json(
      { error: "Erreur lors du marquage des notifications" },
      { status: 500 }
    );
  }
}
