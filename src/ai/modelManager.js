import { GeminiClient } from './gemini.js';
import { BedrockClient } from './bedrock.js';

export class ModelManager {
  constructor(envConfig, userConfig) {
    this.envConfig = envConfig;
    this.userConfig = userConfig;
    this.currentModel = null;
    this.currentModelName = userConfig.defaultModel || 'gemini';
    this.clients = {};
  }

  async initialize() {
    try {
      // Initialize Gemini if API key exists
      if (this.envConfig.geminiApiKey) {
        this.clients.gemini = new GeminiClient(this.envConfig.geminiApiKey, this.userConfig);
        await this.clients.gemini.initialize();
      }

      // Initialize Bedrock if credentials exist
      if (this.envConfig.awsAccessKeyId && this.envConfig.awsSecretAccessKey) {
        this.clients.bedrock = new BedrockClient({
          accessKeyId: this.envConfig.awsAccessKeyId,
          secretAccessKey: this.envConfig.awsSecretAccessKey,
          region: this.envConfig.awsRegion
        }, this.userConfig);
      }

      // Set current model
      if (this.clients[this.currentModelName]) {
        this.currentModel = this.clients[this.currentModelName];
      } else {
        // Fallback to first available model
        const availableModels = Object.keys(this.clients);
        if (availableModels.length > 0) {
          this.currentModelName = availableModels[0];
          this.currentModel = this.clients[this.currentModelName];
        } else {
          throw new Error('No AI models configured. Please check your .env file.');
        }
      }
    } catch (error) {
      throw new Error(`Failed to initialize models: ${error.message}`);
    }
  }

  switchModel(modelName) {
    if (!this.clients[modelName]) {
      throw new Error(`Model '${modelName}' is not available. Check your .env configuration.`);
    }
    this.currentModel = this.clients[modelName];
    this.currentModelName = modelName;
    return true;
  }

  getAvailableModels() {
    return Object.keys(this.clients).map(name => ({
      name,
      active: name === this.currentModelName
    }));
  }

  getCurrentModelName() {
    return this.currentModelName;
  }

  async sendMessage(message, history = []) {
    if (!this.currentModel) {
      throw new Error('No model is currently active');
    }
    return await this.currentModel.sendMessage(message, history);
  }

  async *streamMessage(message, history = []) {
    if (!this.currentModel) {
      throw new Error('No model is currently active');
    }
    yield* this.currentModel.streamMessage(message, history);
  }

  async analyzeFile(fileContent, fileName) {
    if (!this.currentModel) {
      throw new Error('No model is currently active');
    }
    return await this.currentModel.analyzeFile(fileContent, fileName);
  }

  async explainFile(fileContent, fileName) {
    if (!this.currentModel) {
      throw new Error('No model is currently active');
    }
    return await this.currentModel.explainFile(fileContent, fileName);
  }

  async suggestCommand(question) {
    if (!this.currentModel) {
      throw new Error('No model is currently active');
    }
    return await this.currentModel.suggestCommand(question);
  }

  clearHistory() {
    if (this.currentModel) {
      this.currentModel.clearHistory();
    }
  }
}
