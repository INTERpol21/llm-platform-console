import * as Select from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { useSelectedModel } from '../model/store.ts';
import styles from './ModelSelect.module.css';

export interface ModelOption {
  id: string;
}

export interface ModelSelectProps {
  options: ModelOption[];
  label: string;
  placeholder: string;
}

/** Radix Select (unstyled + skinned) bound to the shared model selection store. */
export function ModelSelect({ options, label, placeholder }: ModelSelectProps) {
  const selectedModelId = useSelectedModel((state) => state.selectedModelId);
  const setSelectedModel = useSelectedModel((state) => state.setSelectedModel);

  return (
    // Not a native <label>: the control is a Radix Select.Trigger (a button),
    // which carries its own aria-label — a wrapping <label> binds to no input.
    <div className={styles.wrapper}>
      <span className={styles.label}>{label}</span>
      <Select.Root
        value={selectedModelId ?? undefined}
        onValueChange={(value) => setSelectedModel(value)}
      >
        <Select.Trigger className={styles.trigger} aria-label={label}>
          <Select.Value placeholder={placeholder} />
          <Select.Icon className={styles.icon}>
            <ChevronDown size={15} />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content className={styles.content} position="popper" sideOffset={4}>
            <Select.Viewport className={styles.viewport}>
              {options.map((option) => (
                <Select.Item key={option.id} value={option.id} className={styles.item}>
                  <Select.ItemText>{option.id}</Select.ItemText>
                  <Select.ItemIndicator className={styles.indicator}>
                    <Check size={14} />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}
