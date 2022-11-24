import {Callback, ContextShape} from './types';
import {Context} from 'react';
import {createContext, ReactNode, useMemo} from 'react';

const EMPTY_ARRAY: any[] = [];

type DefaultItemType = any;

export const TypeAheadContext: Context<ContextShape<DefaultItemType>> =
  createContext({
    selectItem: (_: DefaultItemType) => {},
    selectNext: () => {},
    selectPrevious: () => {},
    subscribe: (_: Callback<DefaultItemType>) => () => {},
    update: (_: string, __: DefaultItemType[], ___: Range | null) => {},
  });

export const TypeAheadContextProvider = <Item extends Object>({
  children,
}: {
  children: ReactNode;
}): JSX.Element => {
  const context: ContextShape<Item> = useMemo(() => {
    const subscribers: Set<Callback<Item>> = new Set();

    let positionRange: Range | null = null;
    let query: string = '';
    let selectedIndex: number = 0;
    let items: Item[] = EMPTY_ARRAY;

    const notifySubscribers = () => {
      for (const subscriber of subscribers) {
        subscriber(query, items, selectedIndex, positionRange);
      }
    };

    const selectItem = (item: Item) => {
      const index = items.indexOf(item);
      if (index >= 0) {
        selectedIndex = index;

        notifySubscribers();
      }
    };

    const selectNext = () => {
      selectedIndex++;
      if (selectedIndex >= items.length) {
        selectedIndex = 0;
      }
      notifySubscribers();
    };

    const selectPrevious = () => {
      selectedIndex--;
      if (selectedIndex < 0) {
        selectedIndex = items.length - 1;
      }
      notifySubscribers();
    };

    const subscribe = (callback: Callback<Item>) => {
      callback(query, items, selectedIndex, positionRange);

      subscribers.add(callback);
      return () => {
        subscribers.delete(callback);
      };
    };

    const update = (
      newQuery: string,
      newItems: Item[],
      newPositionRange: Range | null,
    ) => {
      const previousItem =
        selectedIndex < items.length ? items[selectedIndex] : null;

      positionRange = newPositionRange;
      query = newQuery;
      items = newItems;

      if (previousItem !== null) {
        const newSelectionIndex = items.indexOf(previousItem);
        selectedIndex = newSelectionIndex >= 0 ? newSelectionIndex : 0;
      }

      notifySubscribers();
    };

    return {selectItem, selectNext, selectPrevious, subscribe, update};
  }, []);
  return (
    <TypeAheadContext.Provider value={context}>
      {children}
    </TypeAheadContext.Provider>
  );
};
