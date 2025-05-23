"use client";

import {
  Edit,
  Calendar,
  Users,
  MapPin,
  Trophy,
  ArrowLeft,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Competition {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  maxParticipants: number;
  status: "open" | "closed" | "ongoing" | "finished";
}

const CompetitionDetailsPage = ({ params }: { params: { id: string } }) => {
  const { id } = params;
  const router = useRouter();
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompetitionDetails = async () => {
      try {
        // Replace with your actual API endpoint
        const response = await fetch(`/api/competitions/${id}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch competition: ${response.status}`);
        }
        const data = await response.json();
        setCompetition(data);
      } catch (err: any) {
        setError(err.message || "Failed to fetch competition details.");
      } finally {
        setLoading(false);
      }
    };

    fetchCompetitionDetails();
  }, [id]);

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (error) {
    return (
      <div>
        <AlertCircle className="mr-2 h-4 w-4 inline-block" />
        Erreur: {error}
      </div>
    );
  }

  if (!competition) {
    return <div>Compétition non trouvée.</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Retour
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Trophy className="h-8 w-8 text-primary" />
            {competition?.name || "Détails de la compétition"}
          </h1>
        </div>
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <Button
            variant="outline"
            onClick={() => router.push(`/organizer/competitions/${id}/edit`)}
          >
            <Edit className="mr-2 h-4 w-4" /> Modifier
          </Button>
          {/* Autres boutons existants */}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Description</h2>
          <p className="text-gray-700">{competition.description}</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Informations</h2>
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span>
              {new Date(competition.startDate).toLocaleDateString()} -{" "}
              {new Date(competition.endDate).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-4 w-4 text-gray-500" />
            <span>{competition.location}</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-gray-500" />
            <span>{competition.maxParticipants} participants maximum</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span>Status: {competition.status}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompetitionDetailsPage;
