import { Loader2 } from 'lucide-react'
import styles from './PrimaryButton.module.css'

type Variant = 'solid' | 'outline' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
  loading?: boolean
  children: React.ReactNode
}

export function PrimaryButton({
  variant = 'solid',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled,
  children,
  className,
  ...rest
}: PrimaryButtonProps) {
  const cls = [
    styles.base,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : '',
    className ?? '',
  ].filter(Boolean).join(' ')

  return (
    <button {...rest} className={cls} disabled={disabled || loading} aria-busy={loading}>
      {loading && <Loader2 size={16} className={styles.spinner} aria-hidden />}
      {children}
    </button>
  )
}
