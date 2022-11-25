import TypeAheadPlugin from '../typeahead/TypeAheadPlugin';

import $createMentionsNode from './utils/$createMentionsNode';
import getMentionsQueryData from './getMentionsQueryData';
import findMatchingMentions from './findMatchingMentions';
import MentionsItemListRenderer from './MentionsItemListRenderer';
import {TeamMember} from './types';

export default function MentionsPlugin() {
  return (
    <TypeAheadPlugin<TeamMember>
      createItemNode={createItemNode}
      getQueryData={getMentionsQueryData}
      findMatches={findMatchingMentions}
      ItemListRenderer={MentionsItemListRenderer}
    />
  );
}

function createItemNode(teamMember: TeamMember) {
  return $createMentionsNode(teamMember);
}
