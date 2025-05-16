"use client"

import { cn } from "@/lib/utils"

interface GradientAnimationProps {
  className?: string
  colors?: string[]
  duration?: number
  size?: number
  blur?: number
  opacity?: number
}

export function GradientAnimation({
  className,
  colors = ["#ff0000", "#00ff00", "#0000ff"],
  duration = 15,
  size = 80,
  blur = 60,
  opacity = 0.15,
}: GradientAnimationProps) {
  return (
    <div
      className={cn(
        "fixed inset-0 -z-10 h-full w-full overflow-hidden",
        className
      )}
    >
      <div
        className="absolute inset-0 h-full w-full"
        style={{
          background: `radial-gradient(circle at center, ${colors.join(", ")})`,
          filter: `blur(${blur}px)`,
          opacity,
          animation: `gradient ${duration}s ease infinite`,
        }}
      />
      <style jsx>{`
        @keyframes gradient {
          0% {
            transform: rotate(0deg) scale(1);
          }
          50% {
            transform: rotate(180deg) scale(1.2);
          }
          100% {
            transform: rotate(360deg) scale(1);
          }
        }
      `}</style>
    </div>
  )
} 