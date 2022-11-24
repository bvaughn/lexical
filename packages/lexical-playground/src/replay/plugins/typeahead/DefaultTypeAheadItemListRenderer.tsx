import DefaultTypeAheadItemRenderer from './DefaultTypeAheadItemRenderer';
import {ItemListRendererProps} from './types';

export default function DefaultTypeAheadItemListRenderer<Item>({
  items,
  popupRef,
  selectedItem,
  selectItem,
}: ItemListRendererProps<Item>) {
  return (
    <div className="type-ahead-popup" ref={popupRef}>
      {items.map((item, index) => {
        const isSelected = selectedItem === items[index];
        const onClick = () => {
          selectItem(item as Item);
        };

        return (
          <DefaultTypeAheadItemRenderer
            key={index}
            isSelected={isSelected}
            item={item as Item}
            onClick={onClick}
          />
        );
      })}
    </div>
  );
}
