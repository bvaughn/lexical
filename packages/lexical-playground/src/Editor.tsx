/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {AutoFocusPlugin} from '@lexical/react/LexicalAutoFocusPlugin';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import {HistoryPlugin} from '@lexical/react/LexicalHistoryPlugin';
import {PlainTextPlugin} from '@lexical/react/LexicalPlainTextPlugin';
import {RichTextPlugin} from '@lexical/react/LexicalRichTextPlugin';
import * as React from 'react';

import {useSharedHistoryContext} from './context/SharedHistoryContext';
import CodeHighlightPlugin from './plugins/CodeHighlightPlugin';
import {MaxLengthPlugin} from './plugins/MaxLengthPlugin';
import ToolbarPlugin from './plugins/ToolbarPlugin';
import TreeViewPlugin from './plugins/TreeViewPlugin';
import ContentEditable from './ui/ContentEditable';
import MarkdownPlugin from './plugins/MarkdownShortcutPlugin';
import Placeholder from './ui/Placeholder';

import MentionsPlugin from './replay/plugins/mentions/MentionsPlugin';

export function CommentEditor(): JSX.Element {
  const {historyState} = useSharedHistoryContext();

  const placeholder = <Placeholder>Write a comment</Placeholder>;

  return (
    <>
      <div className={`editor-container tree-view`}>
        <MaxLengthPlugin maxLength={500} />
        <AutoFocusPlugin />
        <HistoryPlugin externalHistoryState={historyState} />
        <RichTextPlugin
          contentEditable={
            <div className="editor-scroller">
              <div className="editor">
                <ContentEditable />
              </div>
            </div>
          }
          placeholder={placeholder}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <MentionsPlugin />
      </div>
      <MarkdownPlugin />
      <TreeViewPlugin />
    </>
  );
}

export function TerminalEditor(): JSX.Element {
  const {historyState} = useSharedHistoryContext();

  const placeholder = <Placeholder>Type an expression</Placeholder>;

  return (
    <>
      <ToolbarPlugin />
      <div className={`editor-container tree-view`}>
        <MaxLengthPlugin maxLength={500} />
        <AutoFocusPlugin />
        <HistoryPlugin externalHistoryState={historyState} />
        <PlainTextPlugin
          contentEditable={
            <div className="editor-scroller">
              <div className="editor code">
                <ContentEditable />
              </div>
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
          placeholder={placeholder}
        />
        <CodeHighlightPlugin />
      </div>
      <TreeViewPlugin />
    </>
  );
}
