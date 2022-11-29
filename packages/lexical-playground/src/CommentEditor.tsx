import {MarkNode} from '@lexical/mark';
import {
  BOLD_ITALIC_UNDERSCORE,
  BOLD_STAR,
  BOLD_UNDERSCORE,
  INLINE_CODE,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
  STRIKETHROUGH,
} from '@lexical/markdown';
import {MarkdownShortcutPlugin} from '@lexical/react/LexicalMarkdownShortcutPlugin';
import {
  $getRoot,
  Klass,
  LexicalNode,
  LineBreakNode,
  ParagraphNode,
  TextNode,
} from 'lexical';
import * as React from 'react';

import EditorWrapper from './EditorWrapper';
import CommentPlugin from './replay/plugins/comment/CommentPlugin';
import {LoomThumbnailNode} from './replay/plugins/comment/LoomThumbnailNode';
import parseMarkdownString from './replay/plugins/comment/utils/parseMarkdownString';
import rangesToLexicalNodes from './replay/plugins/comment/utils/rangesToLexicalNodes';
import MentionsPlugin from './replay/plugins/mentions/MentionsPlugin';
import MentionsTextNode from './replay/plugins/mentions/MentionsTextNode';
import PlaygroundEditorTheme from './themes/PlaygroundEditorTheme';

// The comment editor only supports a subset of markdown formatting.
const MARKDOWN_TRANSFORMERS = [
  BOLD_ITALIC_UNDERSCORE,
  BOLD_STAR,
  BOLD_UNDERSCORE,
  INLINE_CODE,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
  STRIKETHROUGH,
];

const NODES: Array<Klass<LexicalNode>> = [
  LineBreakNode,
  LoomThumbnailNode,
  MarkNode,
  MentionsTextNode,
  ParagraphNode,
  TextNode,
];

export default function CommentEditor({
  initialValue = '',
  onChange,
  onSubmit,
  placeholder = '',
}: {
  initialValue: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder: string;
}): JSX.Element {
  return (
    <EditorWrapper
      createAdditionalPlugins={createAdditionalPlugins}
      createEditorStateFromMarkdown={createEditorStateFromMarkdown}
      createInitialConfig={() => createInitialConfig(initialValue)}
      onChange={onChange}
      onSubmit={onSubmit}
      placeholder={placeholder}
    />
  );
}

function createAdditionalPlugins({
  onChange,
  onSubmit,
}: {
  onChange: (newValue: string) => void;
  onSubmit: () => void;
}) {
  return (
    <>
      {/* MentionsPlugin plug-in must come before Comment plug-in because of ENTER command handling */}
      <MentionsPlugin />
      <CommentPlugin onChange={onChange} onSubmit={onSubmit} />
      <MarkdownShortcutPlugin transformers={MARKDOWN_TRANSFORMERS} />
    </>
  );
}

function createInitialConfig(initialValue: string) {
  return {
    editorState: () => createEditorStateFromMarkdown(initialValue),
    namespace: 'CommentEditor',
    nodes: NODES,
    onError: (error: Error) => {
      throw error;
    },
    theme: PlaygroundEditorTheme,
  };
}

function createEditorStateFromMarkdown(markdownString: string) {
  const root = $getRoot();
  if (root.getFirstChild() === null) {
    const ranges = parseMarkdownString(markdownString);
    root.append(...rangesToLexicalNodes(ranges));
  }
}
