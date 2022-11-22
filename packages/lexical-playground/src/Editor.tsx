/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {AutoFocusPlugin} from '@lexical/react/LexicalAutoFocusPlugin';
import {CharacterLimitPlugin} from '@lexical/react/LexicalCharacterLimitPlugin';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import {HistoryPlugin} from '@lexical/react/LexicalHistoryPlugin';
import {RichTextPlugin} from '@lexical/react/LexicalRichTextPlugin';
import * as React from 'react';

import {useSharedHistoryContext} from './context/SharedHistoryContext';
import AutocompletePlugin from './plugins/AutocompletePlugin';
import CodeHighlightPlugin from './plugins/CodeHighlightPlugin';
import KeywordsPlugin from './plugins/KeywordsPlugin';
import {MaxLengthPlugin} from './plugins/MaxLengthPlugin';
import ToolbarPlugin from './plugins/ToolbarPlugin';
import TreeViewPlugin from './plugins/TreeViewPlugin';
import ContentEditable from './ui/ContentEditable';
import Placeholder from './ui/Placeholder';

export default function Editor(): JSX.Element {
  const {historyState} = useSharedHistoryContext();

  const placeholder = <Placeholder>aaaa</Placeholder>;

  return (
    <>
      <ToolbarPlugin />
      <div className={`editor-container tree-view`}>
        <MaxLengthPlugin maxLength={500} />
        <AutoFocusPlugin />
        <KeywordsPlugin />
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
        <CodeHighlightPlugin />
        <CharacterLimitPlugin charset="UTF-16" />
        <AutocompletePlugin />
      </div>
      <TreeViewPlugin />
    </>
  );
}
