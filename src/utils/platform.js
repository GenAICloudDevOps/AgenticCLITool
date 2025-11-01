import os from 'os';

export function isWindows() {
  return os.platform() === 'win32';
}

export function mapCommand(command) {
  if (!isWindows()) {
    return command;
  }

  const parts = command.trim().split(' ');
  const cmd = parts[0];
  const args = parts.slice(1).join(' ');

  const commandMap = {
    'ls': `dir ${args}`,
    'cat': `type ${args}`,
    'rm': `del ${args}`,
    'cp': `copy ${args}`,
    'mv': `move ${args}`,
    'pwd': 'cd'
  };

  return commandMap[cmd] || command;
}

export function getPlatformInfo() {
  return {
    platform: os.platform(),
    type: os.type(),
    release: os.release(),
    arch: os.arch()
  };
}
