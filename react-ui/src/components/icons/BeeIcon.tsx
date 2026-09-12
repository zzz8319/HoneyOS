interface Props {
  size?: number
  color?: string
  className?: string
}

export function BeeIcon({ size = 24, color = 'currentColor', className }: Props) {
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
      {/* Body (abdomen) */}
      <ellipse cx="12" cy="14" rx="4" ry="5.5" />
      {/* Stripes on abdomen */}
      <line x1="8.2" y1="12.5" x2="15.8" y2="12.5" />
      <line x1="8.0" y1="15.0" x2="16.0" y2="15.0" />
      <line x1="8.2" y1="17.5" x2="15.8" y2="17.5" />
      {/* Thorax */}
      <ellipse cx="12" cy="9" rx="2.5" ry="2" />
      {/* Head */}
      <circle cx="12" cy="6" r="1.5" />
      {/* Left wing */}
      <path d="M9.5 8.5 C7 6 5.5 5 6.5 3.5 C7.5 2 9 3 9.5 5" />
      {/* Right wing */}
      <path d="M14.5 8.5 C17 6 18.5 5 17.5 3.5 C16.5 2 15 3 14.5 5" />
      {/* Antennae */}
      <line x1="11" y1="4.5" x2="9.5" y2="2.5" />
      <line x1="13" y1="4.5" x2="14.5" y2="2.5" />
      <circle cx="9.2" cy="2.2" r="0.4" fill={color} stroke="none" />
      <circle cx="14.8" cy="2.2" r="0.4" fill={color} stroke="none" />
    </svg>
  )
}
