import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 })
    }

    if (session.user.role !== "PARTICIPANT") {
      return NextResponse.json(
        { message: "Seuls les participants peuvent rejoindre des compétitions" },
        { status: 403 },
      )
    }

    const body = await req.json()
    const { competitionId } = body

    // Vérifier si la compétition existe
    const competition = await prisma.competition.findUnique({
      where: {
        id: competitionId,
      },
    })

    if (!competition) {
      return NextResponse.json({ message: "Compétition non trouvée" }, { status: 404 })
    }

    // Vérifier si la date limite d'inscription est dépassée
    if (new Date() > new Date(competition.registrationDeadline)) {
      return NextResponse.json({ message: "La date limite d'inscription est dépassée" }, { status: 400 })
    }

    // Vérifier si le participant a déjà fait une demande
    const existingParticipation = await prisma.participation.findFirst({
      where: {
        competitionId,
        participantId: session.user.id,
      },
    })

    if (existingParticipation) {
      return NextResponse.json({ message: "Vous avez déjà fait une demande pour cette compétition" }, { status: 400 })
    }

    // Créer la demande de participation
    const participation = await prisma.participation.create({
      data: {
        competitionId,
        participantId: session.user.id,
        status: "PENDING",
      },
    })

    return NextResponse.json(
      {
        message: "Demande de participation envoyée avec succès",
        participation,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Erreur lors de la demande de participation:", error)
    return NextResponse.json(
      { message: "Une erreur est survenue lors de la demande de participation" },
      { status: 500 },
    )
  }
}
