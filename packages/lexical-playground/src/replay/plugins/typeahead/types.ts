import {GridSelection, NodeSelection, RangeSelection, TextNode} from 'lexical';
import {RefObject} from 'react';

export type Callback<Item> = (
  query: string,
  items: Item[],
  selectedIndex: number,
  positionRange: Range | null,
) => void;

export type ContextShape<Item> = {
  selectItem: (item: Item) => void;
  selectNext: () => void;
  selectPrevious: () => void;
  subscribe: (callback: Callback<Item>) => () => void;
  update: (_: string, __: Item[], ___: Range | null) => void;
};

export type HookShape<Item> = {
  positionRange: Range | null;
  query: string;
  selectedIndex: number;
  selectedItem: Item | null;
  items: Item[];
  selectItem: (item: Item) => void;
  selectNext: () => void;
  selectPrevious: () => void;
  stateRef: {
    current: HookState<Item>;
  };
  update: (_: string, __: Item[], ___: Range | null) => void;
};

export type HookState<Item> = {
  positionRange: Range | null;
  query: string;
  selectedIndex: number;
  items: Item[];
};

export type ItemListRendererProps<Item> = {
  items: Item[];
  popupRef: RefObject<HTMLDivElement>;
  selectedItem: Item | null;
  selectItem: (item: Item) => void;
};

export type ItemRendererProps<Item> = {
  isSelected: boolean;
  item: Item;
  onClick: () => void;
};

export type QueryData = {
  query: string;
  beginOffset: number;
  beginTextNode: TextNode;
  endOffset: number;
  endTextNode: TextNode;
  positionRange: Range | null;
};

export type SearchPromise<Item> = {
  dismiss: () => void;
  promise: Promise<Item[]>;
};

export type TypeAheadSelection = RangeSelection | NodeSelection | GridSelection;
