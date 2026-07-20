import * as Tooltip from '@radix-ui/react-tooltip';
import { Moon, Sun } from 'lucide-react';
import styles from './ThemeToggle.module.css';

export type ThemeMode = 'light' | 'dark';

export interface ThemeToggleProps {
  theme: ThemeMode;
  onToggle: () => void;
  label: string;
}

/** Presentational theme switch. State lives in the switch-theme feature. */
export function ThemeToggle({ theme, onToggle, label }: ThemeToggleProps) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <button
          type="button"
          className={styles.toggle}
          onClick={onToggle}
          aria-label={label}
          data-theme-mode={theme}
        >
          {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
        </button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content className={styles.tooltip} sideOffset={6}>
          {label}
          <Tooltip.Arrow className={styles.arrow} />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
