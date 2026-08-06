"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import LoadingScreen from "./LoadingScreen";
import styles from "./PageMediaGate.module.css";

const cssUrlPattern = /url\((?:"([^"]*)"|'([^']*)'|([^)]*))\)/g;

function isInInitialViewport(element: Element) {
  const rect = element.getBoundingClientRect();

  return (
    rect.bottom > 0 &&
    rect.right > 0 &&
    rect.top < window.innerHeight &&
    rect.left < window.innerWidth &&
    (rect.width > 0 || rect.height > 0)
  );
}

function shouldWaitForImage(image: HTMLImageElement) {
  return (
    image.dataset.pageReady === "true" ||
    image.loading === "eager" ||
    image.getAttribute("fetchpriority") === "high" ||
    isInInitialViewport(image)
  );
}

function getVisibleBackgroundUrls(root: HTMLElement) {
  const urls = new Set<string>();
  const elements = [root, ...root.querySelectorAll<HTMLElement>("*")];

  elements.forEach((element) => {
    if (
      element.dataset.pageReadyBackground !== "true" &&
      !isInInitialViewport(element)
    ) {
      return;
    }

    const backgroundImage = window.getComputedStyle(element).backgroundImage;
    let match: RegExpExecArray | null;

    cssUrlPattern.lastIndex = 0;
    while ((match = cssUrlPattern.exec(backgroundImage)) !== null) {
      const url = match[1] ?? match[2] ?? match[3];
      if (url) urls.add(url.trim());
    }
  });

  return [...urls];
}

function waitForLoad(image: HTMLImageElement, signal: AbortSignal) {
  if (image.complete) return Promise.resolve();

  return new Promise<void>((resolve) => {
    const finish = () => {
      image.removeEventListener("load", finish);
      image.removeEventListener("error", finish);
      signal.removeEventListener("abort", finish);
      resolve();
    };

    image.addEventListener("load", finish, { once: true });
    image.addEventListener("error", finish, { once: true });
    signal.addEventListener("abort", finish, { once: true });
  });
}

async function waitForImage(image: HTMLImageElement, signal: AbortSignal) {
  await waitForLoad(image, signal);

  if (
    signal.aborted ||
    image.naturalWidth === 0 ||
    typeof image.decode !== "function"
  ) {
    return;
  }

  await image.decode().catch(() => undefined);
}

async function waitForBackground(url: string, signal: AbortSignal) {
  const image = new window.Image();
  image.src = url;

  await waitForImage(image, signal);
}

interface PageMediaGateProps {
  children: React.ReactNode;
  contentKey?: string;
}

export default function PageMediaGate({
  children,
  contentKey = "page",
}: PageMediaGateProps) {
  const pathname = usePathname();
  const contentRef = useRef<HTMLDivElement>(null);
  const readinessKey = `${pathname}:${contentKey}`;
  const [readyKey, setReadyKey] = useState<string | null>(null);
  const isReady = readyKey === readinessKey;

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const controller = new AbortController();
    const animationFrame = window.requestAnimationFrame(() => {
      const images = [...content.querySelectorAll<HTMLImageElement>("img")]
        .filter(shouldWaitForImage)
        .map((image) => waitForImage(image, controller.signal));
      const backgrounds = getVisibleBackgroundUrls(content).map((url) =>
        waitForBackground(url, controller.signal),
      );

      void Promise.all([...images, ...backgrounds]).then(() => {
        if (!controller.signal.aborted) setReadyKey(readinessKey);
      });
    });

    return () => {
      controller.abort();
      window.cancelAnimationFrame(animationFrame);
    };
  }, [readinessKey]);

  return (
    <div className={styles.mediaGate}>
      <div
        ref={contentRef}
        className={`${styles.content} ${isReady ? "" : styles.contentPending}`}
        aria-busy={!isReady}
        aria-hidden={isReady ? undefined : true}
        data-testid="page-media-content"
      >
        {children}
      </div>
      {!isReady ? (
        <div className={styles.loadingOverlay} data-testid="page-media-loading">
          <LoadingScreen />
        </div>
      ) : null}
    </div>
  );
}
