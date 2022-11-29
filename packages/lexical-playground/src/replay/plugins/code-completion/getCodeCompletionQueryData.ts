import {$isRangeSelection, $isTextNode, TextNode} from 'lexical';

import {QueryData, TypeAheadSelection} from '../typeahead/types';
import {
  traverseTextNodesBackward,
  traverseTextNodesForward,
} from '../typeahead/utils/text';

export default function getCodeCompletionQueryData(
  selection: TypeAheadSelection | null,
): QueryData | null {
  if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
    return null;
  }

  const node = selection.getNodes()[0];
  if (!$isTextNode(node) || !node.isSimpleText()) {
    return null;
  }

  const anchor = selection.anchor;
  const offset = anchor.offset;

  let beginOffset = -1;
  let beginTextNode: TextNode | null = node;
  let dotCount = 0;
  console.log(`getQueryData`, node, offset);

  traverseTextNodesBackward(
    node,
    offset - 1,
    (char: string, currentTextNode: TextNode, currentOffset: number) => {
      console.log(
        `backward "${char}" -> ${isBoundaryChar(char)}`,
        currentTextNode,
        currentOffset,
      );
      if (isBoundaryChar(char)) {
        return true;
      }

      if (char === '.') {
        dotCount++;
      }

      beginOffset = currentOffset;
      beginTextNode = currentTextNode;

      return false;
    },
  );

  if (beginTextNode === null) {
    return null;
  }

  let isPastCursor = false;
  let endOffset = -1;
  let endTextNode: TextNode | null = null;
  console.log(`dots? ${dotCount}`);

  const text = traverseTextNodesForward(
    beginTextNode,
    beginOffset,
    (char: string, currentTextNode: TextNode, currentOffset: number) => {
      console.log(
        `forward "${char}" (${isPastCursor}) -> ${isBoundaryChar(char)}`,
        currentTextNode,
        currentOffset,
      );

      if (isBoundaryChar(char) || (isPastCursor && char === '.')) {
        return true;
      }

      // Once we've got back to the cursor, we should break at the next "."
      if (char === '.') {
        dotCount--;

        if (dotCount <= 0) {
          isPastCursor = true;
        }
      }

      endOffset = currentOffset;
      endTextNode = currentTextNode;

      return false;
    },
  );

  const expression = isPastCursor ? text : '';
  const pieces = expression.split('.');
  const query = '.' + (pieces[pieces.length - 1] || '');
  const queryAdditionalData = pieces.slice(0, -1).join('.') || '';
  console.log(`query: "${query}" (${queryAdditionalData})`);

  if (beginTextNode === null || endTextNode === null) {
    return {
      beginOffset: offset,
      beginTextNode: node,
      endOffset: offset,
      endTextNode: node,
      query,
      queryAdditionalData,
    };
  }

  return {
    beginOffset,
    beginTextNode: beginTextNode,
    endOffset,
    endTextNode: endTextNode,
    query,
    queryAdditionalData,
  };
}

function isBoundaryChar(char: string): boolean {
  return char.match(/[\s{},'"]/) !== null;
}
