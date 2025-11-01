import { clearScreen, showHelp, formatSuccess, formatError, formatInfo } from '../utils/display.js';
import { saveConfig, resetConfig } from '../utils/config.js';
import { analyzeFile, explainFile, readFile } from './fileCommands.js';
import readline from 'readline';
import inquirer from 'inquirer';
import autocomplete from 'inquirer-autocomplete-prompt';

// Register autocomplete prompt
inquirer.registerPrompt('autocomplete', autocomplete);

export async function handleCliCommand(input, context) {
  const { modelManager, historyManager, config, rl } = context;
  const parts = input.trim().split(' ');
  const command = parts[0].toLowerCase();
  const args = parts.slice(1);

  try {
    // If just "/" is typed, show autocomplete command menu
    if (command === '/') {
      await showAutocompleteMenu(context);
      return;
    }

    switch (command) {
      case '/help':
        showHelp();
        break;

      case '/exit':
      case '/quit':
        console.log('\nAgent signing off. Goodbye! 😊\n');
        process.exit(0);

      case '/clear':
        clearScreen();
        break;

      case '/models':
        const models = modelManager.getAvailableModels();
        console.log('\nAvailable Models:\n');
        models.forEach(model => {
          const status = model.active ? '[ACTIVE]' : '';
          console.log(`  ${model.name} ${status}`);
        });
        console.log();
        break;

      case '/use':
        if (args.length === 0) {
          console.log(formatError('Please specify a model: /use gemini or /use bedrock'));
          break;
        }
        modelManager.switchModel(args[0]);
        console.log(formatSuccess(`Switched to ${args[0]}`));
        break;

      case '/status':
        console.log('\nCurrent Status:\n');
        console.log(`Model: ${modelManager.getCurrentModelName()}`);
        console.log(`Temperature: ${config.temperature}`);
        console.log(`Max Tokens: ${config.maxTokens}`);
        console.log(`Auto-execute safe commands: ${config.autoExecuteSafe}`);
        console.log(`History entries: ${historyManager.getHistory().length}\n`);
        break;

      case '/history':
        historyManager.displayHistory();
        break;

      case '/clear-history':
        historyManager.clearHistory();
        modelManager.clearHistory();
        console.log(formatSuccess('Conversation history cleared'));
        break;

      case '/save-chat':
        if (args.length === 0) {
          console.log(formatError('Please specify a filename: /save-chat filename.txt'));
          break;
        }
        const filepath = await historyManager.saveToFile(args[0]);
        console.log(formatSuccess(`Chat saved to: ${filepath}`));
        break;

      case '/read':
        if (args.length === 0) {
          console.log(formatError('Please specify a file: /read filename'));
          break;
        }
        const readResult = await readFile(args[0]);
        if (readResult.success) {
          historyManager.addMessage('user', `[File: ${readResult.fileName}]\n${readResult.content}`);
          console.log(formatSuccess(`Loaded ${readResult.fileName} (${readResult.size} bytes) into context`));
        } else {
          console.log(formatError(readResult.error));
        }
        break;

      case '/analyze':
        if (args.length === 0) {
          console.log(formatError('Please specify a file: /analyze filename'));
          break;
        }
        const analysis = await analyzeFile(args[0], modelManager);
        console.log(analysis);
        historyManager.addMessage('user', `/analyze ${args[0]}`);
        historyManager.addMessage('assistant', analysis);
        break;

      case '/explain':
        if (args.length === 0) {
          console.log(formatError('Please specify a file: /explain filename'));
          break;
        }
        const explanation = await explainFile(args[0], modelManager);
        console.log(explanation);
        historyManager.addMessage('user', `/explain ${args[0]}`);
        historyManager.addMessage('assistant', explanation);
        break;

      case '/config':
        console.log('\nCurrent Configuration:\n');
        Object.entries(config).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });
        console.log();
        break;

      case '/set':
        if (args.length < 2) {
          console.log(formatError('Usage: /set <key> <value>'));
          break;
        }
        const key = args[0];
        let value = args.slice(1).join(' ');
        
        // Type conversion
        if (value === 'true') value = true;
        else if (value === 'false') value = false;
        else if (!isNaN(value)) value = parseFloat(value);
        
        config[key] = value;
        saveConfig(config);
        console.log(formatSuccess(`Set ${key} = ${value}`));
        break;

      case '/reset':
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });
        
        rl.question('Reset all settings to defaults? (y/n): ', (answer) => {
          if (answer.toLowerCase() === 'y') {
            const newConfig = resetConfig();
            Object.assign(config, newConfig);
            console.log(formatSuccess('Configuration reset to defaults'));
          } else {
            console.log(formatInfo('Reset cancelled'));
          }
          rl.close();
        });
        break;

      default:
        console.log(formatError(`Unknown command: ${command}. Type /help for available commands.`));
    }
  } catch (error) {
    console.log(formatError(error.message));
  }
}

export function isCliCommand(input) {
  return input.trim().startsWith('/');
}

async function showAutocompleteMenu(context) {
  const { modelManager, historyManager, config, rl } = context;
  
  const choices = [
    { name: '/help - Show help message', value: '/help' },
    { name: '/exit - Exit AgenticCLI', value: '/exit' },
    { name: '/quit - Exit AgenticCLI', value: '/quit' },
    { name: '/clear - Clear screen', value: '/clear' },
    { name: '/models - List available AI models', value: '/models' },
    { name: '/use - Switch AI model', value: '/use' },
    { name: '/status - Show current status', value: '/status' },
    { name: '/history - Show conversation history', value: '/history' },
    { name: '/clear-history - Clear conversation context', value: '/clear-history' },
    { name: '/save-chat - Export chat to file', value: '/save-chat' },
    { name: '/read - Load file into context', value: '/read' },
    { name: '/analyze - AI analyzes the file', value: '/analyze' },
    { name: '/explain - AI explains the file', value: '/explain' },
    { name: '/config - Show current settings', value: '/config' },
    { name: '/set - Update setting', value: '/set' },
    { name: '/reset - Reset to defaults', value: '/reset' },
    { name: 'Cancel', value: 'cancel' }
  ];

  const answer = await inquirer.prompt([
    {
      type: 'autocomplete',
      name: 'command',
      message: 'Type to filter commands:',
      source: async (answersSoFar, input) => {
        input = input || '';
        return choices.filter(choice => {
          if (choice.value === 'cancel') return true;
          // Filter by command name (value) - so /f shows /file commands
          return choice.value.toLowerCase().includes(input.toLowerCase()) ||
                 choice.name.toLowerCase().includes(input.toLowerCase());
        });
      },
      pageSize: 15,
      suggestOnly: false
    }
  ]);

  if (answer.command === 'cancel') {
    return;
  }

  // Handle commands that need additional input
  if (answer.command === '/use') {
    const models = modelManager.getAvailableModels();
    const modelAnswer = await inquirer.prompt([
      {
        type: 'list',
        name: 'model',
        message: 'Select AI model:',
        choices: models.map(m => ({
          name: m.active ? `${m.name} [ACTIVE]` : m.name,
          value: m.name
        }))
      }
    ]);
    await handleCliCommand(`/use ${modelAnswer.model}`, context);
  } else if (answer.command === '/save-chat') {
    const fileAnswer = await inquirer.prompt([
      {
        type: 'input',
        name: 'filename',
        message: 'Enter filename:',
        default: 'chat-session.txt'
      }
    ]);
    await handleCliCommand(`/save-chat ${fileAnswer.filename}`, context);
  } else if (answer.command === '/read') {
    const fileAnswer = await inquirer.prompt([
      {
        type: 'input',
        name: 'filename',
        message: 'Enter filename to read:'
      }
    ]);
    if (fileAnswer.filename) {
      await handleCliCommand(`/read ${fileAnswer.filename}`, context);
    }
  } else if (answer.command === '/analyze') {
    const fileAnswer = await inquirer.prompt([
      {
        type: 'input',
        name: 'filename',
        message: 'Enter filename to analyze:'
      }
    ]);
    if (fileAnswer.filename) {
      await handleCliCommand(`/analyze ${fileAnswer.filename}`, context);
    }
  } else if (answer.command === '/explain') {
    const fileAnswer = await inquirer.prompt([
      {
        type: 'input',
        name: 'filename',
        message: 'Enter filename to explain:'
      }
    ]);
    if (fileAnswer.filename) {
      await handleCliCommand(`/explain ${fileAnswer.filename}`, context);
    }
  } else if (answer.command === '/set') {
    const setAnswer = await inquirer.prompt([
      {
        type: 'input',
        name: 'key',
        message: 'Enter setting key:'
      },
      {
        type: 'input',
        name: 'value',
        message: 'Enter setting value:'
      }
    ]);
    if (setAnswer.key && setAnswer.value) {
      await handleCliCommand(`/set ${setAnswer.key} ${setAnswer.value}`, context);
    }
  } else {
    // Execute the selected command
    await handleCliCommand(answer.command, context);
  }
}
