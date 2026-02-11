#!/usr/bin/env node

import { Command, Option } from 'commander';
import { startCommand } from './commands/start.js';
import { versionCommand } from './commands/version.js';

const program = new Command();

program
  .name('tty.js')
  .description('A terminal for your browser');

program
  .option('-v, --version', 'output the version number')
  .option('-p, --port <number>', 'port to listen on', parseInt)
  .option('-c, --config <path>', 'path to config file')
  .addOption(new Option('--local').hideHelp())
  .action(async (options) => {
    if (options.version) {
      versionCommand();
      return;
    }

    await startCommand({
      port: options.port,
      config: options.config,
    });
  });

program.parse();
