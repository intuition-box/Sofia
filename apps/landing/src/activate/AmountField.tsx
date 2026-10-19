import styles from './activate.module.css'

interface AmountFieldProps {
  label: string
  /** TRUST amount as typed, e.g. "10" or "2.5" */
  value: string
  presets: readonly string[]
  onChange: (value: string) => void
}

/** Keep digits and a single dot — no number spinner, no exponent. */
const sanitize = (raw: string) => {
  const cleaned = raw.replace(',', '.').replace(/[^0-9.]/g, '')
  const [head, ...rest] = cleaned.split('.')
  return rest.length ? `${head}.${rest.join('')}` : head
}

/** Preset bubbles + a free amount pill (no arrows). */
export function AmountField({
  label,
  value,
  presets,
  onChange,
}: AmountFieldProps) {
  const isCustom = value !== '' && !presets.includes(value)

  return (
    <div className={styles.field}>
      <span className={styles.label}>{label}</span>
      <div className={styles.row}>
        {presets.map((preset) => (
          <button
            key={preset}
            type="button"
            className={`${styles.chip} ${value === preset ? styles.chipActive : ''}`}
            onClick={() => onChange(preset)}
          >
            {preset} TRUST
          </button>
        ))}
        <label
          className={`${styles.amount} ${isCustom ? styles.amountActive : ''}`}
        >
          <input
            className={styles.amountInput}
            type="text"
            inputMode="decimal"
            placeholder="Other"
            aria-label={`${label} — other amount`}
            value={isCustom ? value : ''}
            onChange={(e) => onChange(sanitize(e.target.value))}
          />
          TRUST
        </label>
      </div>
    </div>
  )
}
