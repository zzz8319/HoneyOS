interface Props {
  size?: number
  color?: string
  className?: string
}

/* Front-facing stacked hive boxes (Langstroth): lid + 3 supers + bottom board */
export function HiveStackIcon({ size = 24, color = 'currentColor', className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      {/* Lid (slightly wider, thin) */}
      <rect x="3" y="2.5" width="18" height="2.5" rx="0.8" fill={color} opacity="0.55" />
      {/* Top super */}
      <rect x="4" y="6" width="16" height="4" rx="0.5" fill={color} opacity="0.85" />
      {/* Middle super */}
      <rect x="4" y="11" width="16" height="4" rx="0.5" fill={color} opacity="0.7" />
      {/* Bottom super */}
      <rect x="4" y="16" width="16" height="4" rx="0.5" fill={color} opacity="0.55" />
      {/* Bottom board (slightly wider) */}
      <rect x="3" y="21" width="18" height="1.5" rx="0.4" fill={color} opacity="0.4" />
    </svg>
  )
}
