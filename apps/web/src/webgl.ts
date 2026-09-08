let support: boolean | undefined
export function canUseWebGL(): boolean {
  if (support !== undefined) return support
  try {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('webgl2')
    support = !!context
    context?.getExtension('WEBGL_lose_context')?.loseContext()
  } catch {
    support = false
  }
  return support
}
