interface Props {
  size?: number
  color?: string
  className?: string
}

export function QueenMark({ size = 22, color = '#3D4551', className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 22 22"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      {/* Crown shape — filled, 3 peaks */}
      <path
        d="M3 17 L3 10 L7 14 L11 6 L15 14 L19 10 L19 17 Z"
        fill={color}
      />
      {/* Base band */}
      <rect x="3" y="16" width="16" height="3" rx="1" fill={color} />
      {/* Jewel highlights */}
      <circle cx="7"  cy="14" r="1.2" fill="white" opacity="0.7" />
      <circle cx="11" cy="7"  r="1.2" fill="white" opacity="0.7" />
      <circle cx="15" cy="14" r="1.2" fill="white" opacity="0.7" />
    </svg>
  )
}
