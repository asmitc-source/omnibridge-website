/** Test-only resolver: Node's type stripper does not add .ts to relative imports. */
const HAS_EXT = /\.(?:[cm]?[jt]s|json|tsx)$/;
const rootUrl = new URL("../", import.meta.url);

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const rel = specifier.slice(2);
    const url = new URL(HAS_EXT.test(rel) ? rel : `${rel}.ts`, rootUrl);
    return nextResolve(url.href, context);
  }
  if (
    (specifier.startsWith("./") || specifier.startsWith("../")) &&
    !HAS_EXT.test(specifier)
  ) {
    return nextResolve(`${specifier}.ts`, context);
  }
  return nextResolve(specifier, context);
}
