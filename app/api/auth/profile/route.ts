import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getDb, toObjectId } from "@/lib/mongodb";

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      countryCode,
      address,
      city,
      commune,
      bio,
      competitionCategory,
      photoUrl,
    } = body;

    // Vérifier si l'email existe déjà pour un autre utilisateur
    if (email !== session.user.email) {
      const existingUser = await prisma?.user.findUnique({
        where: {
          email,
        },
      });

      if (existingUser && existingUser.id !== session.user.id) {
        return NextResponse.json(
          { message: "Cet email est déjà utilisé par un autre utilisateur" },
          { status: 400 }
        );
      }
    }

    try {
      // Utiliser directement MongoDB pour éviter les problèmes de transaction
      const db = await getDb();
      const usersCollection = db.collection("User");

      // Mettre à jour le profil de l'utilisateur
      const result = await usersCollection.updateOne(
        { _id: toObjectId(session.user.id) },
        {
          $set: {
            firstName,
            lastName,
            email,
            phoneNumber,
            countryCode,
            address,
            city,
            commune,
            bio,
            competitionCategory:
              session.user.role === "ORGANIZER"
                ? competitionCategory
                : undefined,
            photoUrl,
            updatedAt: new Date(),
          },
        }
      );

      if (result.acknowledged) {
        // Récupérer l'utilisateur mis à jour
        const updatedUser = await usersCollection.findOne({
          _id: toObjectId(session.user.id),
        });

        return NextResponse.json({
          message: "Profil mis à jour avec succès",
          user: {
            id: updatedUser?._id.toString(),
            email: updatedUser?.email,
            firstName: updatedUser?.firstName,
            lastName: updatedUser?.lastName,
            role: updatedUser?.role,
          },
        });
      } else {
        throw new Error("Échec de la mise à jour du profil");
      }
    } catch (error) {
      console.error("Erreur MongoDB lors de la mise à jour du profil:", error);

      // Fallback à Prisma si MongoDB échoue
      const updatedUser = await prisma?.user.update({
        where: {
          id: session.user.id,
        },
        data: {
          firstName,
          lastName,
          email,
          phoneNumber,
          countryCode,
          address,
          city,
          commune,
          bio,
          competitionCategory:
            session.user.role === "ORGANIZER" ? competitionCategory : undefined,
          photoUrl,
        },
      });

      return NextResponse.json({
        message: "Profil mis à jour avec succès",
        user: {
          id: updatedUser?.id,
          email: updatedUser?.email,
          firstName: updatedUser?.firstName,
          lastName: updatedUser?.lastName,
          role: updatedUser?.role,
        },
      });
    }
  } catch (error) {
    console.error("Erreur lors de la mise à jour du profil:", error);
    return NextResponse.json(
      { message: "Une erreur est survenue lors de la mise à jour du profil" },
      { status: 500 }
    );
  }
}
