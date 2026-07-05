// Claude-style sunburst mark. Color follows currentColor so callers set it
// via text-* classes.
export function Starburst({ size = 20, className = '' }: { size?: number; className?: string }) {
  const rays = Array.from({ length: 12 }, (_, i) => {
    const a = (i * Math.PI) / 6
    const r0 = 5
    const r1 = i % 2 === 0 ? 14 : 10.5
    return {
      x1: 16 + r0 * Math.cos(a),
      y1: 16 + r0 * Math.sin(a),
      x2: 16 + r1 * Math.cos(a),
      y2: 16 + r1 * Math.sin(a),
    }
  })

  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden>
      {rays.map((r, i) => (
        <line
          key={i}
          x1={r.x1}
          y1={r.y1}
          x2={r.x2}
          y2={r.y2}
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
        />
      ))}
    </svg>
  )
}
