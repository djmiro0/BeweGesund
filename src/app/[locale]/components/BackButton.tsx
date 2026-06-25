"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";

interface BackButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: ReactNode;
}

function shouldUseBrowserBack(event: MouseEvent<HTMLAnchorElement>) {
  if (event.defaultPrevented) return false;
  if (event.button !== 0) return false;
  if (event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) return false;

  return document.referrer ? new URL(document.referrer).origin === window.location.origin : false;
}

export default function BackButton({ href, children, onClick, ...props }: BackButtonProps) {
  const router = useRouter();

  return (
    <Link
      href={href}
      {...props}
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
