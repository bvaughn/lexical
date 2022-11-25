import {$applyNodeReplacement} from 'lexical';

import MentionsNode from '../MentionsNode';
import {TeamMember} from '../types';

export default function $createMentionsNode(
  teamMember: TeamMember,
): MentionsNode {
  const mentionsNode = new MentionsNode(teamMember);

  return $applyNodeReplacement(mentionsNode);
}
