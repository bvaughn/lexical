import {$isRangeSelection, $isTextNode, TextNode} from 'lexical';

import {QueryData, TypeAheadSelection} from '../typeahead/types';
import {
  traverseTextNodesBackward,
  traverseTextNodesForward,
} from '../typeahead/utils/text';

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

  let beginTextNode: TextNode | null = null;
  let beginOffset = -1;
  let foundWildCard = false;
  let ignoreMatch = false;

  traverseTextNodesBackward(
    node,
    offset - 1,
    (char: string, currentTextNode: TextNode, currentOffset: number) => {
      if (foundWildCard) {
        if (!isMentionBoundaryChar(char)) {
          // Part of a larger string (like an email address).; stop searching
          ignoreMatch = true;
          return true;
        } else if (char === '@') {
          // Edge case handling; stop searching
          ignoreMatch = true;
          return true;
        } else {
          // This looks like a valid query format.
          return true;
        }
      } else if (char === '@') {
        // We may have found the start of a query, but we need to look a bit further to make sure
        foundWildCard = true;

        beginOffset = currentOffset;
        beginTextNode = currentTextNode;
      } else if (isMentionBoundaryChar(char)) {
        // Current selection isn't within something that looks like a query; stop searching
        ignoreMatch = true;
        return true;
      }

      return false;
    },
  );

  if (!foundWildCard || ignoreMatch || beginTextNode === null) {
    return null;
  }

  let endOffset = -1;
  let endTextNode: TextNode | null = null;
  let isFirstChar = true;

  const query = traverseTextNodesForward(
    beginTextNode,
    beginOffset,
    (char: string, currentTextNode: TextNode, currentOffset: number) => {
      if (isFirstChar) {
        // The first character is the "@" character.
        isFirstChar = false;
      } else if (char === '@') {
        // Edge case handling.
        return true;
      } else if (isMentionBoundaryChar(char)) {
        endOffset = currentOffset;
        endTextNode = currentTextNode;

        return true;
      }

      return false;
    },
  );

  if (endTextNode === null) {
    return null;
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
