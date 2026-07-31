"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import styles from "./AppShell.module.css";

function isPlainLeftClick(event: MouseEvent) {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

export default function NavigationFeedback() {
  const t = useTranslations("home");
  const pathname = usePathname();
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const isNavigating = pendingPath !== null && pendingPath !== pathname;

  useEffect(() => {
    const handlePopState = () => setPendingPath(null);
    const handlePageShow = () => setPendingPath(null);

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!isPlainLeftClick(event) || event.defaultPrevented) return;
      const target = event.target;

      if (!(target instanceof Element)) return;

      const link = target.closest("a[href]");
      if (!(link instanceof HTMLAnchorElement)) return;
      if (link.target && link.target !== "_self") return;
      if (link.hasAttribute("download")) return;

      const nextUrl = new URL(link.href, window.location.href);
      if (nextUrl.origin !== window.location.origin) return;

      if (nextUrl.pathname === pathname && nextUrl.hash) return;
      if (nextUrl.pathname === pathname) return;

      setPendingPath(nextUrl.pathname);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => {
        setPendingPath(null);
        timeoutRef.current = null;
      }, 3500);
    };

    document.addEventListener("click", handleClick, true);

    return () => {
      document.removeEventListener("click", handleClick, true);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [pathname]);

  if (!isNavigating) return null;

  return (
    <div
      className={styles.navigationFeedback}
      role="status"
      aria-live="polite"
      aria-label={t("loading")}
    >
      <div className={styles.navigationFeedbackPanel}>
        <div className={styles.navigationSpinner} aria-hidden="true" />
      </div>
    </div>
  );
}
