import TypeAheadPlugin from '../typeahead/TypeAheadPlugin';

import getMentionsQueryData from './getMentionsQueryData';
import findMatchingMentions from './findMatchingMentions';
import MentionsItemListRenderer from './MentionsItemListRenderer';
import {TeamMember} from './types';
import $createMentionsTextNode from './utils/$createMentionsTextNode';

export default function MentionsPlugin() {
  return (
    <TypeAheadPlugin<TeamMember>
      createTextNode={createTextNode}
      getQueryData={getMentionsQueryData}
      findMatches={findMatchingMentions}
      ItemListRenderer={MentionsItemListRenderer}
    />
  );
}

function createTextNode(teamMember: TeamMember) {
  return $createMentionsTextNode(`@${teamMember.username}`);
}
