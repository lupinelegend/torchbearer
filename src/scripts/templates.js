export async function preloadHandlebarsTemplates() {
  const paths = ["systems/torchbearer/templates/parts/spell-list.html.hbs"];

  return loadTemplates(paths);
}
