"use client";

import { AlertTriangle, Trash2, X } from "lucide-react";
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  signOut,
  type AuthError,
} from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { auth, functions } from "../../../../../firebase.config";
import { useAuth } from "../../components/AuthProvider";
import styles from "../Settings.module.css";

export default function AccountManagement() {
  const t = useTranslations("profile.delete");
  const locale = useLocale();
  const router = useRouter();
  const { user } = useAuth();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const usesGoogleProvider = user?.providerData?.some((provider) => provider.providerId === "google.com") ?? false;

  const closeDialog = () => {
    setIsDeleteOpen(false);
    setDeletePassword("");
    setDeleteError("");
  };

  const getDeleteErrorMessage = (error: unknown) => {
    const code = (error as AuthError | undefined)?.code;
    const message = (error as Error | undefined)?.message ?? "";

    switch (code) {
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return t("errors.invalidPassword");
      case "auth/requires-recent-login":
        return t("errors.recentLogin");
      case "failed-precondition":
        return message.toLowerCase().includes("recent sign-in") ? t("errors.recentLogin") : t("errors.generic");
      case "permission-denied":
      case "firestore/permission-denied":
        return t("errors.permissionDenied");
      default:
        return t("errors.generic");
    }
  };

  const handleDeleteProfile = async () => {
    if (!user || isDeleting || (!usesGoogleProvider && (!user.email || !deletePassword))) return;

    setIsDeleting(true);
    setDeleteError("");

    try {
      if (usesGoogleProvider) {
        await reauthenticateWithPopup(user, new GoogleAuthProvider());
      } else if (user.email) {
        const credential = EmailAuthProvider.credential(user.email, deletePassword);
        await reauthenticateWithCredential(user, credential);
      }

      await user.getIdToken(true);

      const deleteUserAccount = httpsCallable(functions, "deleteUserAccount");
      await deleteUserAccount();
      window.alert(t("success"));
      await signOut(auth).catch(() => undefined);
      closeDialog();
      router.replace(`/${locale}`);
    } catch (error) {
      const errorMessage = getDeleteErrorMessage(error);
      setDeleteError(errorMessage);
      window.alert(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <section className={styles.accountManagement} data-testid="settings-account-management">
        <div className={styles.accountManagementCopy}>
          <span className={styles.accountIcon}>
            <AlertTriangle size={21} />
          </span>
          <div>
            <p className={styles.eyebrow}>{t("eyebrow")}</p>
            <h2>{t("title")}</h2>
            <p>{t("description")}</p>
          </div>
        </div>
        <button type="button" className={styles.dangerButton} onClick={() => setIsDeleteOpen(true)}>
          <Trash2 size={17} />
          {t("open")}
        </button>
      </section>

      {isDeleteOpen ? (
        <div className={styles.modalOverlay}>
          <div className={styles.deleteModal} role="dialog" aria-modal="true" aria-labelledby="settings-delete-title">
            <button type="button" className={styles.modalClose} aria-label={t("cancel")} onClick={closeDialog}>
              <X size={18} />
            </button>
            <span className={styles.modalIcon}>
              <AlertTriangle size={24} />
            </span>
            <p className={styles.eyebrow}>{t("confirmEyebrow")}</p>
            <h2  className={styles.deleteTitle} id="settings-delete-title">{t("confirmTitle")}</h2>
            <p className={styles.modalText}>
              {usesGoogleProvider ? t("googleConfirmText") : t("confirmText")}
            </p>
            {!usesGoogleProvider ? (
              <label className={styles.passwordLabel}>
                <span>{t("passwordLabel")}</span>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(event) => setDeletePassword(event.target.value)}
                  placeholder={t("passwordPlaceholder")}
                  autoComplete="current-password"
                />
              </label>
            ) : null}
            {deleteError ? <p className={styles.deleteError}>{deleteError}</p> : null}
            <div className={styles.modalActions}>
              <button type="button" className={styles.cancelButton} onClick={closeDialog}>
                {t("cancel")}
              </button>
              <button
                type="button"
                className={styles.confirmDeleteButton}
                disabled={(!usesGoogleProvider && !deletePassword) || isDeleting}
                onClick={() => void handleDeleteProfile()}
              >
                {isDeleting ? t("deleting") : usesGoogleProvider ? t("googleConfirm") : t("confirm")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
