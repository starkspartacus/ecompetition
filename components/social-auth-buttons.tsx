"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";

interface SocialAuthButtonProps {
  provider: string;
  text: string;
  icon: React.ReactNode;
  disabled?: boolean;
  callbackUrl?: string;
  className?: string;
}

export function SocialAuthButton({
  provider,
  text,
  icon,
  disabled = false,
  callbackUrl = "/",
  className,
}: SocialAuthButtonProps) {
  return (
    <Button
      variant="outline"
      className={className}
      disabled={disabled}
      onClick={() => {
        if (!disabled) {
          signIn(provider, { callbackUrl });
        }
      }}
    >
      {icon}
      {text}
    </Button>
  );
}

export function GoogleButton({ callbackUrl = "/" }: { callbackUrl?: string }) {
  return (
    <SocialAuthButton
      provider="google"
      text="Continuer avec Google"
      callbackUrl={callbackUrl}
      className="w-full bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center justify-center gap-3 h-11"
      icon={
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
      }
    />
  );
}

export function FacebookButton({
  callbackUrl = "/",
  disabled = true,
}: {
  callbackUrl?: string;
  disabled?: boolean;
}) {
  return (
    <SocialAuthButton
      provider="facebook"
      text="Continuer avec Facebook"
      callbackUrl={callbackUrl}
      disabled={disabled}
      className={`w-full bg-[#1877F2] text-white hover:bg-[#166FE5] transition-all flex items-center justify-center gap-3 h-11 ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
      icon={
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
          <path d="M9.198 21.5h4v-8.01h3.604l.396-3.98h-4V7.5a1 1 0 0 1 1-1h3v-4h-3a5 5 0 0 0-5 5v2.01h-2l-.396 3.98h2.396v8.01Z" />
        </svg>
      }
    />
  );
}

export function AppleButton({
  callbackUrl = "/",
  disabled = true,
}: {
  callbackUrl?: string;
  disabled?: boolean;
}) {
  return (
    <SocialAuthButton
      provider="apple"
      text="Continuer avec Apple"
      callbackUrl={callbackUrl}
      disabled={disabled}
      className={`w-full bg-black text-white hover:bg-gray-900 transition-all flex items-center justify-center gap-3 h-11 ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
      icon={
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
          <path d="M11.624 7.222c-.876 0-2.232-.996-3.66-.96-1.884.024-3.612 1.092-4.584 2.784-1.956 3.396-.504 8.412 1.404 11.172.936 1.344 2.04 2.856 3.504 2.808 1.404-.06 1.932-.9 3.636-.9 1.692 0 2.172.9 3.66.876 1.512-.024 2.472-1.368 3.396-2.724 1.068-1.56 1.512-3.072 1.536-3.156-.036-.012-2.94-1.128-2.976-4.488-.024-2.808 2.292-4.152 2.4-4.212-1.32-1.932-3.348-2.148-4.056-2.196-1.848-.144-3.396 1.008-4.26 1.008zm3.12-2.832c.78-.936 1.296-2.244 1.152-3.54-1.116.048-2.46.744-3.264 1.68-.72.828-1.344 2.16-1.176 3.42 1.236.096 2.508-.636 3.288-1.56z" />
        </svg>
      }
    />
  );
}

export function SocialAuthDivider() {
  return (
    <div className="relative my-2">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-gray-300"></span>
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-white dark:bg-gray-900/90 px-2 text-muted-foreground">
          Autres options
        </span>
      </div>
    </div>
  );
}
