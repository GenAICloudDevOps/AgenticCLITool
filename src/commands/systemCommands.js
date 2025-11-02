import { exec } from 'child_process';
import { promisify } from 'util';
import { mapCommand } from '../utils/platform.js';

const execAsync = promisify(exec);

const SAFE_COMMANDS = ['ls', 'dir', 'pwd', 'cd', 'echo', 'date', 'whoami', 'hostname', 'code', 'start', 'slack', 'excel', 'winword', 'word', 'kiro', 'notepad++', 'git-bash', 'chrome'];

export function isSafeCommand(command) {
  const cmd = command.trim().split(' ')[0].toLowerCase();
  return SAFE_COMMANDS.includes(cmd);
}

function mapApplicationCommand(command) {
  const parts = command.trim().split(' ');
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1).join(' ');
  
  // Map application names to Windows start commands
  const appMap = {
    'excel': 'start excel',
    'winword': 'start winword',
    'word': 'start winword',
    'slack': 'start "" "%LOCALAPPDATA%\\slack\\slack.exe"',
    'kiro': 'start kiro',
    'notepad++': 'start notepad++',
    'git-bash': '"C:\\Program Files\\Git\\git-bash.exe"',
    'chrome': 'start chrome'
  };
  
  if (appMap[cmd]) {
    return args ? `${appMap[cmd]} ${args}` : appMap[cmd];
  }
  
  return command;
}

export async function executeSystemCommand(command) {
  try {
    // First map application commands
    let mappedCommand = mapApplicationCommand(command);
    // Then apply platform-specific mappings
    mappedCommand = mapCommand(mappedCommand);
    
    const { stdout, stderr } = await execAsync(mappedCommand, {
      shell: true,
      timeout: 30000 // 30 second timeout
    });

    if (stderr && !stdout) {
      return { success: false, output: stderr };
    }

    return { success: true, output: stdout || stderr };
  } catch (error) {
    return { 
      success: false, 
      output: error.message || 'Command execution failed' 
    };
  }
}

export function isSystemCommand(input) {
  const trimmed = input.trim().toLowerCase();
  
  // If it starts with a question word, it's not a system command
  const questionWords = ['what', 'why', 'how', 'when', 'where', 'who', 'which', 'can', 'could', 'would', 'should', 'is', 'are', 'do', 'does', 'tell', 'explain', 'describe', 'show'];
  if (questionWords.some(word => trimmed.startsWith(word + ' '))) {
    return false;
  }
  
  // Known system commands
  const knownCommands = ['ls', 'dir', 'pwd', 'cd', 'cat', 'type', 'echo', 'mkdir', 'rm', 'del', 'cp', 'copy', 'mv', 'move', 'touch', 'whoami', 'hostname', 'date', 'clear', 'cls', 'grep', 'find', 'curl', 'wget', 'git', 'npm', 'node', 'python', 'pip', 'code', 'excel', 'winword', 'word', 'slack', 'kiro', 'notepad++', 'start', 'git-bash', 'chrome'];
  
  const firstWord = trimmed.split(' ')[0];
  return knownCommands.includes(firstWord);
}
