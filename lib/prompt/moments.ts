/**
 * "Tu Momento" — the candidate's current career situation, picked in
 * /profile → Tu Momento (single choice) and fed into the diagnostic so the
 * analysis speaks to where they actually are. Shared by the profile picker,
 * the Screen 01 onboarding tracker, and the AI intake.
 */
export type Moment = { id: string; title: string; description: string };

export const MOMENTS: Moment[] = [
  {
    id: "re-entry",
    title: "The Re-Entry",
    description:
      "Regresas al mercado después de un layoff, una pausa, o una licencia de maternidad, y no sabes cómo explicar ese gap en inglés sin que suene a disculpa.",
  },
  {
    id: "rebuilder",
    title: "The Rebuilder",
    description:
      "Reconstruiste tu carrera después de migrar. Tomaste lo que había para establecerte, pero ahora estás listo para lo que realmente vales, y necesitas saber cómo decirlo.",
  },
  {
    id: "pivot",
    title: "The Pivot",
    description:
      "Quieres moverte a una nueva industria y no sabes cómo traducir el valor de tu experiencia anterior. 'Transferable skills' es fácil de decir y difícil de explicar en una entrevista.",
  },
  {
    id: "experienced",
    title: "The Experienced Professional",
    description:
      "Tienes una década de experiencia valiosa: en otro mercado, en otro idioma. Pero en la entrevista, no sabes cómo hacer que la persona que te está evaluando lo vea.",
  },
  {
    id: "rusty",
    title: "The Rusty One",
    description:
      "Tu última entrevista fue hace diez años. El mercado cambió, el formato cambió. Tienes más experiencia que nunca, y menos claridad sobre cómo prepararte.",
  },
  {
    id: "invisible",
    title: "The Invisible One",
    description:
      "Saliste de una entrevista y lo sentiste: dijiste todo, pero no te vieron realmente. Hay una diferencia entre nombrar tu experiencia y narrarla.",
  },
];

/** Look up a moment by id (safe: returns null for empty/unknown ids). */
export function momentById(id: string | null | undefined): Moment | null {
  if (!id) return null;
  return MOMENTS.find((m) => m.id === id) ?? null;
}
