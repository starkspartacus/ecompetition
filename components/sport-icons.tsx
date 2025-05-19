"use client";

import type React from "react";
import { motion, type SVGMotionProps } from "framer-motion";

export function FootballIcon({
  className = "h-6 w-6",
  ...props
}: SVGMotionProps<SVGSVGElement>) {
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20z" />
      <path d="M12 7v4l3 3" />
      <path d="m8 2 4 10 10 4" />
      <path d="M2 8 12 12 16 22" />
      <path d="m22 16-10 4-4 10" />
      <path d="M16 2 12 12 2 16" />
    </motion.svg>
  );
}

export function BasketballIcon({
  className = "h-6 w-6",
  ...props
}: SVGMotionProps<SVGSVGElement>) {
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M4.93 4.93 19.07 19.07" />
      <path d="M11.94 2.05A10 10 0 0 1 19.66 11" />
      <path d="M12 2a10 10 0 0 0-8.48 15.06" />
      <path d="M12 12 2.05 11.94" />
      <path d="M19.07 4.93 4.93 19.07" />
      <path d="M15.23 15.23a10 10 0 0 0 6.72-6.72" />
      <path d="M8.77 8.77a10 10 0 0 0-6.72 6.72" />
    </motion.svg>
  );
}

export function VolleyballIcon({
  className = "h-6 w-6",
  ...props
}: SVGMotionProps<SVGSVGElement>) {
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a10 10 0 0 0-6.88 2.77L12 12l6.88-7.23A10 10 0 0 0 12 2Z" />
      <path d="m2.77 5.12 7.23 6.88v10a10 10 0 0 0 10-10 10 10 0 0 0-10-10v10l7.23-6.88" />
    </motion.svg>
  );
}

export function TennisIcon({
  className = "h-6 w-6",
  ...props
}: SVGMotionProps<SVGSVGElement>) {
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M18.09 7.5A10 10 0 0 1 12 22a10 10 0 0 1-6.09-14.5" />
      <path d="M12 2a10 10 0 0 1 6.09 14.5A10 10 0 0 1 5.91 7.5" />
    </motion.svg>
  );
}
