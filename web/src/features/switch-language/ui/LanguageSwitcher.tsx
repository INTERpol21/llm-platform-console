import { useTranslation } from 'react-i18next';
import { LANG_STORAGE_KEY } from '../../../shared/config/index.ts';
import { SUPPORTED_LANGUAGES } from '../../../shared/i18n/index.ts';
import { LangToggle } from '../../../shared/ui/index.ts';

/** Wires the shared LangToggle to i18next and persists the choice. */
export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();

  const options = SUPPORTED_LANGUAGES.map((lng) => ({ value: lng, label: t(`lang.${lng}`) }));

  const handleChange = (value: string) => {
    void i18n.changeLanguage(value);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LANG_STORAGE_KEY, value);
    }
  };

  return (
    <LangToggle
      value={i18n.resolvedLanguage ?? i18n.language}
      options={options}
      onChange={handleChange}
      label={t('lang.toggle')}
    />
  );
}
