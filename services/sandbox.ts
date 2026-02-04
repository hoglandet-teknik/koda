import { COMMAND_REGISTRY } from "./commandRegistry";

// Safety check to prevent malicious code
const SAFE_KEYWORDS = ['var', 'let', 'const', 'for', 'if', 'else', 'Math'];
const REGISTRY_KEYWORDS = Object.values(COMMAND_REGISTRY).map(c => c.functionName);

export const validateCode = (code: string): boolean => {
  if (code.includes('window') || code.includes('document') || code.includes('fetch') || code.includes('alert')) {
    return false;
  }
  if (code.includes('while') || code.includes('do')) {
    return false;
  }
  return true;
};

// Execution context for the canvas
export const executeCode = (code: string, ctx: CanvasRenderingContext2D, width: number, height: number) => {
  if (!validateCode(code)) {
    throw new Error("Säkerhetsvarning: Ogiltig kod upptäckt.");
  }

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Dynamically build the API object based on the registry
  const api: Record<string, Function> = {};

  Object.values(COMMAND_REGISTRY).forEach(cmd => {
    // args will be the raw arguments passed by the student, e.g. (100, 100, 50, "red")
    api[cmd.functionName] = (...args: any[]) => {
      // Map arguments to parameter names
      const values: Record<string, any> = {};
      cmd.params.forEach((param, i) => {
        values[param.name] = args[i] !== undefined ? args[i] : param.defaultValue;
      });
      // Call the draw implementation
      cmd.draw(ctx, values);
    };
  });

  try {
    // Isolate execution. We pass the dynamic API function names as arguments to the Function constructor.
    const apiKeys = Object.keys(api);
    const apiValues = Object.values(api);

    const run = new Function(...apiKeys, 'width', 'height', `"use strict"; ${code}`);
    run(...apiValues, width, height);
  } catch (e: any) {
    throw new Error(`Körningsfel: ${e.message}`);
  }
};

// Generic parser to extract parameter values
export const parseCommandParams = (code: string, command: string): (string | number)[] | null => {
  // Regex to find: command( arg1, arg2... )
  // We match the command name followed directly by (
  const regex = new RegExp(`${command}\\s*\\(([^)]+)\\)`);
  const match = code.match(regex);
  if (!match) return null;

  const argsStr = match[1];
  
  // Robust CSV parser that ignores commas inside quotes
  const args: (string | number)[] = [];
  let current = '';
  let inQuote = false;
  let quoteChar = '';

  for (let i = 0; i < argsStr.length; i++) {
    const char = argsStr[i];
    if ((char === '"' || char === "'")) {
      if (!inQuote) {
        inQuote = true;
        quoteChar = char;
      } else if (char === quoteChar) {
        inQuote = false;
      }
      current += char;
    } else if (char === ',' && !inQuote) {
      args.push(cleanArg(current));
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) {
      args.push(cleanArg(current));
  }
  return args;
};

const cleanArg = (raw: string): string | number => {
  const trimmed = raw.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  const num = parseFloat(trimmed);
  return isNaN(num) ? trimmed : num;
};

// Reconstructor
export const updateCodeParams = (originalCode: string, command: string, newParams: (string | number)[]): string => {
  const regex = new RegExp(`${command}\\s*\\(([^)]+)\\)`);
  const paramString = newParams.map(p => typeof p === 'string' ? `"${p}"` : p).join(', ');
  return originalCode.replace(regex, `${command}(${paramString})`);
};
