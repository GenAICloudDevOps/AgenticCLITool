export function showWelcome(model, modelStatus = 'ready') {
  // ANSI color codes
  const yellow = '\x1b[33m'; // Yellow color
  const green = '\x1b[32m';
  const bold = '\x1b[1m';
  const reset = '\x1b[0m';
  
  // Check API status
  const hasGemini = !!process.env.GEMINI_API_KEY;
  const hasBedrock = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
  
  let apiStatus = '';
  if (hasGemini || hasBedrock) {
    apiStatus = green + '● Connected' + reset;
  } else {
    apiStatus = '\x1b[31m● No Keys' + reset;
  }
  
  // Check Model status
  let modelStatusDisplay = '';
  if (modelStatus === 'ready') {
    modelStatusDisplay = green + '● Ready' + reset;
  } else if (modelStatus === 'error') {
    modelStatusDisplay = '\x1b[31m● Error' + reset;
  } else {
    modelStatusDisplay = '\x1b[33m● Loading' + reset;
  }
  
  console.log('\n');
  console.log(yellow + bold);
  console.log('  ╔═══════════════════════════════════════════════════════════════╗');
  console.log('  ║                                                               ║');
  console.log('  ║                                                               ║');
  console.log('  ║   █████╗  ██████╗ ███████╗███╗   ██╗████████╗██╗ ██████╗    ║');
  console.log('  ║  ██╔══██╗██╔════╝ ██╔════╝████╗  ██║╚══██╔══╝██║██╔════╝    ║');
  console.log('  ║  ███████║██║  ███╗█████╗  ██╔██╗ ██║   ██║   ██║██║         ║');
  console.log('  ║  ██╔══██║██║   ██║██╔══╝  ██║╚██╗██║   ██║   ██║██║         ║');
  console.log('  ║  ██║  ██║╚██████╔╝███████╗██║ ╚████║   ██║   ██║╚██████╗    ║');
  console.log('  ║  ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚═╝ ╚═════╝    ║');
  console.log('  ║                                                               ║');
  console.log(reset + '  ║   ██████╗██╗     ██╗   ' + reset + 'V1.0 Beta' + yellow + bold + '                            ║');
  console.log('  ║  ██╔════╝██║     ██║                                         ║');
  console.log('  ║  ██║     ██║     ██║                                         ║');
  console.log('  ║  ██║     ██║     ██║                                         ║');
  console.log('  ║  ╚██████╗███████╗██║                                         ║');
  console.log('  ║   ╚═════╝╚══════╝╚═╝                                         ║');
  console.log('  ║                                                               ║');
  console.log('  ║                                                               ║');
  console.log('  ║              Your AI-Powered Command Line Tool                ║');
  console.log('  ║                                                               ║');
  console.log(reset + '  ║  Status: ' + green + '● Online' + reset + '    Model: ' + modelStatusDisplay + '    API: ' + apiStatus + '              ║' + yellow + bold);
  console.log(reset + '  ║  Type /help for available commands                            ║' + yellow + bold);
  console.log('  ║                                                               ║');
  console.log('  ╚═══════════════════════════════════════════════════════════════╝');
  console.log(reset);
  console.log('\n  Active Model: ' + model + '\n');
}

export function showHelp() {
  console.log('\nAvailable Commands:\n');
  console.log('CLI Commands:');
  console.log('  /help              - Show this help message');
  console.log('  /exit, /quit       - Exit AgenticCLI');
  console.log('  /clear             - Clear screen');
  console.log('  /models            - List available AI models');
  console.log('  /use <model>       - Switch AI model (gemini/bedrock)');
  console.log('  /status            - Show current configuration\n');
  
  console.log('History Commands:');
  console.log('  /history           - Show conversation history');
  console.log('  /clear-history     - Clear conversation context');
  console.log('  /save-chat <file>  - Export chat to file\n');
  
  console.log('File Commands:');
  console.log('  /read <file>       - Load file into context');
  console.log('  /analyze <file>    - AI analyzes the file');
  console.log('  /explain <file>    - AI explains what the file does\n');
  
  console.log('Configuration Commands:');
  console.log('  /config            - Show current settings');
  console.log('  /set <key> <value> - Update setting');
  console.log('  /reset             - Reset to defaults\n');
  
  console.log('System Commands:');
  console.log('  Just type regular commands: ls, pwd, cd, cat, etc.\n');
  
  console.log('AI Queries:');
  console.log('  Type any question to ask the AI\n');
}

export function clearScreen() {
  console.clear();
}

export function formatError(message) {
  return `Error: ${message}`;
}

export function formatSuccess(message) {
  return `Success: ${message}`;
}

export function formatInfo(message) {
  return `Info: ${message}`;
}
