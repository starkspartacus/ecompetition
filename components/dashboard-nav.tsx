"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Bell,
  Home,
  Calendar,
  Trophy,
  Settings,
  LogOut,
  User,
  Users,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DashboardNavProps {
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
}

export function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  // Utiliser une valeur par défaut si role n'est pas défini
  const userRole = user?.role || "PARTICIPANT";
  const isOrganizer = userRole === "ORGANIZER";
  const basePath = isOrganizer ? "/organizer" : "/participant";

  const routes = [
    {
      label: "Tableau de bord",
      href: `${basePath}/dashboard`,
      icon: <Home size={20} />,
      active: pathname === `${basePath}/dashboard`,
    },
    ...(isOrganizer
      ? [
          {
            label: "Compétitions",
            href: `${basePath}/competitions`,
            icon: <Trophy size={20} />,
            active: pathname?.includes(`${basePath}/competitions`),
          },
          {
            label: "Participants",
            href: `${basePath}/participants`,
            icon: <Users size={20} />,
            active: pathname?.includes(`${basePath}/participants`),
          },
        ]
      : [
          {
            label: "Compétitions",
            href: `${basePath}/competitions/browse`,
            icon: <Trophy size={20} />,
            active: pathname?.includes(`${basePath}/competitions`),
          },
          {
            label: "Mes équipes",
            href: `${basePath}/teams`,
            icon: <Users size={20} />,
            active: pathname?.includes(`${basePath}/teams`),
          },
        ]),
    {
      label: "Calendrier",
      href: `${basePath}/calendar`,
      icon: <Calendar size={20} />,
      active: pathname?.includes(`${basePath}/calendar`),
    },
    {
      label: "Paramètres",
      href: `${basePath}/settings`,
      icon: <Settings size={20} />,
      active: pathname?.includes(`${basePath}/settings`),
    },
  ];

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white/80 px-4 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/80">
      <div className="flex items-center gap-2">
        <Link href="/" className="flex items-center">
          <h1 className="text-xl font-bold text-primary">E-Compétition</h1>
        </Link>
      </div>

      {/* Navigation principale - Desktop */}
      <nav className="hidden md:block">
        <ul className="flex items-center space-x-1">
          {routes.map((route, index) => (
            <li key={index}>
              <Link href={route.href}>
                <Button
                  variant={route.active ? "default" : "ghost"}
                  size="sm"
                  className="flex items-center gap-1"
                >
                  {route.icon}
                  <span>{route.label}</span>
                </Button>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Actions et profil */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (notificationCount > 0) setNotificationCount(0);
            }}
            className="relative"
            aria-label="Notifications"
          >
            <Bell size={20} />
            {notificationCount > 0 && (
              <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                {notificationCount}
              </span>
            )}
          </Button>

          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 rounded-lg border bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-2 font-semibold">Notifications</h3>
              <div className="space-y-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Aucune nouvelle notification
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Profil utilisateur */}
        {user && (
          <div className="relative group">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
            >
              <div className="h-8 w-8 overflow-hidden rounded-full bg-primary/10">
                {user.image ? (
                  <img
                    src={user.image || "/placeholder.svg"}
                    alt={user.name || "Avatar"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-primary/20 text-xs font-bold uppercase text-primary">
                    {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
                  </div>
                )}
              </div>
              <span className="hidden text-sm md:block">
                {user.name || user.email}
              </span>
              <ChevronDown size={16} />
            </Button>

            {/* Menu déroulant utilisateur */}
            <div className="absolute right-0 top-full mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800 hidden group-hover:block">
              <div className="py-1">
                <Link
                  href={`${basePath}/profile`}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  <User className="mr-2 h-4 w-4" />
                  Profil
                </Link>
                <Link
                  href={`${basePath}/settings`}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Paramètres
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Déconnexion
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bouton menu mobile */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </div>

      {/* Menu mobile */}
      {open && (
        <div className="absolute left-0 right-0 top-16 z-50 bg-white p-4 shadow-md dark:bg-gray-900 md:hidden">
          <nav>
            <ul className="space-y-2">
              {routes.map((route, index) => (
                <li key={index}>
                  <Link
                    href={route.href}
                    className={cn(
                      "flex items-center rounded-md px-3 py-2 text-sm font-medium",
                      route.active
                        ? "bg-primary text-white"
                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                    )}
                    onClick={() => setOpen(false)}
                  >
                    {route.icon}
                    <span className="ml-2">{route.label}</span>
                  </Link>
                </li>
              ))}
              <li>
                <button
                  onClick={() => {
                    setOpen(false);
                    signOut({ callbackUrl: "/" });
                  }}
                  className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  <LogOut size={20} />
                  <span className="ml-2">Déconnexion</span>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
}
