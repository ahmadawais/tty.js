export type LogLevel = 'log' | 'error' | 'warning';

export interface LogLevelStyle {
  ansiCode: number;
  method: 'log' | 'error';
}
