// --- Lgr22 & Curriculum Types ---

export enum Grade {
  SEVEN = '7',
  EIGHT = '8',
  NINE = '9'
}

export enum AbilityTag {
  ANALYSIS = 'ANALYSIS', // Analysera tekniska lösningar
  DESIGN = 'DESIGN', // Identifiera problem och utveckla lösningar
  CONCEPTS = 'CONCEPTS', // Begrepp och uttrycksformer
  CONSEQUENCES = 'CONSEQUENCES', // Värdera konsekvenser
  DRIVERS = 'DRIVERS' // Historiska drivkrafter
}

export enum CoreContentTag {
  SOCIETY_ENV = 'SOCIETY_ENV', // Teknik, människa, samhälle & miljö
  SOLUTIONS = 'SOLUTIONS', // Tekniska lösningar
  METHODS = 'METHODS' // Arbetssätt
}

export interface Lgr22Mapping {
  abilities: AbilityTag[];
  coreContent: CoreContentTag[];
}

// --- Command Registry Types ---

export type ParamType = 'number' | 'string' | 'color' | 'boolean';

export interface ParameterDefinition {
  name: string; // Internal name (x, y, w, h)
  label: string; // UI label
  type: ParamType;
  index: number; // Position in function arguments
  min?: number;
  max?: number;
  step?: number;
  defaultValue: string | number;
}

export interface InteractionRules {
  // Map 'body' drag to specific x/y params
  position?: { x: string; y: string }; 
  // Map 'resize' drag to scalar params
  resize?: Record<string, string>; // key (e.g., 'radius') -> paramName
  // Map specific vertex points to x/y params (e.g. triangle corners)
  points?: { id: string; x: string; y: string }[];
}

export interface CommandDefinition {
  id: string; // e.g. "rect"
  functionName: string; // e.g. "rectangle" (what the student types)
  signature: string; // Help text
  params: ParameterDefinition[];
  interaction: InteractionRules;
  // Logic functions (not stored in DB, but in Runtime Registry)
  draw: (ctx: CanvasRenderingContext2D, values: Record<string, any>) => void;
  // Returns identifier string: 'body', 'resize', 'point:id', or null
  hitTest: (mouseX: number, mouseY: number, values: Record<string, any>) => string | null;
}

// --- Content Block Types ---

export enum BlockType {
  TEXT = 'text',
  IMAGE = 'image',
  QUIZ = 'quiz',
  COMMAND_LAB = 'command_lab',
  EXIT_TICKET = 'exit_ticket'
}

export interface BaseBlock {
  id: string;
  type: BlockType;
}

export interface TextBlock extends BaseBlock {
  type: BlockType.TEXT;
  content: string; // Markdown supported
}

export interface ImageBlock extends BaseBlock {
  type: BlockType.IMAGE;
  url: string;
  alt: string;
  caption?: string;
}

export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuizBlock extends BaseBlock {
  type: BlockType.QUIZ;
  question: string;
  options: QuizOption[];
  explanation: string;
}

export interface CommandLabBlock extends BaseBlock {
  type: BlockType.COMMAND_LAB;
  instruction: string;
  initialCode: string;
  targetCommandId: string; // Links to Registry (e.g. 'circle', 'rect')
}

export type ContentBlock = TextBlock | ImageBlock | QuizBlock | CommandLabBlock;

// --- Lesson Structure ---

export interface Lesson {
  id: string;
  title: string;
  grade: Grade;
  description: string;
  blocks: ContentBlock[];
  lgr22: Lgr22Mapping;
  isPublished: boolean;
  createdAt: string;
}

// --- App State & I18n ---

export type Language = 'sv' | 'en' | 'ar' | 'uk' | 'ti';

export interface User {
  role: 'teacher' | 'student';
  name: string;
}