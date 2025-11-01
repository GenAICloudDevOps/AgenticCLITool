import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

export class BedrockClient {
  constructor(credentials, config = {}) {
    if (!credentials.accessKeyId || !credentials.secretAccessKey) {
      throw new Error('AWS credentials are required');
    }
    
    this.client = new BedrockRuntimeClient({
      region: credentials.region || 'us-east-1',
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey
      }
    });
    
    this.config = config;
    this.modelId = 'us.amazon.nova-micro-v1:0';
    this.conversationHistory = [];
  }

  async sendMessage(message, history = []) {
    try {
      const messages = history.length > 0 
        ? [...history, { role: 'user', content: message }]
        : [{ role: 'user', content: message }];

      const payload = {
        messages: messages.map(msg => ({
          role: msg.role,
          content: [{ text: msg.content }]
        })),
        inferenceConfig: {
          temperature: this.config.temperature || 0.7,
          maxTokens: this.config.maxTokens || 2048
        }
      };

      const command = new InvokeModelCommand({
        modelId: this.modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(payload)
      });

      const response = await this.client.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      return responseBody.output.message.content[0].text;
    } catch (error) {
      throw new Error(`Bedrock API error: ${error.message}`);
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
    this.conversationHistory = [];
  }
}
