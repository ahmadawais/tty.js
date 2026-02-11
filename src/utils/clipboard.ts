import { execFile } from 'node:child_process';

type ClipboardResult = { text: string } | { error: Error };

const tryExec = (file: string, args: string[]): Promise<ClipboardResult> =>
  new Promise((resolve) => {
    execFile(file, args, (err, stdout, stderr) => {
      if (err) return resolve({ error: err });
      if (stderr && !stdout) return resolve({ error: new Error(stderr) });
      resolve({ text: stdout });
    });
  });

const CLIPBOARD_COMMANDS = [
  ['xsel', '-o', '-p'],
  ['xclip', '-o', '-selection', 'primary'],
  ['pbpaste'],
] as const;

export const readClipboard = async (): Promise<string> => {
  for (const [cmd, ...args] of CLIPBOARD_COMMANDS) {
    const result = await tryExec(cmd, [...args]);
    if ('text' in result) return result.text;
  }
  throw new Error('Failed to get clipboard contents.');
};
