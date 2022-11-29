import {TextNode} from 'lexical';

export function traverseTextNodesBackward(
  initialTextNode: TextNode,
  initialOffset: number,
  isBoundaryChar: (
    char: string,
    currentTextNode: TextNode,
    currentOffset: number,
  ) => boolean,
): string {
  let text = '';

  let currentOffset = initialOffset;
  let currentTextNode: TextNode | null = initialTextNode;
  let currentText = initialTextNode.getTextContent();

  if (currentTextNode !== null) {
    // eslint-disable-next-line no-constant-condition
    loop: while (true) {
      for (currentOffset; currentOffset >= 0; currentOffset--) {
        const char = currentText.charAt(currentOffset);
        if (isBoundaryChar(char, currentTextNode, currentOffset)) {
          break loop;
        }

        text = char + text;
      }

      const previousTextNode: TextNode | null =
        currentTextNode.getPreviousSibling();
      if (
        previousTextNode === null ||
        typeof previousTextNode.isSimpleText !== 'function' ||
        !previousTextNode.isSimpleText()
      ) {
        break loop;
      }

      currentTextNode = previousTextNode;
      currentText = previousTextNode.getTextContent();
      currentOffset = currentText.length - 1;
    }
  }

  return text;
}

export function traverseTextNodesForward(
  initialTextNode: TextNode,
  initialOffset: number,
  isBoundaryChar: (
    char: string,
    currentTextNode: TextNode,
    currentOffset: number,
  ) => boolean,
): string {
  let text = '';

  let currentOffset = initialOffset;
  let currentTextNode: TextNode | null = initialTextNode;
  let currentText = initialTextNode.getTextContent() ?? '';

  // eslint-disable-next-line no-constant-condition
  loop: while (true) {
    for (currentOffset; currentOffset < currentText.length; currentOffset++) {
      const char = currentText.charAt(currentOffset);
      if (isBoundaryChar(char, currentTextNode, currentOffset)) {
        break loop;
      }

      text += char;
    }

    const nextTextNode: TextNode | null = currentTextNode.getNextSibling();
    if (nextTextNode === null) {
      // We've reached the end of the text.
      break;
    } else if (
      typeof nextTextNode.isSimpleText !== 'function' ||
      !nextTextNode.isSimpleText()
    ) {
      // Don't try to parse complex nodes.
      break;
    } else {
      const nextTextContent = nextTextNode.getTextContent() || '';
      if (isBoundaryChar(nextTextContent.charAt(0), nextTextNode, 0)) {
        // If the next node is a boundary, end on the current node.
        break;
      }
    }

    currentTextNode = nextTextNode;
    currentText = nextTextNode.getTextContent();
    currentOffset = 0;
  }

  return text;
}
