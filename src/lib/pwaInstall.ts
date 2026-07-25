export const PWA_INSTALL_REQUEST_EVENT = "bewegesund:pwa-install-request";

export function isStandalonePwa() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function isMobileDevice() {
  return /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);
}
