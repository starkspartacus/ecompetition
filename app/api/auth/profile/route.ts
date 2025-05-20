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
      const updateData: Record<string, any> = {
        firstName,
        lastName,
        email,
        phoneNumber,
        countryCode,
        address,
        city,
        commune,
        bio,
        updatedAt: new Date(),
      };

      // Ajouter competitionCategory seulement si l'utilisateur est un organisateur
      if (session.user.role === "ORGANIZER" && competitionCategory) {
        updateData.competitionCategory = competitionCategory;
      }

      // Ajouter photoUrl seulement si elle est fournie
      if (photoUrl) {
        updateData.photoUrl = photoUrl;
      }

      const result = await usersCollection.updateOne(
        { _id: toObjectId(session.user.id) },
        { $set: updateData }
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
      // Utiliser une approche typée pour éviter les erreurs TypeScript
      const updateData: any = {};

      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (email !== undefined) updateData.email = email;
      if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
      if (countryCode !== undefined) updateData.countryCode = countryCode;
      if (address !== undefined) updateData.address = address;
      if (city !== undefined) updateData.city = city;
      if (commune !== undefined) updateData.commune = commune;
      if (bio !== undefined) updateData.bio = bio;
      if (photoUrl !== undefined) updateData.photoUrl = photoUrl;

      // Ajouter competitionCategory seulement si l'utilisateur est un organisateur
      if (
        session.user.role === "ORGANIZER" &&
        competitionCategory !== undefined
      ) {
        updateData.competitionCategory = competitionCategory;
      }

      const updatedUser = await prisma?.user.update({
        where: {
          id: session.user.id,
        },
        data: updateData,
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
