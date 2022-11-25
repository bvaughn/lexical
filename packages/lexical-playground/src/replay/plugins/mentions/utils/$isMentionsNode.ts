import {LexicalNode} from 'lexical';

import MentionsNode from '../MentionsNode';

export default function $isMentionsNode(
  node: LexicalNode | null | undefined,
): node is MentionsNode {
  return node?.__type === 'mentions-item';
}
