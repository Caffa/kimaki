// The LOCAL VOICE startup banner (V1 fork parity). Printed once when the bot
// starts, to stderr (stdout is reserved for command results). The ASCII art
// is pre-rendered with figlet ("ANSI Shadow" font) and embedded as a literal,
// so kimaki ships no figlet dependency and the banner is byte-stable.

const ART = [
  "██╗      ██████╗  ██████╗ █████╗ ██╗     ",
  "██║     ██╔═══██╗██╔════╝██╔══██╗██║     ",
  "██║     ██║   ██║██║     ███████║██║     ",
  "██║     ██║   ██║██║     ██╔══██║██║     ",
  "███████╗╚██████╔╝╚██████╗██║  ██║███████╗",
  "╚══════╝ ╚═════╝  ╚═════╝╚═╝  ╚═╝╚══════╝",
  "                                         ",
  "██╗   ██╗ ██████╗ ██╗ ██████╗███████╗    ",
  "██║   ██║██╔═══██╗██║██╔════╝██╔════╝    ",
  "██║   ██║██║   ██║██║██║     █████╗      ",
  "╚██╗ ██╔╝██║   ██║██║██║     ██╔══╝      ",
  " ╚████╔╝ ╚██████╔╝██║╚██████╗███████╗    ",
  "  ╚═══╝   ╚═════╝ ╚═╝ ╚═════╝╚══════╝    ",
  "                                         ",
]

export function printLocalBanner(): void {
  const totalWidth = 75
  const bordered = ART.map((line) => `║ ${line.padEnd(totalWidth - 2)}║`).join('\n')
  const banner = `
╔${'═'.repeat(totalWidth - 2)}╗
║${' '.repeat(totalWidth - 2)}║
${bordered}
║${' '.repeat(totalWidth - 2)}║
║                    ★ L O C A L   T R A N S C R I P T I O N ★              ║
║                         V A R I A N T   O F   K I M A K I                 ║
║                                                                           ║
║   Features:                                                               ║
║   • Parakeet MLX (Apple Silicon) — local NVIDIA Parakeet via MLX          ║
║   • Remote ASR server — point ASR_SERVICE_URL at the Mac Studio           ║
║   • Fallback chain: Parakeet → OpenAI → ChatGPT → Gemini → Whisper        ║
║                                                                           ║
╚${'═'.repeat(totalWidth - 2)}╝
`
  process.stderr.write(banner)
}
