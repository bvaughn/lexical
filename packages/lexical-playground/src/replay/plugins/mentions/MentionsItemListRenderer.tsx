import {ItemListRendererProps} from '../typeahead/types';

import MentionsItemRenderer from './MentionsItemRenderer';
import './styles.css';
import {TeamMember} from './types';

export default function MentionsItemListRenderer<Item>({
  items,
  popupRef,
  selectedItem,
  selectItem,
}: ItemListRendererProps<TeamMember>) {
  return (
    <div className="mentions-popup" ref={popupRef}>
      {items.map((item, index) => {
        const isSelected = selectedItem === items[index];
        const onClick = () => {
          selectItem(item as TeamMember);
        };

        return (
          <MentionsItemRenderer
            key={index}
            isSelected={isSelected}
            item={item as TeamMember}
            onClick={onClick}
          />
        );
      })}
    </div>
  );
}
