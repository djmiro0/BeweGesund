"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";

interface BackButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: ReactNode;
}

function shouldUseBrowserBack(event: MouseEvent<HTMLAnchorElement>) {
  if (event.defaultPrevented) return false;
  if (event.button !== 0) return false;
  if (event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) return false;

  return true;
}

export default function BackButton({ href, children, onClick, ...props }: BackButtonProps) {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const updateScrolledState = () => {
      setIsScrolled(window.scrollY > 12);
    };

    updateScrolledState();
    window.addEventListener("scroll", updateScrolledState, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateScrolledState);
    };
  }, []);

  return (
    <Link
      href={href}
      {...props}
      data-back-scrolled={isScrolled ? "true" : "false"}
      onClick={(event) => {
        onClick?.(event);
        if (!shouldUseBrowserBack(event)) return;

        event.preventDefault();
        router.back();
      }}
    >
      {children}
    </Link>
  );
}
