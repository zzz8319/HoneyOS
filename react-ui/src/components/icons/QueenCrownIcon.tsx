interface Props {
  size?: number
  color?: string
  className?: string
}

export function QueenCrownIcon({ size = 24, color = 'currentColor', className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {/* Crown base band */}
      <rect x="3" y="15" width="18" height="3" rx="1" />
      {/* Crown points */}
      <polyline points="3,15 3,9 7,13 12,7 17,13 21,9 21,15" />
      {/* Jewel dots */}
      <circle cx="7" cy="13" r="1" fill={color} stroke="none" />
      <circle cx="12" cy="7" r="1" fill={color} stroke="none" />
      <circle cx="17" cy="13" r="1" fill={color} stroke="none" />
    </svg>
  )
}
