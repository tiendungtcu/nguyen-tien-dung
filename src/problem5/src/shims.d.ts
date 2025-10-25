declare module 'fs' {
  export const promises: {
    readFile(path: string, encoding: string): Promise<string>;
    writeFile(path: string, data: string, encoding: string): Promise<void>;
    mkdir(path: string, options: { recursive: boolean }): Promise<void>;
  };
}

declare module 'path' {
  export function dirname(path: string): string;
  export function resolve(...segments: string[]): string;
}

declare module 'crypto' {
  export function randomUUID(): string;
}

declare const __dirname: string;

declare const process: {
  env: Record<string, string | undefined>;
  exitCode?: number;
};

declare module 'express' {
  type Request = any;
  type Response = any;
  type NextFunction = any;
  interface Express {
    use: (...args: any[]) => Express;
    get: (...args: any[]) => Express;
    post: (...args: any[]) => Express;
    put: (...args: any[]) => Express;
    delete: (...args: any[]) => Express;
    listen: (...args: any[]) => any;
  }
  const exp: (() => Express) & {
    Router: () => Express;
    json: (...args: any[]) => any;
  };
  export default exp;
  export { Request, Response, NextFunction };
}

declare module 'cors' {
  const cors: (...args: any[]) => any;
  export default cors;
}

declare module 'morgan' {
  const morgan: (...args: any[]) => any;
  export default morgan;
}
