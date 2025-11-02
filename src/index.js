#!/usr/bin/env node

import readline from 'readline';
import ora from 'ora';
import { showWelcome, formatError, formatInfo } from './utils/display.js';
import { loadConfig, getEnvConfig } from './utils/config.js';
import { ModelManager } from './ai/modelManager.js';
import { HistoryManager } from './commands/historyManager.js';
import { handleCliCommand, isCliCommand } from './commands/cliCommands.js';
import { executeSystemCommand, isSystemCommand, isSafeCommand } from './commands/systemCommands.js';

async function main() {
  try {
    // Load configuration
    const config = loadConfig();
    const envConfig = getEnvConfig();

    // Initialize model manager
    let modelStatus = 'loading';
    const modelManager = new ModelManager(envConfig, config);
    
    try {
      await modelManager.initialize();
      modelStatus = 'ready';
    } catch (error) {
      modelStatus = 'error';
      console.error(formatError('Failed to initialize AI model: ' + error.message));
    }

    // Initialize history manager
    const historyManager = new HistoryManager();

    // Show welcome screen
    showWelcome(modelManager.getCurrentModelName(), modelStatus);

    // Available commands for autocomplete
    const commands = [
      '/help', '/exit', '/quit', '/clear', '/models', '/use', '/status',
      '/history', '/clear-history', '/save-chat',
      '/read', '/analyze', '/explain',
      '/config', '/set', '/reset'
    ];

    // Autocomplete function - shows filtered commands as you type
    function completer(line) {
      const hits = commands.filter((c) => c.startsWith(line));
      
      // If line starts with / and has more characters, show filtered results
      if (line.startsWith('/') && line.length > 1) {
        return [hits, line];
      }
      
      // If just /, show all commands
      if (line === '/') {
        return [commands, line];
      }
      
      // Otherwise, show matching commands
      return [hits.length ? hits : [], line];
    }

    // Create readline interface
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: 'agenticcli> ',
      completer: completer,
      terminal: true
    });

    // Enable keypress events for real-time command filtering
    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }

    let currentInput = '';
    let commandSuggestions = [];
    let selectedIndex = 0;

    // Context object to pass to handlers
    const context = {
      modelManager,
      historyManager,
      config,
      rl
    };

    // Show initial prompt
    process.stdout.write('agenticcli> ');

    // Function to redraw the entire prompt and suggestions
    function redrawPrompt() {
      // Save cursor position
      const promptLength = 'agenticcli> '.length;
      const inputLength = currentInput.length;
      
      // Move to start of line and clear everything below
      readline.cursorTo(process.stdout, 0);
      readline.clearLine(process.stdout, 0);
      readline.clearScreenDown(process.stdout);
      
      // Draw the prompt and current input
      process.stdout.write('agenticcli> ' + currentInput);
      
      // Show suggestions if in command mode
      if (currentInput.startsWith('/') && currentInput.length >= 1) {
        const filtered = commands.filter(cmd => cmd.startsWith(currentInput));
        commandSuggestions = filtered;
        
        if (filtered.length > 0 && filtered.length <= 10) {
          // Show suggestions below
          process.stdout.write('\n');
          filtered.forEach((cmd, idx) => {
            if (idx === selectedIndex) {
              process.stdout.write(`> ${cmd}\n`);
            } else {
              process.stdout.write(`  ${cmd}\n`);
            }
          });
          // Move cursor back to input position
          readline.moveCursor(process.stdout, 0, -(filtered.length + 1));
          readline.cursorTo(process.stdout, promptLength + inputLength);
        }
      } else {
        commandSuggestions = [];
      }
    }

    // Handle keypress events
    process.stdin.on('keypress', async (str, key) => {
      if (!key) return;

      // Ctrl+C to exit
      if (key.ctrl && key.name === 'c') {
        console.log('\nAgent signing off. Goodbye! 😊\n');
        process.exit(0);
      }

      // Handle Enter key
      if (key.name === 'return') {
        // If there are suggestions and one is selected, use it
        let input = currentInput.trim();
        if (commandSuggestions.length > 0 && selectedIndex >= 0) {
          input = commandSuggestions[selectedIndex];
        }
        
        // Clear suggestions and move to new line
        readline.clearScreenDown(process.stdout);
        
        currentInput = '';
        commandSuggestions = [];
        selectedIndex = 0;

        // If empty input, just show new prompt
        if (!input) {
          console.log();
          process.stdout.write('agenticcli> ');
          return;
        }
        
        console.log();

        if (input) {
          try {
            if (isCliCommand(input)) {
              await handleCliCommand(input, context);
            } else if (isSystemCommand(input)) {
              const shouldExecute = config.autoExecuteSafe && isSafeCommand(input);
              
              if (!shouldExecute && !isSafeCommand(input)) {
                process.stdin.setRawMode(false);
                
                // Clear any pending input
                readline.clearLine(process.stdout, 0);
                
                const answer = await new Promise((resolve) => {
                  rl.question(`Execute command: ${input}? (y/n): `, (ans) => {
                    resolve(ans);
                  });
                });
                
                // Clear the answer from being processed again
                readline.clearLine(process.stdout, 0);
                process.stdin.setRawMode(true);
                
                if (answer.toLowerCase() === 'y') {
                  const result = await executeSystemCommand(input);
                  console.log(result.output);
                  historyManager.addMessage('user', `[Command: ${input}]`);
                  historyManager.addMessage('assistant', result.output);
                } else {
                  console.log(formatInfo('Command cancelled'));
                }
              } else {
                const result = await executeSystemCommand(input);
                console.log(result.output);
                historyManager.addMessage('user', `[Command: ${input}]`);
                historyManager.addMessage('assistant', result.output);
              }
            } else {
              // Show animated thinking message with spinner and dots
              const spinner = ora({
                text: 'Agent is thinking.',
                color: 'green',
                spinner: {
                  interval: 300,
                  frames: [
                    'Agent is thinking. ⠋',
                    'Agent is thinking.. ⠙',
                    'Agent is thinking... ⠹',
                    'Agent is thinking. ⠸',
                    'Agent is thinking.. ⠼',
                    'Agent is thinking... ⠴',
                    'Agent is thinking. ⠦',
                    'Agent is thinking.. ⠧',
                    'Agent is thinking... ⠇',
                    'Agent is thinking. ⠏'
                  ]
                }
              }).start();
              
              historyManager.addMessage('user', input);
              
              const history = historyManager.getContextForAI();
              
              // Stream the response
              let fullResponse = '';
              let firstChunk = true;
              for await (const chunk of modelManager.streamMessage(input, history)) {
                if (firstChunk) {
                  spinner.stop();
                  console.log(); // Add newline after spinner
                  firstChunk = false;
                }
                process.stdout.write(chunk);
                fullResponse += chunk;
              }
              
              console.log('\n');
              
              historyManager.addMessage('assistant', fullResponse);
            }
          } catch (error) {
            console.log(formatError(error.message));
          }
          
          // Only show new prompt after processing input
          process.stdout.write('agenticcli> ');
        }
        // Don't show extra prompt for empty input - it's already shown
        return;
      }

      // Handle Backspace
      if (key.name === 'backspace') {
        if (currentInput.length > 0) {
          currentInput = currentInput.slice(0, -1);
          redrawPrompt();
        }
        return;
      }

      // Handle arrow keys for navigation
      if (key.name === 'up' && commandSuggestions.length > 0) {
        selectedIndex = Math.max(0, selectedIndex - 1);
        redrawPrompt();
        return;
      }

      if (key.name === 'down' && commandSuggestions.length > 0) {
        selectedIndex = Math.min(commandSuggestions.length - 1, selectedIndex + 1);
        redrawPrompt();
        return;
      }

      // Handle Tab to select suggestion
      if (key.name === 'tab' && commandSuggestions.length > 0) {
        currentInput = commandSuggestions[selectedIndex];
        redrawPrompt();
        return;
      }

      // Handle regular character input
      if (str && !key.ctrl && !key.meta && str.length === 1 && key.name !== 'return') {
        currentInput += str;
        redrawPrompt();
      }
    });

    // Keep line handler for compatibility but keypress handles most input now
    rl.on('line', () => {
      // Handled by keypress events
    });

    rl.on('close', () => {
      console.log('\nAgent signing off. Goodbye! 😊\n');
      process.exit(0);
    });

  } catch (error) {
    console.error(formatError(`Failed to start AgenticCLI: ${error.message}`));
    console.error('\nPlease check your configuration and try again.');
    process.exit(1);
  }
}

main();
