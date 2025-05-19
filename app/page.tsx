import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

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
      <header className="px-4 lg:px-6 h-16 flex items-center justify-between border-b">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          e-compétition
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/signin">
            <Button variant="ghost">Se connecter</Button>
          </Link>
          <Link href="/signup">
            <Button>S'inscrire</Button>
          </Link>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-b from-white to-gray-100 dark:from-gray-900 dark:to-gray-800">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Organisez et participez à des compétitions sportives
                  </h1>
                  <p className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
                    e-compétition vous permet de créer, gérer et participer à
                    des tournois sportifs en quelques clics.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/signup?role=organizer">
                    <Button size="lg" className="w-full">
                      Organiser un tournoi
                    </Button>
                  </Link>
                  <Link href="/signup?role=participant">
                    <Button size="lg" variant="outline" className="w-full">
                      Participer à un tournoi
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <img
                  alt="Hero Image"
                  className="mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center sm:w-full"
                  src="/placeholder-g25x6.png"
                />
              </div>
            </div>
          </div>
        </section>
        {/* Reste du contenu de la page d'accueil... */}
      </main>
    </div>
  );
}
