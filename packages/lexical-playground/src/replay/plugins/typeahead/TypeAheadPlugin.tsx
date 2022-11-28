import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {mergeRegister} from '@lexical/utils';
import {
  $createTextNode,
  $getSelection,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_NORMAL,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
  KEY_TAB_COMMAND,
  LexicalNode,
  TextNode,
} from 'lexical';
import {FunctionComponent, useEffect, useRef} from 'react';
import {createPortal} from 'react-dom';

import {INSERT_ITEM_COMMAND} from './commands';
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

// TODO TypAheadPopup jumps between editors
// TODO Inject replacement logic (full text or partial text)
// Could we address both by making query just the tail part and add an extra, optional param (for code completion)

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
  findMatches: (
    query: string,
    queryAdditionalData: string | null,
  ) => SearchPromise<Item>;
  ItemListRenderer: FunctionComponent<ItemListRendererProps<Item>>;
}): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const {dismiss, selectNext, selectPrevious, stateRef, items, update} =
    useTypeAheadPlugin();

  useEffect(() => {
    let queryData: QueryData | null = null;
    let searchPromise: null | SearchPromise<Item> = null;

    function $clearItems() {
      if (searchPromise !== null) {
        searchPromise.cancel();
        searchPromise = null;
      }

      update('', []);
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

        searchPromise = findMatches(
          queryData.query,
          queryData.queryAdditionalData,
        );

        try {
          const newItems = await searchPromise.promise;
          if (searchPromise !== null) {
            // TODO Create and insert AutocompleteNode if we want the inline preview string
            update(queryData.query, newItems);
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

    function insertItem(item: Item) {
      editor.update(() => {
        if (queryData === null) {
          return;
        }

        const itemNode = createItemNode(item);

        const {beginTextNode, beginOffset, endTextNode, endOffset} = queryData;

        // TODO Handle more complex begin/end ranges (for code completion)
        let currentTextNode: TextNode | null = beginTextNode;
        nodes: while (currentTextNode !== null) {
          if (currentTextNode === beginTextNode) {
            if (currentTextNode === endTextNode) {
              if (beginOffset === endOffset) {
                const [firstTextNode] = currentTextNode.splitText(beginOffset);
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
    }

    function onKeyPress(event: KeyboardEvent) {
      switch (event.key) {
        case 'ArrowDown': {
          const {items} = stateRef.current;
          if (items.length === 0) {
            return false;
          }

          event.preventDefault();
          selectNext();
          return true;
        }
        case 'ArrowUp': {
          const {items} = stateRef.current;
          if (items.length === 0) {
            return false;
          }

          event.preventDefault();
          selectPrevious();
          return true;
        }
        case 'Escape': {
          event.preventDefault();
          dismiss();

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

          insertItem(selectedItem as Item);

          return true;
        }
      }

      return false;
    }

    function onInsertItem({item}: {item: Item}) {
      insertItem(item);
      return true;
    }

    return mergeRegister(
      editor.registerUpdateListener(handleUpdate),
      editor.registerCommand(
        INSERT_ITEM_COMMAND,
        onInsertItem,
        COMMAND_PRIORITY_NORMAL,
      ),
      editor.registerCommand(
        KEY_ARROW_DOWN_COMMAND,
        onKeyPress,
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        KEY_ARROW_UP_COMMAND,
        onKeyPress,
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        KEY_ENTER_COMMAND,
        onKeyPress,
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        onKeyPress,
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        KEY_TAB_COMMAND,
        onKeyPress,
        COMMAND_PRIORITY_CRITICAL,
      ),
      unmountItem,
    );
  }, [editor, findMatches, selectNext, selectPrevious, update]);

  const insertItem = (item: Item) => {
    editor.dispatchCommand(INSERT_ITEM_COMMAND, {item});
  };

  return items === null || items.length === 0
    ? null
    : createPortal(
        <TypeAheadPopUp<Item>
          anchorElem={anchorElem}
          editor={editor}
          insertItem={insertItem}
          ItemListRenderer={ItemListRenderer}
        />,
        anchorElem,
      );
}
