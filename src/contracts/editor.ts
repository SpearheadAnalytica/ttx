/**
 * Editor contracts — Tiptap editor variant types and configuration.
 *
 * Each context in the app uses a different editor configuration.
 * This contract defines the variants so components can be configured
 * consistently across the app.
 */

import type { RichTextContent } from './message';

/**
 * Editor variants — each maps to a specific UI context.
 * The variant determines toolbar style, height, submit behavior, and available features.
 */
export type EditorVariant = 'chat' | 'note' | 'inject' | 'rfi' | 'response';

/**
 * Configuration derived from variant. Used by the RichEditor component
 * to set up the correct Tiptap extensions and UI.
 */
export type EditorConfig = {
  variant: EditorVariant;
  toolbar: 'floating' | 'fixed';
  minHeight: number;
  maxHeight: number | null;
  isResizable: boolean;
  submitMethod: 'keyboard' | 'button';
  /** Keyboard shortcut to submit. Null if submitMethod is 'button'. */
  submitShortcut: string | null;
  /** Which Tiptap extensions are enabled for this variant. */
  enabledFeatures: EditorFeature[];
  placeholder: string;
};

export type EditorFeature =
  | 'bold'
  | 'italic'
  | 'strike'
  | 'heading'
  | 'bullet_list'
  | 'ordered_list'
  | 'blockquote'
  | 'code'
  | 'code_block'
  | 'horizontal_rule'
  | 'link'
  | 'table'
  | 'task_list'
  | 'file_attachment'
  | 'mention'
  | 'slash_command'
  | 'placeholder';

/**
 * Static config for each variant. Implementation imports this
 * and passes it to the RichEditor component.
 */
export const EDITOR_CONFIGS: Record<EditorVariant, EditorConfig> = {
  chat: {
    variant: 'chat',
    toolbar: 'floating',
    minHeight: 44,
    maxHeight: null,
    isResizable: false,
    submitMethod: 'keyboard',
    submitShortcut: 'Mod-Enter',
    enabledFeatures: [
      'bold', 'italic', 'code', 'code_block', 'link',
      'bullet_list', 'ordered_list', 'file_attachment',
      'mention', 'slash_command', 'placeholder',
    ],
    placeholder: 'Type a message...',
  },
  note: {
    variant: 'note',
    toolbar: 'fixed',
    minHeight: 120,
    maxHeight: null,
    isResizable: false,
    submitMethod: 'keyboard',
    submitShortcut: 'Mod-Enter',
    enabledFeatures: [
      'bold', 'italic', 'strike', 'heading', 'bullet_list', 'ordered_list',
      'blockquote', 'code', 'code_block', 'horizontal_rule', 'link',
      'table', 'task_list', 'mention', 'slash_command', 'placeholder',
    ],
    placeholder: 'Add your observation...',
  },
  inject: {
    variant: 'inject',
    toolbar: 'fixed',
    minHeight: 300,
    maxHeight: null,
    isResizable: true,
    submitMethod: 'button',
    submitShortcut: null,
    enabledFeatures: [
      'bold', 'italic', 'strike', 'heading', 'bullet_list', 'ordered_list',
      'blockquote', 'code', 'code_block', 'horizontal_rule', 'link',
      'table', 'file_attachment', 'slash_command', 'placeholder',
    ],
    placeholder: 'Write inject content...',
  },
  rfi: {
    variant: 'rfi',
    toolbar: 'floating',
    minHeight: 44,
    maxHeight: 200,
    isResizable: false,
    submitMethod: 'keyboard',
    submitShortcut: 'Mod-Enter',
    enabledFeatures: [
      'bold', 'italic', 'code', 'link', 'placeholder',
    ],
    placeholder: 'Ask White Cell a question...',
  },
  response: {
    variant: 'response',
    toolbar: 'fixed',
    minHeight: 80,
    maxHeight: null,
    isResizable: false,
    submitMethod: 'button',
    submitShortcut: null,
    enabledFeatures: [
      'bold', 'italic', 'strike', 'heading', 'bullet_list', 'ordered_list',
      'blockquote', 'code', 'code_block', 'link',
      'file_attachment', 'slash_command', 'placeholder',
    ],
    placeholder: 'Write your response...',
  },
};

/**
 * Props for the RichEditor component.
 * This is the universal editor interface used by all variants.
 */
export type RichEditorProps = {
  content: RichTextContent | null;
  onChange: (content: RichTextContent) => void;
  variant: EditorVariant;
  onSubmit?: () => void;
  isDisabled?: boolean;
  /** Override the default placeholder. */
  placeholder?: string;
  /** Items available for @mention autocomplete. */
  mentionItems?: MentionItem[];
};

export type MentionItem = {
  id: string;
  label: string;
  type: 'player' | 'room' | 'inject';
  /** Optional avatar/icon URL. */
  avatarUrl: string | null;
};
