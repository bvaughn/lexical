import {jsonLanguage} from '@codemirror/lang-json';
import {ensureSyntaxTree} from '@codemirror/language';
import {EditorState} from '@codemirror/state';
import {AutoFocusPlugin} from '@lexical/react/LexicalAutoFocusPlugin';
import {LexicalComposer} from '@lexical/react/LexicalComposer';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import {HistoryPlugin} from '@lexical/react/LexicalHistoryPlugin';
import {RichTextPlugin} from '@lexical/react/LexicalRichTextPlugin';
import {classHighlighter, highlightTree} from '@lezer/highlight';
import {$getRoot} from 'lexical';
import {
  KeyboardEvent,
  ReactNode,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import * as React from 'react';

import {
  SharedHistoryContext,
  useSharedHistoryContext,
} from '../../lexical-playground/src/context/SharedHistoryContext';
import {MaxLengthPlugin} from '../../lexical-playground/src/plugins/MaxLengthPlugin';
import TreeViewPlugin from '../../lexical-playground/src/plugins/TreeViewPlugin';
import {TypeAheadContextProvider} from '../../lexical-playground/src/replay/plugins/typeahead/TypeAheadContext';
import ContentEditable from '../../lexical-playground/src/ui/ContentEditable';
import Placeholder from '../../lexical-playground/src/ui/Placeholder';
import {
  IS_BOLD,
  IS_CODE,
  IS_ITALIC,
  IS_STRIKETHROUGH,
} from './replay/plugins/comment/constants';
import parseMarkdownString from './replay/plugins/comment/utils/parseMarkdownString';

type EditorConfig = any;

type Props = {
  createAdditionalPlugins: (params: {
    onChange: (newValue: string) => void;
    onSubmit: () => void;
  }) => ReactNode;
  createEditorStateFromMarkdown: (markdownString: string) => void;
  createInitialConfig: () => EditorConfig;
  isCode?: boolean;
  onChange: (newValue: string) => void;
  onSubmit: () => void;
  placeholder: string;
};

export default function EditorWrapperOuter(props: Props) {
  const {createInitialConfig} = props;

  return (
    <LexicalComposer initialConfig={createInitialConfig()}>
      <EditorWrapperInner {...props} />
    </LexicalComposer>
  );
}

function EditorWrapperInner({
  createAdditionalPlugins,
  createEditorStateFromMarkdown,
  isCode = false,
  onChange,
  onSubmit,
  placeholder,
}: Props) {
  const {historyState} = useSharedHistoryContext();
  const [editor] = useLexicalComposerContext();

  const [json, setJson] = useState({});
  const [value, setValue] = useState('');

  const jsonExportRef = useRef<HTMLPreElement>(null);
  const jsonImportRef = useRef<HTMLPreElement>(null);
  const markdownImportRef = useRef<HTMLPreElement>(null);

  useLayoutEffect(() => {
    const jsonExport = jsonExportRef.current;
    if (jsonExport !== null) {
      const jsonString = JSON.stringify(json, null, 2);
      const html = parseToHTML(jsonString, jsonLanguage.extension);
      jsonExport.innerHTML = html || '';
    }
  }, [json]);

  const onJsonKeyPress = (event: KeyboardEvent) => {
    switch (event.key) {
      case 'Enter':
        if (!event.shiftKey) {
          event.preventDefault();

          const jsonImport = jsonImportRef.current;
          if (jsonImport !== null) {
            try {
              const textContent = jsonImport.textContent ?? '';
              const newEditorState = editor.parseEditorState(
                JSON.parse(textContent),
              );
              editor.setEditorState(newEditorState);
            } catch (error) {
              console.error(error);
            }
          }
        }
        break;
    }
  };

  const onMarkdownKeyPress = (event: KeyboardEvent) => {
    switch (event.key) {
      case 'Enter':
        if (!event.shiftKey) {
          event.preventDefault();

          const markdownImport = markdownImportRef.current;
          if (markdownImport !== null) {
            try {
              editor.update(() => {
                const $root = $getRoot();
                $root.clear();

                const textContent = markdownImport.textContent ?? '';
                createEditorStateFromMarkdown(textContent);
              });
            } catch (error) {
              console.error(error);
            }
          }
        }
        break;
    }
  };

  const onChangeWrapper = (newValue: string) => {
    onChange(newValue);

    const editorState = editor.getEditorState();

    setJson(editorState.toJSON());
    setValue(newValue);
  };

  const onSubmitWrapper = () => {
    onSubmit();

    const jsonImport = jsonImportRef.current;
    if (jsonImport !== null) {
      const string = JSON.stringify(json, null, 2);
      const html = parseToHTML(string, jsonLanguage.extension);
      jsonImport.innerHTML = html || '';
    }
    const markdownImport = markdownImportRef.current;
    if (markdownImport !== null) {
      markdownImport.textContent = value;

      const ranges = parseMarkdownString(value);

      let html = '';
      ranges.forEach((range) => {
        if (range.format === null) {
          html += range.text;
        } else {
          const element = document.createElement('span');

          if (range.format & IS_CODE) {
            element.className += 'tok-markdown-code';
            element.textContent = `\`${range.text}\``;
          } else if (range.format & IS_BOLD) {
            element.className += 'tok-markdown-bold';
            element.textContent = `**${range.text}**`;
          } else if (range.format & IS_ITALIC) {
            element.className += 'tok-markdown-italic';
            element.textContent = `_${range.text}_`;
          } else if (range.format & IS_STRIKETHROUGH) {
            element.className += 'tok-markdown-strikethrough';
            element.textContent = `~~${range.text}~~`;
          } else {
            element.textContent = range.text;
          }

          html += element.outerHTML;
        }
      });

      markdownImport.innerHTML = html;
    }
  };

  return (
    <SharedHistoryContext>
      <TypeAheadContextProvider>
        <div className="two-column-row">
          <div className="tree-view-output">
            <pre
              onKeyPress={onMarkdownKeyPress}
              contentEditable={true}
              ref={markdownImportRef}
            />
            <label className="pre-label">Markdown import</label>
          </div>
          <div className="tree-view-output">
            <pre
              onKeyPress={onJsonKeyPress}
              contentEditable={true}
              ref={jsonImportRef}
            />
            <label className="pre-label">JSON import</label>
          </div>
        </div>
        <div className="editor-container tree-view">
          <MaxLengthPlugin maxLength={500} />
          <AutoFocusPlugin />
          <HistoryPlugin externalHistoryState={historyState} />
          <RichTextPlugin
            contentEditable={
              <div className="editor-scroller">
                <div className={isCode ? 'editor code' : 'editor'}>
                  <ContentEditable />
                </div>
              </div>
            }
            placeholder={
              <div className="code">
                <Placeholder>{placeholder}</Placeholder>
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          {createAdditionalPlugins({
            onChange: onChangeWrapper,
            onSubmit: onSubmitWrapper,
          })}
        </div>
        <div className="two-column-row">
          <TreeViewPlugin>
            <label className="pre-label">Lexical state</label>
          </TreeViewPlugin>
          <div className="tree-view-output">
            <pre contentEditable={true} ref={jsonExportRef} />
            <label className="pre-label">JSON export</label>
          </div>
        </div>
      </TypeAheadContextProvider>
    </SharedHistoryContext>
  );
}

function parseToHTML(textToParse: string, extension: any): string | null {
  const codeMirrorState = EditorState.create({
    doc: textToParse,
    extensions: [extension],
  });

  const tree = ensureSyntaxTree(codeMirrorState, Number.MAX_SAFE_INTEGER);
  if (tree === null) {
    return null;
  }

  const element = document.createElement('span');

  let characterIndex = 0;

  highlightTree(tree, classHighlighter, (from, to, className) => {
    if (from > characterIndex) {
      // No style applied to the token between position and from.
      // This typically indicates white space or newline characters.
      const text = textToParse.slice(characterIndex, from);
      const textNode = document.createTextNode(text);
      element.appendChild(textNode);
    }

    const text = textToParse.slice(from, to);
    const span = document.createElement('span');
    span.className = className;
    span.textContent = text;
    element.appendChild(span);

    characterIndex = to;
  });

  if (characterIndex < textToParse.length) {
    // Anything left is plain text
    const text = textToParse.slice(characterIndex);
    const textNode = document.createTextNode(text);
    element.appendChild(textNode);
  }

  return element.innerHTML;
}
