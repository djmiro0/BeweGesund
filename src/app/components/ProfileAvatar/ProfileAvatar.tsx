"use client";

import { getBlob, ref } from "firebase/storage";
import { useEffect, useState } from "react";
import { storage } from "../../../../firebase.config";
import styles from "./ProfileAvatar.module.css";

interface ProfileAvatarProps {
  userId: string;
  photoUrl?: string | null;
  initial: string;
  ariaLabel: string;
  className?: string;
}

export default function ProfileAvatar({
  userId,
  photoUrl,
  initial,
  ariaLabel,
  className,
}: ProfileAvatarProps) {
  const [privatePhotoUrl, setPrivatePhotoUrl] = useState("");
  const [failedPhotoUrl, setFailedPhotoUrl] = useState("");
  const activePhotoUrl = photoUrl || privatePhotoUrl || "";
  const showPhoto = Boolean(
    activePhotoUrl && activePhotoUrl !== failedPhotoUrl,
  );

  useEffect(() => {
    if (photoUrl) return;

    let objectUrl = "";
    let cancelled = false;

    void getBlob(ref(storage, `users/${userId}/profile/avatar`))
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setPrivatePhotoUrl(objectUrl);
        setFailedPhotoUrl("");
      })
      .catch(() => {
        if (!cancelled) setPrivatePhotoUrl("");
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [userId, photoUrl]);

  return (
    <span
      className={`${styles.avatar} ${className ?? ""}`}
      role="img"
      aria-label={ariaLabel}
      data-testid="profile-avatar"
    >
      {showPhoto ? (
        // Firebase Storage URLs are private user media and need a runtime error fallback.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={activePhotoUrl}
          alt=""
          referrerPolicy="no-referrer"
          onError={() => {
            if (activePhotoUrl === privatePhotoUrl) {
              setPrivatePhotoUrl("");
              return;
            }
            setFailedPhotoUrl(activePhotoUrl);
          }}
        />
      ) : (
        initial
      )}
    </span>
  );
}
