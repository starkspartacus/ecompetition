import type React from "react";
import { cn } from "@/lib/utils";

interface ShellProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Shell({ children, className, ...props }: ShellProps) {
  return (
    <div className={cn("grid items-start gap-8", className)} {...props}>
      {children}
    </div>
  );
}

interface PageHeaderProps {
  heading: string;
  text?: string;
  children?: React.ReactNode;
}

export function PageHeader({ heading, text, children }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="grid gap-1">
        <h1 className="font-heading text-3xl md:text-4xl">{heading}</h1>
        {text && <p className="text-lg text-muted-foreground">{text}</p>}
      </div>
      {children}
    </div>
  );
}

interface DashboardShellProps extends ShellProps {
  header?: React.ReactNode;
}

export function DashboardShell({
  children,
  header,
  className,
  ...props
}: DashboardShellProps) {
  return (
    <Shell className={cn("gap-8", className)} {...props}>
      {header}
      <div className="grid gap-8">{children}</div>
    </Shell>
  );
}
