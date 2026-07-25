"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../../../../firebase.config";
import type { MemberPackage } from "@/data";
import {
  emptyUserProfile,
  normalizeUserProfile,
  type UserProfileData,
} from "@/lib/userProfile";
import {
  defaultAppPreferences,
  normalizeAppPreferences,
  type AppPreferences,
} from "@/lib/appPreferences";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  memberPackage: MemberPackage;
  profile: UserProfileData | null;
  appPreferences: AppPreferences;
  isAuthOpen: boolean;
  openAuth: () => void;
  closeAuth: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [memberPackage, setMemberPackage] = useState<MemberPackage>("basic");
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [appPreferences, setAppPreferences] = useState<AppPreferences>(
    defaultAppPreferences,
  );
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;
    let unsubscribePreferences: (() => void) | undefined;
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      unsubscribeProfile?.();
      unsubscribePreferences?.();
      setUser(currentUser);

      if (!currentUser) {
        setMemberPackage("basic");
        setProfile(null);
        setAppPreferences(defaultAppPreferences);
        setLoading(false);
        return;
      }

      unsubscribePreferences = onSnapshot(
        doc(db, "users", currentUser.uid, "settings", "preferences"),
        (snapshot) => {
          const app = snapshot.exists()
            ? (snapshot.data().app as Record<string, unknown> | undefined)
            : undefined;
          const locale = window.location.pathname.split("/")[1] ?? "de";
          setAppPreferences(normalizeAppPreferences(app, locale));
        },
        () => setAppPreferences(defaultAppPreferences),
      );

      unsubscribeProfile = onSnapshot(
        doc(db, "users", currentUser.uid),
        (snapshot) => {
          const nextProfile = snapshot.exists()
            ? normalizeUserProfile(snapshot.data())
            : emptyUserProfile;
          setProfile(nextProfile);
          setMemberPackage(nextProfile.memberPackage);
          setLoading(false);
        },
        () => {
          setMemberPackage("basic");
          setProfile(null);
          setLoading(false);
        },
      );
    });

    return () => {
      unsubscribeAuth();
      unsubscribeProfile?.();
      unsubscribePreferences?.();
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      memberPackage,
      profile,
      appPreferences,
      isAuthOpen,
      openAuth: () => setIsAuthOpen(true),
      closeAuth: () => setIsAuthOpen(false),
    }),
    [user, loading, memberPackage, profile, appPreferences, isAuthOpen],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
