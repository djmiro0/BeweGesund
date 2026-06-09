import type { PrivacySettingsData } from "../settingsData";
import { SettingsSection, SettingsToggle } from "./SettingsControls";
import styles from "../Settings.module.css";

interface PrivacySettingsProps {
  data: PrivacySettingsData;
  onChange: (data: PrivacySettingsData) => void;
}

export default function PrivacySettings({ data, onChange }: PrivacySettingsProps) {
  return (
    <SettingsSection
      title="Privacy & Account"
      description="Account visibility and data actions."
      testId="settings-privacy-section"
    >
      <div className={styles.toggleList}>
        <SettingsToggle
          id="isPublicProfile"
          label="Public profile"
          checked={data.isPublicProfile}
          onChange={(checked) => onChange({ ...data, isPublicProfile: checked })}
        />
        <SettingsToggle
          id="showProgressPublicly"
          label="Show progress publicly"
          checked={data.showProgressPublicly}
          onChange={(checked) => onChange({ ...data, showProgressPublicly: checked })}
        />
      </div>

      <div className={styles.accountActions}>
        <button type="button" className={styles.secondaryButton}>Change password</button>
      </div>
    </SettingsSection>
  );
}
