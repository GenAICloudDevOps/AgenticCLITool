import fs from 'fs';
import path from 'path';

export class HistoryManager {
  constructor() {
    this.history = [];
  }

  addMessage(role, content) {
    this.history.push({
      role,
      content,
      timestamp: new Date().toISOString()
    });
  }

  getHistory() {
    return this.history;
  }

  getFormattedHistory() {
    return this.history.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }

  clearHistory() {
    this.history = [];
  }

  displayHistory() {
    if (this.history.length === 0) {
      console.log('\nNo conversation history yet.\n');
      return;
    }

    console.log('\nConversation History:\n');
    this.history.forEach((msg, index) => {
      const time = new Date(msg.timestamp).toLocaleTimeString();
      const prefix = msg.role === 'user' ? 'You' : 'AI';
      console.log(`[${time}] ${prefix}:`);
      console.log(`${msg.content}\n`);
    });
  }

  async saveToFile(filename) {
    try {
      const filepath = path.resolve(filename);
      let content = '=== AgenticCLI Chat History ===\n';
      content += `Saved: ${new Date().toLocaleString()}\n`;
      content += '================================\n\n';

      this.history.forEach((msg, index) => {
        const time = new Date(msg.timestamp).toLocaleTimeString();
        const prefix = msg.role === 'user' ? 'You' : 'AI';
        content += `[${time}] ${prefix}:\n${msg.content}\n\n`;
      });

      fs.writeFileSync(filepath, content, 'utf8');
      return filepath;
    } catch (error) {
      throw new Error(`Failed to save chat: ${error.message}`);
    }
  }

  getContextForAI() {
    // Return last N messages for AI context (to avoid token limits)
    const maxMessages = 10;
    return this.history.slice(-maxMessages).map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }
}
