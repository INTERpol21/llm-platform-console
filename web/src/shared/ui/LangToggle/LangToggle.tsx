import styles from './LangToggle.module.css';

export interface LangOption {
  value: string;
  label: string;
}

export interface LangToggleProps {
  value: string;
  options: LangOption[];
  onChange: (value: string) => void;
  label: string;
}

/** Presentational segmented language switch. State lives in the switch-language feature. */
export function LangToggle({ value, options, onChange, label }: LangToggleProps) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: segmented ARIA button group; <fieldset> would force legend semantics + restyling
    <div className={styles.group} role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={option.value === value ? `${styles.item} ${styles.active}` : styles.item}
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
