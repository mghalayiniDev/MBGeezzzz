// Discord's embed limits. The Convex mutations must enforce the same numbers server-side.
export const LIMITS = {
  author: 256,
  title: 256,
  description: 4096,
  fieldName: 256,
  fieldValue: 1024,
  fields: 25,
  footer: 2048,
  total: 6000,
  buttons: 5,
  buttonLabel: 80,
};

export const HEX_COLOR = /^#[0-9a-f]{6}$/i;

export function embedTotalChars(embed) {
  return (
    embed.author.length +
    embed.title.length +
    embed.description.length +
    embed.footer.length +
    embed.fields.reduce((sum, f) => sum + f.name.length + f.value.length, 0)
  );
}

/** Returns a list of human-readable problems. Empty list = valid. */
export function validateDraft({ embed, buttons }) {
  const problems = [];
  const total = embedTotalChars(embed);
  const hasContent =
    embed.author.trim() || embed.title.trim() || embed.description.trim() || embed.fields.length;

  if (!hasContent) problems.push("The embed is empty");
  if (total > LIMITS.total) problems.push(`Embeds can have at most ${LIMITS.total} characters in total`);
  if (embed.fields.some((f) => !f.name.trim() || !f.value.trim())) {
    problems.push("Every field needs a name and a value");
  }
  if (!HEX_COLOR.test(embed.color)) problems.push("Color must be a hex code like #7B6BFF");
  if (buttons.some((b) => !b.label.trim())) problems.push("Every button needs a label");
  return problems;
}
