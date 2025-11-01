import fs from 'fs';
import path from 'path';

export async function readFile(filepath) {
  try {
    const resolvedPath = path.resolve(filepath);
    
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`File not found: ${filepath}`);
    }

    const stats = fs.statSync(resolvedPath);
    if (stats.isDirectory()) {
      throw new Error(`${filepath} is a directory, not a file`);
    }

    const content = fs.readFileSync(resolvedPath, 'utf8');
    return {
      success: true,
      content,
      fileName: path.basename(filepath),
      size: stats.size
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

export async function analyzeFile(filepath, modelManager) {
  const fileResult = await readFile(filepath);
  
  if (!fileResult.success) {
    throw new Error(fileResult.error);
  }

  console.log(`\n📄 Analyzing ${fileResult.fileName} (${fileResult.size} bytes)...\n`);
  
  const analysis = await modelManager.analyzeFile(fileResult.content, fileResult.fileName);
  return analysis;
}

export async function explainFile(filepath, modelManager) {
  const fileResult = await readFile(filepath);
  
  if (!fileResult.success) {
    throw new Error(fileResult.error);
  }

  console.log(`\n📄 Explaining ${fileResult.fileName}...\n`);
  
  const explanation = await modelManager.explainFile(fileResult.content, fileResult.fileName);
  return explanation;
}

export function loadFileIntoContext(filepath, historyManager) {
  const fileResult = readFile(filepath);
  
  if (!fileResult.success) {
    throw new Error(fileResult.error);
  }

  const message = `[File loaded: ${fileResult.fileName}]\n\n${fileResult.content}`;
  historyManager.addMessage('user', message);
  
  return {
    success: true,
    fileName: fileResult.fileName,
    size: fileResult.size
  };
}
