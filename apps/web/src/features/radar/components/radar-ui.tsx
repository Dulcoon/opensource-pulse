export const quadrants = ["Exploding", "Rising", "Stable", "Declining"] as const;

export const quadColor: Record<string, string> = {
  Exploding: "oklch(0.637 0.237 25.331)",
  Rising: "oklch(0.723 0.187 142.495)",
  Stable: "oklch(0.623 0.214 259.815)",
  Declining: "oklch(0.55 0 0)",
};
