import * as React from 'react';
import {useState} from 'react';

import CodeEditor from './CodeEditor';
import CommentEditor from './CommentEditor';

export default function App(): JSX.Element {
  const [code, setCode] = useState('`URL: "${window.location.href}"`');
  const [comment, setComment] = useState(
    'This is a **rich text** comment with `code`\n\nand a _mention_: @bvaughn!',
  );

  const onCommentChange = (newComment: string) => {
    // console.group('onCommentChange');
    // console.log(newComment);
    // console.groupEnd();
    setComment(newComment);
  };

  const onCommentSubmit = () => {
    // console.group('onCommentSubmit');
    // console.log(comment);
    // console.groupEnd();
  };

  const onTerminalChange = (newCode: string) => {
    // console.group('onTerminalChange');
    // console.log(newCode);
    // console.groupEnd();
    setCode(newCode);
  };

  const onTerminalSubmit = () => {
    // console.group('onTerminalSubmit');
    // console.log(code);
    // console.groupEnd();
  };

  return (
    <div className="app">
      <div className="app-column">
        <header className="app-header">
          Terminal editor
          <small className="app-header-subtext">
            syntax highlighting, code-completion typeahead
          </small>
        </header>
        <div className="editor-shell">
          <CodeEditor
            initialValue={code}
            onChange={onTerminalChange}
            onSubmit={onTerminalSubmit}
            placeholder="Type an expression"
          />
        </div>
      </div>
      <div className="app-column">
        <header className="app-header">
          Comment editor
          <small className="app-header-subtext">
            markdown support, @mentions typeahead
          </small>
        </header>
        <div className="editor-shell">
          <CommentEditor
            initialValue={comment}
            onChange={onCommentChange}
            onSubmit={onCommentSubmit}
            placeholder="Write a comment"
          />
        </div>
      </div>
    </div>
  );
}
