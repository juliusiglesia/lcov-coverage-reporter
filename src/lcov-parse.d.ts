declare module "lcov-parse" {
  function parse(
    content: string,
    callback: (err: Error | null, data: any[]) => void,
  ): void
  export = parse
}
