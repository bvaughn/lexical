/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {LexicalComposer} from '@lexical/react/LexicalComposer';
import {$createParagraphNode, $createTextNode, $getRoot} from 'lexical';
import * as React from 'react';

import {SettingsContext} from './context/SettingsContext';
import {TypeAheadContextProvider} from './replay/plugins/typeahead/TypeAheadContext';
import {SharedHistoryContext} from './context/SharedHistoryContext';
import {CommentEditor, TerminalEditor} from './Editor';
import PlaygroundNodes from './nodes/PlaygroundNodes';
import PlaygroundEditorTheme from './themes/PlaygroundEditorTheme';

function prepopulatedRichText() {
  const root = $getRoot();
  if (root.getFirstChild() === null) {
    const paragraph = $createParagraphNode();
    paragraph.append($createTextNode('This is a test'));
    root.append(paragraph);
  }
}

export default function App(): JSX.Element {
  const initialConfig = {
    editorState: prepopulatedRichText,
    namespace: 'Playground',
    nodes: [...PlaygroundNodes],
    onError: (error: Error) => {
      throw error;
    },
    theme: PlaygroundEditorTheme,
  };

  return (
    <SettingsContext>
      <LexicalComposer initialConfig={initialConfig}>
        <SharedHistoryContext>
          <TypeAheadContextProvider>
            <header>
              <h1>Terminal input</h1>
            </header>
            <div className="editor-shell">
              <TerminalEditor />
            </div>
          </TypeAheadContextProvider>
        </SharedHistoryContext>
      </LexicalComposer>
      <LexicalComposer initialConfig={initialConfig}>
        <SharedHistoryContext>
          <TypeAheadContextProvider>
            <header>
              <h1>Comment editor</h1>
            </header>
            <div className="editor-shell">
              <CommentEditor />
            </div>
          </TypeAheadContextProvider>
        </SharedHistoryContext>
      </LexicalComposer>
    </SettingsContext>
  );
}
