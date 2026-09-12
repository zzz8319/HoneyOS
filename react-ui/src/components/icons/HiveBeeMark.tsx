interface Props {
  size?: number
  color?: string
  className?: string
}

export function HiveBeeMark({ size = 22, color = '#3D4551', className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 22 22"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      {/* Wings — translucent fill */}
      <ellipse cx="7"  cy="7.5" rx="3.5" ry="2"   fill={color} opacity="0.22" />
      <ellipse cx="15" cy="7.5" rx="3.5" ry="2"   fill={color} opacity="0.22" />
      <ellipse cx="6.5" cy="10" rx="2.8" ry="1.5" fill={color} opacity="0.15" />
      <ellipse cx="15.5" cy="10" rx="2.8" ry="1.5" fill={color} opacity="0.15" />

      {/* Head */}
      <circle cx="11" cy="4.5" r="2" fill={color} />

      {/* Antennae */}
      <line x1="10" y1="3"   x2="8.5"  y2="1.5" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="12" y1="3"   x2="13.5" y2="1.5" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="8.2"  cy="1.3" r="0.8" fill={color} />
      <circle cx="13.8" cy="1.3" r="0.8" fill={color} />

      {/* Body (abdomen) — filled rounded rect */}
      <rect x="7.5" y="7" width="7" height="10" rx="3.5" fill={color} />

      {/* Stripes — white cutouts */}
      <rect x="7.5" y="10"  width="7" height="1.5" rx="0.3" fill="white" />
      <rect x="7.5" y="13"  width="7" height="1.5" rx="0.3" fill="white" />

      {/* Thorax connector */}
      <rect x="9" y="6.5" width="4" height="2" rx="1" fill={color} />
    </svg>
  )
}
