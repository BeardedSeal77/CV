// letter.md keeps private prep notes above the first `---` line and the letter
// itself below it. Only the letter is ever printed.

export interface LetterParts {
  notes: string
  letter: string
}

export function splitLetter(text: string): LetterParts {
  const normalised = text.replace(/\r\n/g, "\n")
  const match = normalised.match(/^---[ \t]*$/m)
  if (!match || match.index === undefined) return { notes: "", letter: normalised.trim() }
  return {
    notes: normalised.slice(0, match.index).trim(),
    letter: normalised.slice(match.index + match[0].length).trim(),
  }
}

export function joinLetter({ notes, letter }: LetterParts) {
  return `${notes.trim()}\n\n---\n\n${letter.trim()}\n`
}

export interface ParsedLetter {
  name?: string
  contact?: string
  date?: string
  paragraphs: string[][]
}

/** Header block (name + contact line), optional date, then paragraphs of lines */
export function parseLetter(letter: string): ParsedLetter {
  const blocks = letter
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean)
  const result: ParsedLetter = { paragraphs: [] }
  const first = blocks[0]?.split("\n") ?? []
  if (first.length === 2 && (first[1].includes("·") || first[1].includes("@"))) {
    ;[result.name, result.contact] = first
    blocks.shift()
  }
  if (blocks[0] && blocks[0].length < 40 && /\b(19|20)\d{2}\b/.test(blocks[0])) {
    result.date = blocks.shift()
  }
  result.paragraphs = blocks.map((b) => b.split("\n"))
  return result
}
