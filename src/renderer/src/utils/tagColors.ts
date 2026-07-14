const PALETTE = [
  { bg: '#e8eaf9', text: '#4c4fc4' },
  { bg: '#fdf1d2', text: '#a3720b' },
  { bg: '#fbe1e6', text: '#c23c5a' },
  { bg: '#dcf3e6', text: '#1e8a55' },
  { bg: '#e1eefb', text: '#2166a8' },
  { bg: '#f2e4fb', text: '#7b3bb0' }
]

export function colorForTag(tag: string): { bg: string; text: string } {
  let hash = 0
  for (let i = 0; i < tag.length; i++) {
    hash = (hash << 5) - hash + tag.charCodeAt(i)
    hash |= 0
  }
  const idx = Math.abs(hash) % PALETTE.length
  return PALETTE[idx]
}
