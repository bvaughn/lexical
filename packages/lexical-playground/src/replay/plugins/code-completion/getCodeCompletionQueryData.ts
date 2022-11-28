import {$isRangeSelection, $isTextNode, TextNode} from 'lexical';

import {QueryData, TypeAheadSelection} from '../typeahead/types';

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

  {
    let currentOffset = offset - 1;
    let currentTextNode: TextNode | null = node;
    let currentText = node.getTextContent();

    if (currentTextNode !== null) {
      back: while (true) {
        for (currentOffset; currentOffset >= 0; currentOffset--) {
          const char = currentText.charAt(currentOffset);
          if (isBoundaryChar(char)) {
            // We've found the beginning of this expression.
            break back;
          }

          beginOffset = currentOffset;
          beginTextNode = currentTextNode;
        }

        const previousTextNode: TextNode | null =
          currentTextNode.getPreviousSibling();
        if (
          previousTextNode === null ||
          typeof previousTextNode.isSimpleText !== 'function' ||
          !previousTextNode.isSimpleText()
        ) {
          break back;
        }

        currentTextNode = previousTextNode;
        currentText = previousTextNode.getTextContent();
        currentOffset = currentText.length - 1;
      }
    }
  }

  let expression = '';

  let endOffset = -1;
  let endTextNode: TextNode | null = null;

  {
    let currentOffset = beginOffset;
    let currentTextNode: TextNode | null = beginTextNode;
    let currentText = beginTextNode?.getTextContent() ?? '';

    let isPastCursor = false;

    if (currentTextNode !== null) {
      forward: while (true) {
        for (
          currentOffset;
          currentOffset < currentText.length;
          currentOffset++
        ) {
          // Once we've got back to the cursor, we should break at the next "."
          if (currentOffset === offset && currentTextNode === node) {
            isPastCursor = true;
          }

          const char = currentText.charAt(currentOffset);
          if (isBoundaryChar(char)) {
            endOffset = currentOffset;
            endTextNode = currentTextNode;

            break forward;
          } else if (isPastCursor && char === '.') {
            endOffset = currentOffset;
            endTextNode = currentTextNode;

            break forward;
          }

          expression += char;
        }

        const nextTextNode: TextNode | null = currentTextNode.getNextSibling();
        if (nextTextNode === null) {
          // We've reached the end of the text.
          break forward;
        } else if (!nextTextNode.isSimpleText()) {
          // Don't try to parse complex nodes.
          break forward;
        } else {
          const nextTextContent = nextTextNode.getTextContent() || '';
          if (isBoundaryChar(nextTextContent.charAt(0))) {
            // If the next node is a boundary, end on the current node.
            break forward;
          }
        }

        currentTextNode = nextTextNode;
        currentText = nextTextNode.getTextContent();
        currentOffset = 0;
      }
    }

    if (endTextNode === null) {
      endOffset = currentOffset;
      endTextNode = currentTextNode;
    }
  }

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
