export function logSpec(spec: any, name: string) {
  console.groupCollapsed(`🚄 use-coordination ${name}`);
  console.info(`data:,${JSON.stringify(spec)}`);
  console.info(JSON.stringify(spec, null, 2));
  console.groupEnd();
}
