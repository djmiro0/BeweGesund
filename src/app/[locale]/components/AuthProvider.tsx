"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../../../../firebase.config";
import type { MemberPackage } from "@/data";
import { emptyUserProfile, normalizeUserProfile, type UserProfileData } from "@/lib/userProfile";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  memberPackage: MemberPackage;
  profile: UserProfileData | null;
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
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      unsubscribeProfile?.();
      setUser(currentUser);

      if (!currentUser) {
        setMemberPackage("basic");
        setProfile(null);
        setLoading(false);
        return;
      }

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
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      memberPackage,
      profile,
      isAuthOpen,
      openAuth: () => setIsAuthOpen(true),
      closeAuth: () => setIsAuthOpen(false),
    }),
    [user, loading, memberPackage, profile, isAuthOpen]
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
