// next/image (unoptimized) and next/link prefix basePath automatically;
// raw hrefs and image srcs in content do not, so prefix them explicitly.
export function withBasePath(p: string): string {
  return `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${p}`
}
