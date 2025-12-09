// Remove export {}; statements from compiled TypeScript files
// This is needed because the files are loaded as regular scripts, not ES modules
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

const frontendJsDir = path.join(projectRoot, 'frontend', 'js');

function cleanFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;
    // Remove lone export {} statements anywhere (end or mid-file)
    content = content.replace(/\n?\s*export\s*\{\s*\};?\s*(\n|$)/g, '\n');
    // Also remove any stray ES module markers added by TS
    content = content.replace(/Object\.defineProperty\(exports,\s*"__esModule"[\s\S]*?\);?\n?/g, '');
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Cleaned ${path.basename(filePath)}`);
    }
  } catch (e) {
    // ignore
  }
}

if (fs.existsSync(frontendJsDir)) {
  const entries = fs.readdirSync(frontendJsDir);
  entries.forEach(entry => {
    if (entry.endsWith('.js')) {
      cleanFile(path.join(frontendJsDir, entry));
    }
  });
}


