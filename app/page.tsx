import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Trophy, Users, Calendar, Award } from "lucide-react";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    // Rediriger vers le tableau de bord approprié en fonction du rôle
    if (session.user.role === "ORGANIZER") {
      redirect("/organizer/dashboard");
    } else {
      redirect("/participant/dashboard");
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Vidéo en arrière-plan avec overlay */}
      <div className="fixed inset-0 -z-10">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          poster="/vibrant-sports-competition.png"
        >
          <source src="/sports-video-bg.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/50"></div>
      </div>

      <header className="relative z-10 px-4 lg:px-6 h-20 flex items-center justify-between border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-2xl text-white"
        >
          <Trophy className="h-8 w-8 text-primary" />
          e-compétition
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/signin">
            <Button
              variant="ghost"
              className="text-white hover:bg-white/10 hover:text-white"
            >
              Se connecter
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="bg-primary hover:bg-primary/90">
              S'inscrire
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 relative z-10 text-white">
        <section className="w-full py-20 md:py-32 lg:py-40">
          <div className="container px-4 md:px-6">
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2">
              <div className="flex flex-col justify-center space-y-6">
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none animate-fade-in">
                    Organisez et participez à des compétitions sportives
                  </h1>
                  <p className="max-w-[600px] text-white/80 md:text-xl animate-fade-in-delay">
                    e-compétition vous permet de créer, gérer et participer à
                    des tournois sportifs en quelques clics.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row animate-fade-in-delay-2">
                  <Link href="/signup?role=organizer">
                    <Button
                      size="lg"
                      className="w-full bg-primary hover:bg-primary/90"
                    >
                      Organiser un tournoi
                    </Button>
                  </Link>
                  <Link href="/signup?role=participant">
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full border-white text-white hover:bg-white/10"
                    >
                      Participer à un tournoi
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative w-full max-w-md">
                  <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-primary to-blue-600 opacity-75 blur"></div>
                  <div className="relative overflow-hidden rounded-lg bg-black/40 backdrop-blur-sm p-6 shadow-xl">
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold">Prochains tournois</h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                          <Calendar className="h-10 w-10 text-primary" />
                          <div>
                            <p className="font-medium">
                              Tournoi de Football Inter-quartiers
                            </p>
                            <p className="text-sm text-white/70">
                              Dakar, Sénégal • 15 Juin 2025
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                          <Calendar className="h-10 w-10 text-primary" />
                          <div>
                            <p className="font-medium">
                              Championnat de Basketball
                            </p>
                            <p className="text-sm text-white/70">
                              Abidjan, Côte d'Ivoire • 22 Juin 2025
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                          <Calendar className="h-10 w-10 text-primary" />
                          <div>
                            <p className="font-medium">Coupe de Volleyball</p>
                            <p className="text-sm text-white/70">
                              Paris, France • 1 Juillet 2025
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-16 bg-black/60 backdrop-blur-sm">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold">
                Pourquoi choisir e-compétition?
              </h2>
              <p className="mt-2 text-white/70">
                La plateforme idéale pour tous vos événements sportifs
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center p-6 rounded-lg bg-white/5 hover:bg-white/10 transition-all hover:scale-105">
                <Trophy className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">
                  Organisation simplifiée
                </h3>
                <p className="text-white/70">
                  Créez et gérez facilement vos compétitions avec nos outils
                  intuitifs.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-6 rounded-lg bg-white/5 hover:bg-white/10 transition-all hover:scale-105">
                <Users className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Gestion des équipes</h3>
                <p className="text-white/70">
                  Constituez vos équipes et suivez leurs performances en temps
                  réel.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-6 rounded-lg bg-white/5 hover:bg-white/10 transition-all hover:scale-105">
                <Award className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Suivi des résultats</h3>
                <p className="text-white/70">
                  Consultez les classements et statistiques de toutes vos
                  compétitions.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 py-6 border-t border-white/10 bg-black/40 backdrop-blur-sm text-white">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              <span className="font-bold">e-compétition</span>
            </div>
            <p className="text-sm text-white/70">
              © 2025 e-compétition. Tous droits réservés.
            </p>
            <div className="flex gap-4">
              <Link
                href="/terms"
                className="text-sm text-white/70 hover:text-white"
              >
                Conditions d'utilisation
              </Link>
              <Link
                href="/privacy"
                className="text-sm text-white/70 hover:text-white"
              >
                Politique de confidentialité
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
