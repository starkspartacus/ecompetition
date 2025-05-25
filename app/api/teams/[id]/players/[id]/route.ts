import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "PARTICIPANT") {
      return NextResponse.json(
        {
          error:
            "Non autorisé. Seuls les participants peuvent modifier des joueurs.",
        },
        { status: 403 }
      );
    }

    const { id: playerId } = await params;
    const body = await request.json();
    const { name, age, position, number, photoUrl } = body;

    const db = await getDb();

    // Récupérer le joueur et vérifier les autorisations
    const player = await db
      .collection("Player")
      .findOne({ _id: new ObjectId(playerId) });

    if (!player) {
      return NextResponse.json({ error: "Joueur non trouvé" }, { status: 404 });
    }

    const team = await db
      .collection("Team")
      .findOne({ _id: new ObjectId(player.teamId) });

    if (!team || team.ownerId.toString() !== session.user.id) {
      return NextResponse.json(
        { error: "Vous n'êtes pas autorisé à modifier ce joueur" },
        { status: 403 }
      );
    }

    // Vérifier que le nouveau numéro n'est pas déjà pris (si changé)
    if (number && number !== player.number) {
      const numberExists = await db.collection("Player").findOne({
        teamId: player.teamId,
        number: Number.parseInt(number),
        _id: { $ne: new ObjectId(playerId) },
      });

      if (numberExists) {
        return NextResponse.json(
          { error: "Ce numéro est déjà pris dans cette équipe" },
          { status: 400 }
        );
      }
    }

    // Mettre à jour le joueur
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (name) updateData.name = name;
    if (age) updateData.age = Number.parseInt(age);
    if (position !== undefined) updateData.position = position;
    if (number !== undefined)
      updateData.number = number ? Number.parseInt(number) : null;
    if (photoUrl !== undefined) updateData.photoUrl = photoUrl;

    await db
      .collection("Player")
      .updateOne({ _id: new ObjectId(playerId) }, { $set: updateData });

    console.log("✅ Joueur mis à jour:", playerId);

    return NextResponse.json({
      success: true,
      message: "Joueur mis à jour avec succès",
    });
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour du joueur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du joueur" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "PARTICIPANT") {
      return NextResponse.json(
        {
          error:
            "Non autorisé. Seuls les participants peuvent supprimer des joueurs.",
        },
        { status: 403 }
      );
    }

    const { id: playerId } = await params;

    const db = await getDb();

    // Récupérer le joueur et vérifier les autorisations
    const player = await db
      .collection("Player")
      .findOne({ _id: new ObjectId(playerId) });

    if (!player) {
      return NextResponse.json({ error: "Joueur non trouvé" }, { status: 404 });
    }

    const team = await db
      .collection("Team")
      .findOne({ _id: new ObjectId(player.teamId) });

    if (!team || team.ownerId.toString() !== session.user.id) {
      return NextResponse.json(
        { error: "Vous n'êtes pas autorisé à supprimer ce joueur" },
        { status: 403 }
      );
    }

    // Supprimer le joueur
    await db.collection("Player").deleteOne({ _id: new ObjectId(playerId) });

    console.log("✅ Joueur supprimé:", playerId);

    return NextResponse.json({
      success: true,
      message: "Joueur supprimé avec succès",
    });
  } catch (error) {
    console.error("❌ Erreur lors de la suppression du joueur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du joueur" },
      { status: 500 }
    );
  }
}
