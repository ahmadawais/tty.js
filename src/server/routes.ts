import fs from 'node:fs';
import type { Express, Request, Response } from 'express';
import type { TtyConfig } from '../types/index.js';

const applyConfigScript = `
(function() {
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  for (var key in Terminal._opts) {
    if (!hasOwnProperty.call(Terminal._opts, key)) continue;
    if (typeof Terminal._opts[key] === 'object' && Terminal._opts[key]) {
      if (!Terminal[key]) {
        Terminal[key] = Terminal._opts[key];
        continue;
      }
      for (var k in Terminal._opts[key]) {
        if (hasOwnProperty.call(Terminal._opts[key], k)) {
          Terminal[key][k] = Terminal._opts[key][k];
        }
      }
    } else {
      Terminal[key] = Terminal._opts[key];
    }
  }
  delete Terminal._opts;
})();
`;

export const createRoutes = (app: Express, conf: TtyConfig): void => {
  app.get('/options.js', (_req: Request, res: Response) => {
    res.contentType('.js');

    fs.readFile(conf.json, 'utf8', (_err, data) => {
      let parsed: Record<string, unknown> = {};
      try {
        parsed = JSON.parse(data) ?? {};
      } catch {
        parsed = {};
      }

      const fileTerm = (parsed.term ?? {}) as Record<string, unknown>;
      const termConf = { ...conf.term };

      for (const key of Object.keys(fileTerm)) {
        (termConf as Record<string, unknown>)[key] = fileTerm[key];
      }

      res.send(
        `Terminal._opts = ${JSON.stringify(termConf, null, 2)};\n${applyConfigScript}`,
      );
    });
  });
};
