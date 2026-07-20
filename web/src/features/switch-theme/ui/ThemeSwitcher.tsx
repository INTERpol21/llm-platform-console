import { useTranslation } from 'react-i18next';
import { ThemeToggle } from '../../../shared/ui/index.ts';
import { useTheme } from '../model/themeStore.ts';

/** Wires the shared ThemeToggle to the theme store and localized label. */
export function ThemeSwitcher() {
  const { t } = useTranslation();
  const theme = useTheme((state) => state.theme);
  const toggle = useTheme((state) => state.toggle);

  return <ThemeToggle theme={theme} onToggle={toggle} label={t('theme.toggle')} />;
}
