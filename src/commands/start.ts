import { readConfig } from '../config/index.js';
import { createServer } from '../server/index.js';
import { createBanner } from '../utils/banner.js';

export const startCommand = async (options: { port?: number; config?: string }): Promise<void> => {
  console.log(createBanner());
  console.log();

  const conf = readConfig(options.config);

  if (options.port) {
    conf.port = options.port;
  }

  const server = createServer(conf);
  await server.listen();
};
