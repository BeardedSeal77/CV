import type { Browser } from "playwright-core"

export function launchBrowser(): Promise<Browser>
export function printPage(browser: Browser, url: string): Promise<Uint8Array>
export function mergePdfs(
  parts: Uint8Array[],
  meta?: { title?: string; author?: string }
): Promise<{ bytes: Uint8Array; pages: number[] }>
