interface Props {
  size?: number
  color?: string
  className?: string
}

/* Apiary / beehive-barn icon: peaked roof + 3-stack hive boxes */
export function ApiaryFarmIcon({ size = 22, color = 'currentColor', className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      {/* Peaked roof */}
      <path
        d="M2.5 10.5L12 3L21.5 10.5"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Top box */}
      <rect x="5" y="10.5" width="14" height="3.5" rx="0.5" fill={color} opacity="0.9" />
      {/* Middle box */}
      <rect x="4.5" y="14.5" width="15" height="3.5" rx="0.5" fill={color} opacity="0.75" />
      {/* Bottom box */}
      <rect x="4" y="18.5" width="16" height="3" rx="0.5" fill={color} opacity="0.6" />
    </svg>
  )
}
