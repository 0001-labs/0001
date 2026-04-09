// device.ts
// Device detection and --sf (scale factor) responsive scaling
// Adapted from DS one device.ts for standalone use (no Lit signals)

// ============================================================================
// Types
// ============================================================================

export type DeviceType = "mobile" | "tablet" | "desktop";

export interface ScalingConfig {
  baseWidth: number;
  minScale: number;
  maxScale: number;
}

// ============================================================================
// Configuration
// ============================================================================

const defaultConfig: ScalingConfig = {
  baseWidth: 280,
  minScale: 0.75,
  maxScale: 2.0,
};

let config: ScalingConfig = { ...defaultConfig };
let currentFactor = 1;

// ============================================================================
// Device Detection
// ============================================================================

export function detectMobileDevice(): boolean {
  if (typeof navigator === "undefined" || typeof window === "undefined") {
    return false;
  }

  const ua: string = navigator.userAgent || (navigator as any).vendor || "";

  const uaMatchesMobile =
    /Mobile|Android|iP(ad|hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)|Windows Phone|Phone|Tablet/i.test(
      ua
    );

  const isTouchCapable = (navigator.maxTouchPoints || 0) > 1;
  const narrowViewport =
    Math.min(window.innerWidth || 0, window.innerHeight || 0) <= 820;

  return uaMatchesMobile || (isTouchCapable && narrowViewport);
}

export function getDeviceType(): DeviceType {
  const isMobile = detectMobileDevice();
  if (!isMobile) return "desktop";

  const screenWidth = document.documentElement.clientWidth;
  const screenHeight = document.documentElement.clientHeight;
  const isTablet = Math.min(screenWidth, screenHeight) >= 600;
  return isTablet ? "tablet" : "mobile";
}

// ============================================================================
// Scaling
// ============================================================================

function calculateScalingFactor(viewportWidth: number): number {
  const rawScale = viewportWidth / config.baseWidth;
  return Number(
    Math.max(config.minScale, Math.min(config.maxScale, rawScale)).toFixed(3)
  );
}

export function updateScalingFactor(): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const isMobile = detectMobileDevice();

  if (!isMobile) {
    currentFactor = 1;
    document.documentElement.style.setProperty("--sf", "1");
    window.dispatchEvent(
      new CustomEvent("scaling-changed", { detail: { scalingFactor: 1 } })
    );
    return;
  }

  const viewportWidth = document.documentElement.clientWidth;
  currentFactor = calculateScalingFactor(viewportWidth);
  document.documentElement.style.setProperty("--sf", currentFactor.toString());

  window.dispatchEvent(
    new CustomEvent("scaling-changed", {
      detail: { scalingFactor: currentFactor },
    })
  );
}

export function getScalingFactor(): number {
  return currentFactor;
}

export function setScalingConfig(partial: Partial<ScalingConfig>): void {
  config = { ...config, ...partial };
  updateScalingFactor();
}

// ============================================================================
// Initialization
// ============================================================================

export function initDeviceDetection(): void {
  if (typeof document === "undefined") return;

  const isMobile = detectMobileDevice();

  if (isMobile) {
    document.documentElement.classList.add("mobile");
    document.documentElement.classList.remove("desktop");
  } else {
    document.documentElement.classList.add("desktop");
    document.documentElement.classList.remove("mobile");
  }

  updateScalingFactor();
}

// Auto-initialize
if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDeviceDetection);
  } else {
    initDeviceDetection();
  }

  let resizeTimeout: ReturnType<typeof setTimeout>;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(initDeviceDetection, 100);
  });

  window.addEventListener("orientationchange", () => {
    setTimeout(initDeviceDetection, 100);
  });
}
