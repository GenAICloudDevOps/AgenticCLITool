import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import os from 'os';

dotenv.config();

const CONFIG_FILE = path.join(os.homedir(), '.agenticcli-config.json');

const DEFAULT_CONFIG = {
  defaultModel: process.env.DEFAULT_MODEL || 'gemini',
  temperature: 0.7,
  maxTokens: 2048,
  colorEnabled: true,
  autoExecuteSafe: false
};

export function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf8');
      return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
    }
  } catch (error) {
    console.error('Error loading config:', error.message);
  }
  return DEFAULT_CONFIG;
}

export function saveConfig(config) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving config:', error.message);
    return false;
  }
}

export function resetConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      fs.unlinkSync(CONFIG_FILE);
    }
    return DEFAULT_CONFIG;
  } catch (error) {
    console.error('Error resetting config:', error.message);
    return DEFAULT_CONFIG;
  }
}

export function getEnvConfig() {
  return {
    geminiApiKey: process.env.GEMINI_API_KEY,
    awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
    awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    awsRegion: process.env.AWS_REGION || 'us-east-1'
  };
}
