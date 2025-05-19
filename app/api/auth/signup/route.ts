import { NextResponse } from "next/server";
import { hash } from "bcrypt";
import prisma from "@/lib/prisma";
import { MongoClient, ObjectId } from "mongodb";

// Connexion directe à MongoDB
const mongoClient = new MongoClient(process.env.DATABASE_URL || "");

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      firstName,
      lastName,
      email,
      password,
      dateOfBirth,
      country,
      city,
      commune,
      address,
      photoUrl,
      role,
      competitionCategory,
      phoneNumber,
      phoneCountryCode,
    } = body;

    // Vérifier si l'email existe déjà
    const existingUser = await prisma?.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Cet email est déjà utilisé" },
        { status: 400 }
      );
    }

    // Vérifier si le numéro de téléphone existe déjà (s'il est fourni)
    if (phoneNumber) {
      const existingPhoneUser = await prisma?.user.findFirst({
        where: {
          phoneNumber,
        },
      });

      if (existingPhoneUser) {
        return NextResponse.json(
          { message: "Ce numéro de téléphone est déjà utilisé" },
          { status: 400 }
        );
      }
    }

    // Hacher le mot de passe
    const hashedPassword = await hash(password, 10);

    // Créer l'utilisateur directement avec MongoDB
    await mongoClient.connect();
    const db = mongoClient.db();
    const usersCollection = db.collection("User");

    const userId = new ObjectId();

    const userData = {
      _id: userId,
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phoneNumber,
      phoneCountryCode,
      countryCode: country,
      dateOfBirth: new Date(dateOfBirth),
      city,
      commune,
      address,
      photoUrl,
      role,
      competitionCategory: role === "ORGANIZER" ? competitionCategory : null,
      createdAt: new Date(),
      updatedAt: new Date(),
      isVerified: false,
    };

    await usersCollection.insertOne(userData);

    // Fermer la connexion
    await mongoClient.close();

    return NextResponse.json(
      {
        message: "Utilisateur créé avec succès",
        user: {
          id: userId.toString(),
          email,
          role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur lors de l'inscription:", error);
    return NextResponse.json(
      { message: "Une erreur est survenue lors de l'inscription" },
      { status: 500 }
    );
  }
}
