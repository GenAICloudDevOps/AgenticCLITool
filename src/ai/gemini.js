import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiClient {
  constructor(apiKey, config = {}) {
    if (!apiKey) {
      throw new Error('Gemini API key is required');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.config = config;
    this.model = null;
    this.chat = null;
  }

  async initialize() {
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash-lite',
      generationConfig: {
        temperature: this.config.temperature || 0.7,
        maxOutputTokens: this.config.maxTokens || 2048,
      }
    });
    this.chat = this.model.startChat({
      history: [],
    });
  }

  async sendMessage(message, history = []) {
    try {
      if (!this.chat) {
        await this.initialize();
      }

      // If history is provided, restart chat with history
      if (history.length > 0) {
        const formattedHistory = history.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        }));
        this.chat = this.model.startChat({ history: formattedHistory });
      }

      const result = await this.chat.sendMessage(message);
      const response = await result.response;
      return response.text();
    } catch (error) {
      throw new Error(`Gemini API error: ${error.message}`);
    }
  }

  async *streamMessage(message, history = []) {
    try {
      if (!this.chat) {
        await this.initialize();
      }

      // If history is provided, restart chat with history
      if (history.length > 0) {
        const formattedHistory = history.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        }));
        this.chat = this.model.startChat({ history: formattedHistory });
      }

      const result = await this.chat.sendMessageStream(message);
      
      for await (const chunk of result.stream) {
        const text = chunk.text();
        yield text;
      }
    } catch (error) {
      throw new Error(`Gemini API error: ${error.message}`);
    }
  }

  async analyzeFile(fileContent, fileName) {
    const prompt = `Analyze this file (${fileName}):\n\n${fileContent}\n\nProvide a detailed analysis including purpose, structure, and any issues or improvements.`;
    return await this.sendMessage(prompt);
  }

  async explainFile(fileContent, fileName) {
    const prompt = `Explain what this file does (${fileName}):\n\n${fileContent}\n\nProvide a clear, concise explanation.`;
    return await this.sendMessage(prompt);
  }

  async suggestCommand(question) {
    const prompt = `User asks: "${question}"\n\nSuggest the appropriate command line command to accomplish this. Provide both Windows and Linux versions if different. Format: Command: <command>`;
    return await this.sendMessage(prompt);
  }

  clearHistory() {
    this.chat = null;
  }
}
