import type { ReactNode } from "react";
import styles from "../Settings.module.css";

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  testId?: string;
}

interface SettingsInputProps {
  id: string;
  label: string;
  value: string | number;
  type?: "text" | "email" | "number";
  suffix?: string;
  testId?: string;
  readOnly?: boolean;
  min?: number;
  max?: number;
  onChange: (value: string) => void;
}

interface SettingsSelectProps {
  id: string;
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  testId?: string;
  onChange: (value: string) => void;
}

interface SettingsToggleProps {
  id: string;
  label: string;
  checked: boolean;
  testId?: string;
  onChange: (checked: boolean) => void;
}

export function SettingsSection({ title, description, children, testId }: SettingsSectionProps) {
  return (
    <section className={styles.sectionCard} data-testid={testId}>
      <div className={styles.sectionHeader}>
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function SettingsInput({
  id,
  label,
  value,
  type = "text",
  suffix,
  testId,
  readOnly,
  min,
  max,
  onChange,
}: SettingsInputProps) {
  return (
    <label className={styles.field} htmlFor={id}>
      <span>{label}</span>
      <span className={styles.inputWrap}>
        <input
          id={id}
          data-testid={testId}
          type={type}
          value={value}
          readOnly={readOnly}
          min={min}
          max={max}
          onChange={(event) => onChange(event.target.value)}
        />
        {suffix ? <span className={styles.inputSuffix}>{suffix}</span> : null}
      </span>
    </label>
  );
}

export function SettingsSelect({ id, label, value, options, testId, onChange }: SettingsSelectProps) {
  return (
    <label className={styles.field} htmlFor={id}>
      <span>{label}</span>
      <select
        id={id}
        data-testid={testId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function SettingsToggle({ id, label, checked, testId, onChange }: SettingsToggleProps) {
  return (
    <label className={styles.toggleRow} htmlFor={id}>
      <span>{label}</span>
      <input
        id={id}
        data-testid={testId}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className={styles.toggleTrack} aria-hidden="true" />
    </label>
  );
}
