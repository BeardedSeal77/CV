// Keeps each " · " separated part on one line (from sm up) so the badge only
// wraps between parts; on phones the long middle part has to wrap internally
export function RelocationParts({ text }: { text: string }) {
  const parts = text.split(" · ")
  return (
    <span>
      {parts.map((part, index) => {
        const last = index === parts.length - 1
        return (
          <span key={part}>
            <span className="sm:whitespace-nowrap">
              {part}
              {!last && " ·"}
            </span>
            {!last && " "}
          </span>
        )
      })}
    </span>
  )
}
