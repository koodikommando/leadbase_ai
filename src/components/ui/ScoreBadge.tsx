'use client'

import { useEffect, useState } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import type { IcpFit } from '@/lib/types/lead'

interface ScoreBadgeProps {
  score: number
  icpFit?: IcpFit
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_MAP = {
  sm: { outer: 48, inner: 36, fontSize: 11, strokeWidth: 2 },
  md: { outer: 64, inner: 50, fontSize: 18, strokeWidth: 3 },
  lg: { outer: 80, inner: 62, fontSize: 18, strokeWidth: 3 },
}

function scoreToColor(score: number): string {
  if (score >= 75) return 'var(--accent)'
  if (score >= 50) return 'var(--warning)'
  return 'var(--danger)'
}

function scoreToGlow(score: number): string {
  if (score >= 75) return '0 0 8px rgba(200,255,0,0.6), 0 0 20px rgba(200,255,0,0.2)'
  if (score >= 50) return '0 0 8px rgba(255,170,0,0.5)'
  return '0 0 8px rgba(255,68,68,0.4)'
}

export default function ScoreBadge({ score, icpFit, size = 'md' }: ScoreBadgeProps) {
  const { outer, fontSize, strokeWidth } = SIZE_MAP[size]
  const radius = (outer - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  const count = useMotionValue(0)
  const [displayScore, setDisplayScore] = useState(0)

  useEffect(() => {
    const controls = animate(count, score, {
      duration: 0.8,
      ease: [0.25, 0, 0, 1],
      onUpdate: (v) => setDisplayScore(Math.round(v)),
    })
    return controls.stop
  }, [score, count])

  const progress = useTransform(count, (v) => {
    const pct = v / 100
    return circumference - pct * circumference
  })

  const color = scoreToColor(score)
  const glow = scoreToGlow(score)

  return (
    <div
      className="flex flex-col items-center gap-1"
      title={`Score: ${score}/100`}
    >
      <div style={{ position: 'relative', width: outer, height: outer }}>
        {/* Background ring */}
        <svg
          width={outer}
          height={outer}
          style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}
        >
          <circle
            cx={outer / 2}
            cy={outer / 2}
            r={radius}
            fill="none"
            stroke="var(--bg-elevated)"
            strokeWidth={strokeWidth}
          />
        </svg>

        {/* Progress ring */}
        <svg
          width={outer}
          height={outer}
          style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}
        >
          <motion.circle
            cx={outer / 2}
            cy={outer / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
            strokeDasharray={circumference}
            strokeDashoffset={progress}
            style={{ filter: `drop-shadow(${glow})` }}
          />
        </svg>

        {/* Score number */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize,
            fontWeight: 700,
            color,
            textShadow: glow,
          }}
        >
          {displayScore}
        </div>
      </div>

      {icpFit && <IcpPill fit={icpFit} />}
    </div>
  )
}

function IcpPill({ fit }: { fit: IcpFit }) {
  const colorMap: Record<IcpFit, string> = {
    high: 'var(--accent)',
    medium: 'var(--warning)',
    low: 'var(--danger)',
  }
  return (
    <span
      className="text-xs px-2 py-0.5"
      style={{
        fontFamily: "'DM Mono', monospace",
        color: colorMap[fit],
        borderLeft: `2px solid ${colorMap[fit]}`,
        paddingLeft: '6px',
        letterSpacing: '0.05em',
      }}
    >
      {fit.toUpperCase()}
    </span>
  )
}
