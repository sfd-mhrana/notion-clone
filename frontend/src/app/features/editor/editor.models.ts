export enum BlockType {
  PARAGRAPH = 'paragraph',
  HEADING_1 = 'heading_1',
  HEADING_2 = 'heading_2',
  HEADING_3 = 'heading_3',
  BULLETED_LIST = 'bulleted_list_item',
  NUMBERED_LIST = 'numbered_list_item',
  TODO = 'to_do',
  QUOTE = 'quote',
  CALLOUT = 'callout',
  DIVIDER = 'divider',
  CODE = 'code',
  IMAGE = 'image',
  FILE = 'file',
  VIDEO = 'video',
  BOOKMARK = 'bookmark',
  TOGGLE = 'toggle',
  TABLE_OF_CONTENTS = 'table_of_contents',
}

export interface TextContent {
  text: string;
  annotations?: TextAnnotations;
}

export interface TextAnnotations {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
  color?: string;
}

export interface RichText {
  type: 'text' | 'mention' | 'equation';
  text?: TextContent;
  annotations: TextAnnotations;
  plain_text: string;
  href?: string;
}

export interface BlockContent {
  rich_text?: RichText[];
  checked?: boolean;
  language?: string;
  caption?: RichText[];
  url?: string;
  icon?: string;
  color?: string;
  file?: {
    url: string;
    name: string;
    size?: number;
  };
}

export interface Block {
  id: string;
  type: BlockType;
  pageId: string;
  parentBlockId: string | null;
  content: BlockContent;
  order: number;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  children?: Block[];
}

export interface SlashCommandItem {
  id: string;
  label: string;
  description: string;
  icon: string;
  blockType: BlockType;
  keywords: string[];
}

export const SLASH_COMMANDS: SlashCommandItem[] = [
  {
    id: 'text',
    label: 'Text',
    description: 'Just start writing with plain text',
    icon: 'text_fields',
    blockType: BlockType.PARAGRAPH,
    keywords: ['text', 'paragraph', 'plain'],
  },
  {
    id: 'h1',
    label: 'Heading 1',
    description: 'Big section heading',
    icon: 'title',
    blockType: BlockType.HEADING_1,
    keywords: ['h1', 'heading', 'title', 'big'],
  },
  {
    id: 'h2',
    label: 'Heading 2',
    description: 'Medium section heading',
    icon: 'text_fields',
    blockType: BlockType.HEADING_2,
    keywords: ['h2', 'heading', 'subtitle'],
  },
  {
    id: 'h3',
    label: 'Heading 3',
    description: 'Small section heading',
    icon: 'text_fields',
    blockType: BlockType.HEADING_3,
    keywords: ['h3', 'heading', 'small'],
  },
  {
    id: 'bullet',
    label: 'Bulleted List',
    description: 'Create a simple bulleted list',
    icon: 'format_list_bulleted',
    blockType: BlockType.BULLETED_LIST,
    keywords: ['bullet', 'list', 'unordered'],
  },
  {
    id: 'number',
    label: 'Numbered List',
    description: 'Create a numbered list',
    icon: 'format_list_numbered',
    blockType: BlockType.NUMBERED_LIST,
    keywords: ['number', 'list', 'ordered'],
  },
  {
    id: 'todo',
    label: 'To-do List',
    description: 'Track tasks with a to-do list',
    icon: 'check_box',
    blockType: BlockType.TODO,
    keywords: ['todo', 'task', 'checkbox', 'check'],
  },
  {
    id: 'quote',
    label: 'Quote',
    description: 'Capture a quote',
    icon: 'format_quote',
    blockType: BlockType.QUOTE,
    keywords: ['quote', 'blockquote'],
  },
  {
    id: 'callout',
    label: 'Callout',
    description: 'Make writing stand out',
    icon: 'lightbulb',
    blockType: BlockType.CALLOUT,
    keywords: ['callout', 'note', 'tip', 'warning'],
  },
  {
    id: 'divider',
    label: 'Divider',
    description: 'Visually divide blocks',
    icon: 'horizontal_rule',
    blockType: BlockType.DIVIDER,
    keywords: ['divider', 'line', 'separator', 'hr'],
  },
  {
    id: 'code',
    label: 'Code',
    description: 'Capture a code snippet',
    icon: 'code',
    blockType: BlockType.CODE,
    keywords: ['code', 'snippet', 'programming'],
  },
  {
    id: 'image',
    label: 'Image',
    description: 'Upload or embed an image',
    icon: 'image',
    blockType: BlockType.IMAGE,
    keywords: ['image', 'picture', 'photo'],
  },
  {
    id: 'file',
    label: 'File',
    description: 'Upload a file',
    icon: 'attach_file',
    blockType: BlockType.FILE,
    keywords: ['file', 'upload', 'attachment'],
  },
];

export const PROGRAMMING_LANGUAGES = [
  { id: 'javascript', name: 'JavaScript' },
  { id: 'typescript', name: 'TypeScript' },
  { id: 'python', name: 'Python' },
  { id: 'java', name: 'Java' },
  { id: 'csharp', name: 'C#' },
  { id: 'cpp', name: 'C++' },
  { id: 'go', name: 'Go' },
  { id: 'rust', name: 'Rust' },
  { id: 'ruby', name: 'Ruby' },
  { id: 'php', name: 'PHP' },
  { id: 'swift', name: 'Swift' },
  { id: 'kotlin', name: 'Kotlin' },
  { id: 'html', name: 'HTML' },
  { id: 'css', name: 'CSS' },
  { id: 'sql', name: 'SQL' },
  { id: 'shell', name: 'Shell' },
  { id: 'json', name: 'JSON' },
  { id: 'yaml', name: 'YAML' },
  { id: 'markdown', name: 'Markdown' },
  { id: 'plaintext', name: 'Plain Text' },
];
