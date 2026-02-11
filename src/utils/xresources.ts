import { readFileSafe } from './fs.js';

interface XresourcesColors {
  [index: number]: string;
}

const parseDefines = (
  text: string,
): { cleaned: string; defs: Record<string, string> } => {
  const defs: Record<string, string> = {};
  const defPattern = /#\s*define\s+((?:[^\s]|\\\s)+)\s+((?:[^\n]|\\\n)+)/g;

  const cleaned = text.replace(defPattern, (_, name: string, val: string) => {
    defs[name.replace(/\\\s/g, '')] = val.replace(/\\\n/g, '');
    return '';
  });

  return { cleaned, defs };
};

const expandDefines = (text: string, defs: Record<string, string>): string =>
  text.replace(/[^\s]+/g, (name) => defs[name] ?? name);

const extractColors = (text: string): XresourcesColors => {
  const colors: XresourcesColors = {};
  const colorPattern = /(?:^|\n)[^\s]*(?:\*|\.)color(\d+):([^\n]+)/g;
  let match: RegExpExecArray | null;

  while ((match = colorPattern.exec(text)) !== null) {
    const index = parseInt(match[1], 10);
    if (!(index in colors)) {
      colors[index] = match[2].trim();
    }
  }

  return colors;
};

export const readXresources = (): string[] => {
  const home = process.env.HOME;
  if (!home) return [];

  const text = readFileSafe(home, '.Xresources');
  if (!text) return [];

  const { cleaned, defs } = parseDefines(text);
  const expanded = expandDefines(cleaned, defs);
  const colorMap = extractColors(expanded);

  return Object.entries(colorMap)
    .sort(([a], [b]) => Number(a) - Number(b))
    .reduce<string[]>((acc, [index, color]) => {
      acc[Number(index)] = color;
      return acc;
    }, []);
};
