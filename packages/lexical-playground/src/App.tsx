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

import {SettingsContext, useSettings} from './context/SettingsContext';
import {SharedAutocompleteContext} from './context/SharedAutocompleteContext';
import {SharedHistoryContext} from './context/SharedHistoryContext';
import Editor from './Editor';
import logo from './images/logo.svg';
import PlaygroundNodes from './nodes/PlaygroundNodes';
import {TableContext} from './plugins/TablePlugin';
import Settings from './Settings';
import PlaygroundEditorTheme from './themes/PlaygroundEditorTheme';

function prepopulatedRichText() {
  const root = $getRoot();
  if (root.getFirstChild() === null) {
    const paragraph = $createParagraphNode();
    paragraph.append($createTextNode('This is a test'));
    root.append(paragraph);
  }
}

function App(): JSX.Element {
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
    <LexicalComposer initialConfig={initialConfig}>
      <SharedHistoryContext>
        <TableContext>
          <SharedAutocompleteContext>
            <header>
              <a href="https://lexical.dev" target="_blank" rel="noopener">
                <img src={logo} alt="Lexical Logo" />
              </a>
            </header>
            <div className="editor-shell">
              <Editor />
            </div>
            <Settings />
          </SharedAutocompleteContext>
        </TableContext>
      </SharedHistoryContext>
    </LexicalComposer>
  );
}

export default function PlaygroundApp(): JSX.Element {
  return (
    <SettingsContext>
      <App />
    </SettingsContext>
  );
}
