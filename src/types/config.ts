export interface TermConfig {
  termName: string;
  geometry: [number, number];
  visualBell: boolean;
  popOnBell: boolean;
  cursorBlink: boolean;
  scrollback: number;
  screenKeys: boolean;
  colors: string[];
  programFeatures: boolean;
  debug: boolean;
}

export interface HttpsConfig {
  key: string | Buffer;
  cert: string | Buffer;
}

export interface TtyConfig {
  dir: string;
  json: string;
  port: number;
  hostname: string;
  shell: string | ((session: unknown) => string);
  shellArgs: string[] | ((session: unknown) => string[]);
  static: string;
  limitPerUser: number;
  limitGlobal: number;
  localOnly: boolean;
  syncSession: boolean;
  sessionTimeout: number;
  log: boolean;
  cwd: string;
  io: Record<string, unknown> | null;
  term: Partial<TermConfig>;
  termName: string;
  debug: boolean;
  users: Record<string, string>;
  https: HttpsConfig | false;
}

export type PartialTtyConfig = Partial<TtyConfig> & {
  auth?: {
    username?: string;
    password?: string;
    disabled?: boolean;
  };
  ssl?: HttpsConfig;
  tls?: HttpsConfig;
  config?: string;
  userScript?: string;
  userStylesheet?: string;
  stylesheet?: string;
  hooks?: unknown;
};
