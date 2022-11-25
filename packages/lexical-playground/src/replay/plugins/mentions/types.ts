import type {Spread} from 'lexical';
import {type SerializedLexicalNode} from 'lexical';

export type SerializedMentionsNode = Spread<
  {
    teamMember: TeamMember;
    type: 'mentions-item';
    version: 1;
  },
  SerializedLexicalNode
>;

export type TeamMember = {
  name: string;
  username: string;
};
