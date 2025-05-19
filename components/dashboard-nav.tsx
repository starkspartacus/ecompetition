"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"

interface DashboardNavProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string | null
  }
}

export function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const isOrganizer = user.role === "ORGANIZER"
  const basePath = isOrganizer ? "/organizer" : "/participant"

  const routes = isOrganizer
    ? [
        {
          href: `${basePath}/dashboard`,
          label: "Tableau de bord",
        },
        {
          href: `${basePath}/competitions`,
          label: "Mes compétitions",
        },
        {
          href: `${basePath}/competitions/create`,
          label: "Créer une compétition",
        },
      ]
    : [
        {
          href: `${basePath}/dashboard`,
          label: "Tableau de bord",
        },
        {
          href: `${basePath}/competitions`,
          label: "Mes compétitions",
        },
        {
          href: `${basePath}/competitions/join`,
          label: "Rejoindre une compétition",
        },
        {
          href: `${basePath}/teams`,
          label: "Mes équipes",
        },
      ]

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <nav className="grid gap-6 text-lg font-medium">
                <Link href="/" className="flex items-center gap-2 text-lg font-semibold" onClick={() => setOpen(false)}>
                  e-compétition
                </Link>
                {routes.map((route) => (
                  <Link
                    key={route.href}
                    href={route.href}
                    className={`${pathname === route.href ? "text-primary" : "text-muted-foreground"}`}
                    onClick={() => setOpen(false)}
                  >
                    {route.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            e-compétition
          </Link>
          <nav className="hidden md:flex gap-6 ml-10">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={`${
                  pathname === route.href ? "text-primary font-medium" : "text-muted-foreground"
                } transition-colors hover:text-primary`}
              >
                {route.label}
              </Link>
            ))}
          </nav>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.image || ""} alt={user.name || ""} />
                <AvatarFallback>
                  {user.name
                    ? user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                    : "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })} className="cursor-pointer">
              Se déconnecter
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
