export function shouldIndex(
  env: Record<string, string | boolean | undefined>,
): boolean {
  return (
    env.INDEX_SITE === 'true' &&
    (!env.CF_PAGES || env.CF_PAGES_BRANCH === (env.PRODUCTION_BRANCH || 'main'))
  );
}
