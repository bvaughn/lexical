import {$isRangeSelection, $isTextNode, TextNode} from 'lexical';

import {QueryData, TypeAheadSelection} from '../typeahead/types';

export default function getMentionsQueryData(
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

    let foundWildCard = false;

    if (currentTextNode !== null) {
      back: while (true) {
        for (currentOffset; currentOffset >= 0; currentOffset--) {
          const char = currentText.charAt(currentOffset);
          if (foundWildCard) {
            if (!isMentionBoundaryChar(char)) {
              // Part of a larger string (like an email address).
              return null;
            } else if (char === '@') {
              // Edge case handling.
              return null;
            } else {
              // This looks like a valid query format.
              break back;
            }
          } else if (char === '@') {
            // We may have found the start of a query, but we need to look a bit further to make sure
            foundWildCard = true;

            beginOffset = currentOffset;
            beginTextNode = currentTextNode;
          } else if (isMentionBoundaryChar(char)) {
            // Current selection isn't within something that looks like a query.
            return null;
          }
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

    if (!foundWildCard) {
      return null;
    }
  }

  let query = '';

  let endOffset: number = -1;
  let endTextNode: TextNode | null = null;

  {
    let currentOffset = beginOffset;
    let currentTextNode: TextNode | null = beginTextNode;
    let currentText = beginTextNode?.getTextContent() ?? '';

    let isFirstChar = true;

    if (currentTextNode !== null) {
      forward: while (true) {
        for (
          currentOffset;
          currentOffset < currentText.length;
          currentOffset++
        ) {
          const char = currentText.charAt(currentOffset);
          if (isFirstChar) {
            // The first character is the "@" character.
            isFirstChar = false;
          } else if (char === '@') {
            // Edge case handling.
            return null;
          } else if (isMentionBoundaryChar(char)) {
            endOffset = currentOffset;
            endTextNode = currentTextNode;

            break forward;
          }

          query += char;
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
          if (isMentionBoundaryChar(nextTextContent.charAt(0))) {
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

  if (beginTextNode === null || endTextNode === null) {
    return {
      beginOffset: offset,
      beginTextNode: node,
      endOffset: offset,
      endTextNode: node,
      query,
      queryAdditionalData: null,
    };
  }

  return {
    beginOffset,
    beginTextNode: beginTextNode,
    endOffset,
    endTextNode: endTextNode,
    query,
    queryAdditionalData: null,
  };
}

function isMentionBoundaryChar(char: string): boolean {
  // Queries can only consist of letters.
  return char.match(/\w/) === null;
}
