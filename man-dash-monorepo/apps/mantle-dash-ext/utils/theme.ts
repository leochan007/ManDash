export type Theme = "light" | "dark"

export interface ThemeColors {
  bg: string
  fg: string
  subtle: string
  card: string
  border: string
  primary: string
}

export function getThemeColors(theme: Theme): ThemeColors {
  if (theme === "dark") {
    return {
      bg: "#121212",
      fg: "#ffffff", // 亮白色
      subtle: "#b0b0b0", // 更亮的灰色，确保在深色背景下可见
      card: "#1e1e1e",
      border: "#333",
      primary: "#90caf9"
    }
  } else {
    return {
      bg: "#ffffff",
      fg: "#1a1a1a", // 深色字体，确保在白色背景下清晰
      subtle: "#666666", // 中等灰色，在白色背景下清晰可见
      card: "#f6f6f6",
      border: "#e0e0e0",
      primary: "#1976d2"
    }
  }
}

