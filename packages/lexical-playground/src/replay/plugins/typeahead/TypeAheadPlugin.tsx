import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {mergeRegister} from '@lexical/utils';
import {
  $createTextNode,
  $getSelection,
  COMMAND_PRIORITY_LOW,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_TAB_COMMAND,
  LexicalNode,
  TextNode,
} from 'lexical';
import {FunctionComponent, useEffect} from 'react';
import {createPortal} from 'react-dom';

import TypeAheadPopUp from './TypeAheadPopUp';
import {
  ItemListRendererProps,
  QueryData,
  SearchPromise,
  TypeAheadSelection,
} from './types';
import useTypeAheadPlugin from './useTypeAheadPlugin';

export const uuid = Math.random()
  .toString(36)
  .replace(/[^a-z]+/g, '')
  .substr(0, 5);

export default function AutocompletePlugin<Item extends Object>({
  anchorElem = document.body,
  createItemNode = $createTextNode as any,
  getQueryData,
  findMatches,
  ItemListRenderer,
}: {
  anchorElem?: HTMLElement;
  createItemNode?: (item: Item) => LexicalNode;
  getQueryData: (selection: TypeAheadSelection | null) => QueryData | null;
  findMatches: (query: string) => SearchPromise<Item>;
  ItemListRenderer: FunctionComponent<ItemListRendererProps<Item>>;
}): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const {selectNext, selectPrevious, stateRef, items, update} =
    useTypeAheadPlugin();

  useEffect(() => {
    let queryData: QueryData | null = null;
    let searchPromise: null | SearchPromise<Item> = null;

    function $clearItems() {
      if (searchPromise !== null) {
        searchPromise.dismiss();
        searchPromise = null;
      }

      update('', [], null);
    }

    function handleUpdate() {
      editor.update(async () => {
        const selection = $getSelection();
        const newQueryData = getQueryData(selection);
        if (newQueryData === null) {
          // The cursor has moved somewhere else; clear any pending query/item data.
          queryData = null;
          $clearItems();
          return;
        } else if (
          queryData !== null &&
          queryData.query === newQueryData.query
        ) {
          // The query hasn't changed; maybe the cursor moved.
          // Either way we can bail out now.
          return;
        }

        queryData = newQueryData;

        $clearItems();

        searchPromise = findMatches(queryData.query);

        try {
          const newItems = await searchPromise.promise;
          if (searchPromise !== null) {
            // TODO Create and insert AutocompleteNode if we want the inline preview string
            update(queryData.query, newItems, newQueryData.positionRange);
          }
        } catch (error) {
          console.error(error);
        }
      });
    }

    function unmountItem() {
      editor.update(() => {
        $clearItems();
      });
    }

    function onKeyPress(event: KeyboardEvent) {
      switch (event.key) {
        case 'ArrowDown': {
          event.preventDefault();
          selectNext();
          return true;
        }
        case 'ArrowUp': {
          event.preventDefault();
          selectPrevious();
          return true;
        }
        case 'Enter':
        case 'Tab': {
          const {selectedIndex, items} = stateRef.current;
          const selectedItem = items[selectedIndex];
          if (selectedItem == null) {
            return false;
          }

          event.preventDefault();

          editor.update(() => {
            if (queryData === null) {
              return;
            }

            const itemNode = createItemNode(selectedItem as Item);

            const {beginTextNode, beginOffset, endTextNode, endOffset} =
              queryData;

            let currentTextNode: TextNode | null = beginTextNode;
            nodes: while (currentTextNode !== null) {
              if (currentTextNode === beginTextNode) {
                if (currentTextNode === endTextNode) {
                  if (beginOffset === endOffset) {
                    const [firstTextNode] =
                      currentTextNode.splitText(beginOffset);
                    firstTextNode.insertAfter(itemNode);
                    itemNode.select();
                  } else {
                    const [firstTextNode, secondTextNode] =
                      currentTextNode.splitText(beginOffset, endOffset);

                    if (beginOffset === 0 || secondTextNode == null) {
                      firstTextNode.replace(itemNode);
                    } else {
                      secondTextNode.replace(itemNode);
                    }

                    itemNode.select();
                  }

                  break nodes;
                } else {
                  const nextTextNode: TextNode | null =
                    currentTextNode.getNextSibling();

                  const [firstTextNode, secondTextNode] =
                    currentTextNode.splitText(beginOffset);

                  if (beginOffset === 0 || secondTextNode == null) {
                    firstTextNode.replace(itemNode);
                  } else {
                    secondTextNode.replace(itemNode);
                  }

                  itemNode.select();

                  currentTextNode = nextTextNode;
                }
              } else if (currentTextNode === endTextNode) {
                const [firstTextNode] = currentTextNode.splitText(endOffset);
                firstTextNode.remove();
                break nodes;
              } else {
                const nextTextNode: TextNode | null =
                  currentTextNode.getNextSibling();
                currentTextNode.remove();
                currentTextNode = nextTextNode;
              }
            }

            $clearItems();
          });

          return true;
        }
      }

      return false;
    }

    return mergeRegister(
      editor.registerUpdateListener(handleUpdate),
      editor.registerCommand(
        KEY_ARROW_DOWN_COMMAND,
        onKeyPress,
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_ARROW_UP_COMMAND,
        onKeyPress,
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_ENTER_COMMAND,
        onKeyPress,
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(KEY_TAB_COMMAND, onKeyPress, COMMAND_PRIORITY_LOW),
      unmountItem,
    );
  }, [editor, findMatches, selectNext, selectPrevious, update]);

  return items === null || items.length === 0
    ? null
    : createPortal(
        <TypeAheadPopUp
          anchorElem={anchorElem}
          editor={editor}
          ItemListRenderer={ItemListRenderer}
        />,
        anchorElem,
      );
}
