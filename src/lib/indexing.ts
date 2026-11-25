export function shouldIndex(
  env: Record<string, string | boolean | undefined>,
): boolean {
  return env.INDEX_SITE === 'true' && env.DEPLOY_ENV === 'production';
}
