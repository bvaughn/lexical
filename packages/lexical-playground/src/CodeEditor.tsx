import {$getRoot, Klass, LexicalNode, LineBreakNode, TextNode} from 'lexical';
import * as React from 'react';

import EditorWrapper from './EditorWrapper';
import CodeCompletionPlugin from './replay/plugins/code-completion/CodeCompletionPlugin';
import CodeNode from './replay/plugins/code/CodeNode';
import CodePlugin from './replay/plugins/code/CodePlugin';
import parsedTokensToCodeTextNode from './replay/plugins/code/utils/parsedTokensToCodeTextNode';
import parseTokens from './replay/plugins/code/utils/parseTokens';
import PlaygroundEditorTheme from './themes/PlaygroundEditorTheme';

// Diffing is simplest when the Code plug-in has a flat structure.
const NODES: Array<Klass<LexicalNode>> = [LineBreakNode, CodeNode, TextNode];

export default function CodeEditor({
  initialValue,
  onChange,
  onSubmit,
  placeholder,
}: {
  initialValue: string;
  onChange: (newValue: string) => void;
  onSubmit: () => void;
  placeholder: string;
}): JSX.Element {
  return (
    <EditorWrapper
      createAdditionalPlugins={createAdditionalPlugins}
      createEditorStateFromMarkdown={createEditorStateFromMarkdown}
      createInitialConfig={() => createInitialConfig(initialValue)}
      isCode={true}
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
      {/* CodeCompletion plug-in must come before Terminal plug-in because of ENTER command handling */}
      <CodeCompletionPlugin />
      <CodePlugin onChange={onChange} onSubmit={onSubmit} />
    </>
  );
}

function createEditorStateFromMarkdown(markdownString: string) {
  const root = $getRoot();
  if (root.getFirstChild() === null) {
    const tokens = parseTokens(markdownString);
    if (tokens !== null) {
      const node = parsedTokensToCodeTextNode(tokens);
      root.append(node);
    }
  }
}

function createInitialConfig(initialValue: string) {
  return {
    editorState: () => createEditorStateFromMarkdown(initialValue),
    namespace: 'CodeEditor',
    nodes: NODES,
    onError: (error: Error) => {
      throw error;
    },
    theme: PlaygroundEditorTheme,
  };
}
