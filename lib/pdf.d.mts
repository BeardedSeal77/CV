import type { Browser } from "playwright-core"

export interface PdfMeta {
  title?: string
  author?: string
  subject?: string
  keywords?: string[]
}

export function launchBrowser(): Promise<Browser>
export function printPage(browser: Browser, url: string): Promise<Uint8Array>
export function cvKeywords(
  site: { title: string },
  skills: { title: string; items: string[] }[]
): string[]
export function withMeta(bytes: Uint8Array, meta: PdfMeta): Promise<Uint8Array>
export function mergePdfs(
  parts: Uint8Array[],
  meta?: PdfMeta
): Promise<{ bytes: Uint8Array; pages: number[] }>
