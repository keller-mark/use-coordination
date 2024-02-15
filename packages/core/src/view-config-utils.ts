export function logConfig(config: any, name: string) {
  console.groupCollapsed(`🚄 use-coordination ${name}`);
  console.info(`data:,${JSON.stringify(config)}`);
  console.info(JSON.stringify(config, null, 2));
  console.groupEnd();
}
