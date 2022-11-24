import * as React from 'react';
import {useContext, useEffect, useRef, useState} from 'react';

import {TypeAheadContext} from './TypeAheadContext';
import {ContextShape, HookShape, HookState} from './types';

const EMPTY_ARRAY: any[] = [];

export default function useTypeAheadPlugin<Item>(): HookShape<Item> {
  const {
    selectItem,
    selectNext,
    selectPrevious,
    subscribe,
    update,
  }: ContextShape<Item> = useContext(TypeAheadContext);

  // Store mirror copies in hook state
  // so updates will schedule re-renders for this part of the React tree
  const [state, setState] = useState<HookState<Item>>({
    positionRange: null,
    query: '',
    selectedIndex: 0,
    items: EMPTY_ARRAY,
  });

  const stateRef = useRef<HookState<Item>>(state);

  useEffect(() => {
    stateRef.current = state;
  });

  useEffect(() => {
    return subscribe(
      (
        newQuery: string,
        newItems: Item[],
        newSelectedIndex: number,
        newPositionRange: Range | null,
      ) => {
        newItems = newItems.length === 0 ? EMPTY_ARRAY : newItems;

        setState((prevState) => {
          if (
            prevState.positionRange === newPositionRange &&
            prevState.query === newQuery &&
            prevState.selectedIndex === newSelectedIndex &&
            prevState.items === newItems
          ) {
            return prevState;
          }

          return {
            positionRange: newPositionRange,
            query: newQuery,
            selectedIndex: newSelectedIndex,
            items: newItems,
          };
        });
      },
    );
  }, [subscribe]);

  const selectedItem = state.items[state.selectedIndex] ?? null;

  return {
    positionRange: state.positionRange,
    query: state.query,
    selectedIndex: state.selectedIndex,
    selectedItem,
    selectItem,
    selectNext,
    selectPrevious,
    stateRef,
    items: state.items,
    update,
  };
}
