import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {useLexicalNodeSelection} from '@lexical/react/useLexicalNodeSelection';
import {mergeRegister} from '@lexical/utils';
import {
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  DecoratorNode,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
} from 'lexical';
import {useCallback, useEffect, useRef} from 'react';

import './styles.css';
import {SerializedMentionsNode, TeamMember} from './types';
import $createMentionsNode from './utils/$createMentionsNode';
import $isMentionsNode from './utils/$isMentionsNode';

export default class MentionsNode extends DecoratorNode<JSX.Element> {
  _teamMember: TeamMember;

  constructor(teamMember: TeamMember, key?: string) {
    super(key);

    this._teamMember = teamMember;
  }

  static getType(): string {
    return 'mentions-item';
  }

  static clone(node: MentionsNode) {
    return new MentionsNode(node._teamMember, node.__key);
  }

  static importJSON(serializedNode: SerializedMentionsNode): MentionsNode {
    return $createMentionsNode(serializedNode.teamMember);
  }

  isSimpleText() {
    return false;
  }

  select() {
    // No-op
    console.log('[MentionsNode] select()', this._teamMember);
  }

  exportJSON(): SerializedMentionsNode {
    return {
      ...super.exportJSON(),
      teamMember: this._teamMember,
      type: 'mentions-item',
      version: 1,
    };
  }

  importDOM() {
    return {
      'test-decorator': (domNode: HTMLElement) => {
        return {
          conversion: () => ({node: $createMentionsNode(this._teamMember)}),
        };
      },
    };
  }

  exportDOM() {
    return {
      element: document.createElement('test-decorator'),
    };
  }

  getTextContent() {
    const {name, username} = this._teamMember;
    return `${name} (@${username})`;
  }

  createDOM() {
    return document.createElement('span');
  }

  updateDOM() {
    return false;
  }

  decorate() {
    return <Decorator nodeKey={this.__key} teamMember={this._teamMember} />;
  }
}

function Decorator({
  nodeKey,
  teamMember,
}: {
  nodeKey: string;
  teamMember: TeamMember;
}) {
  const [editor] = useLexicalComposerContext();
  const ref = useRef<HTMLSpanElement>(null);
  const [isSelected, setSelected, clearSelection] =
    useLexicalNodeSelection(nodeKey);

  const onDelete = useCallback(
    (payload: KeyboardEvent) => {
      if (isSelected && $isNodeSelection($getSelection())) {
        const event: KeyboardEvent = payload;
        event.preventDefault();
        const node = $getNodeByKey(nodeKey);
        let nextSibling = null;
        if ($isMentionsNode(node)) {
          nextSibling = node.getNextSibling();
          node.remove();
        }
        setSelected(false);
        if (nextSibling) {
          nextSibling.select();
        }
        return true;
      }
      return false;
    },
    [isSelected, nodeKey, setSelected],
  );

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        CLICK_COMMAND,
        ({shiftKey, target}: MouseEvent) => {
          const element = ref.current;
          if (element !== null) {
            if (element === target || element.contains(target as HTMLElement)) {
              if (!shiftKey) {
                clearSelection();
              }
              setSelected(!isSelected);
              return true;
            }
          }

          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_DELETE_COMMAND,
        onDelete,
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        onDelete,
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [clearSelection, editor, isSelected, onDelete, setSelected]);

  return (
    <span
      className={isSelected ? 'mentions-node-selected' : 'mentions-node'}
      ref={ref}>
      {teamMember.name}{' '}
      <small className="mentions-node-small">(@{teamMember.username})</small>
    </span>
  );
}
