/**
 * Talk by the campfire, one conversation a night. The first entry whose
 * condition holds is the one you get, so later stages of the story come first.
 */
import type { Dialogue } from '../../game/dialogue';
import { narrate, say } from './helpers';

export const CAMP_DIALOGUE: Dialogue[] = [
  {
    id: 'camp',
    entry: [
      { if: { all: [{ flag: 'fenn.letterRead' }, { notFlag: 'camp.letter' }] }, node: 'letter' },
      { if: { all: [{ flag: 'fenn.past' }, { notFlag: 'fenn.letterRead' }, { notFlag: 'camp.past' }] }, node: 'past' },
      { if: { all: [{ inParty: 'juniper' }, { notFlag: 'camp.kindhand' }] }, node: 'kindhand' },
      { if: { all: [{ inParty: 'fenn' }, { notFlag: 'camp.gate' }] }, node: 'gate' },
      { if: { notFlag: 'camp.biscuit' }, node: 'biscuit' },
      { node: 'stars' },
    ],
    nodes: {
      gate: {
        lines: [
          narrate('The fire is small and Fenn has built it properly, with a wall of stones on the windward side.'),
          say('rookie', 'Twenty-two years at one gate. Didn’t you get bored?', 'neutral'),
          say('fenn', 'Every day. Boredom’s all right. You know where you are with it.', 'neutral'),
          say('odile', 'He used to read everything that came through. Every sign, every notice, every crate.', 'happy'),
          say('fenn', 'I know more about the price of turnips in the Fen than any man alive.', 'neutral'),
          narrate('Biscuit lies down across Fenn’s feet as if this has been arranged for years.'),
        ],
        then: [{ set: 'camp.gate' }],
      },
      kindhand: {
        lines: [
          narrate('Juniper sits cross-legged by the fire with a stick of wax, softening the end in the flame and shaping it with her thumbnail.'),
          say('juniper', 'Do you know what forgers talk about, when it’s late? The Kind Hand.', 'neutral'),
          say('rookie', 'Who’s that?', 'surprised'),
          say('juniper', 'Nobody knows. That’s the point. The best hand there ever was. Never caught. Never took a penny. Wrote letters for people who needed one, so the story goes.', 'neutral'),
          say('fenn', 'Sounds like a ghost story.', 'neutral'),
          say('juniper', 'It’s the only ghost story I like. I’ve wanted to meet them all my life. Shake their hand. Ask how they do their g’s.', 'happy'),
          say('odile', 'Get some sleep, all of you. The road won’t walk itself.', 'neutral'),
        ],
        then: [{ set: 'camp.kindhand' }],
      },
      past: {
        lines: [
          narrate('Fenn sits a little way from the fire, turning his letter over and over in his big hands without opening it.'),
          say('odile', 'You could read it, Fenn. Nobody would think less of you, whatever it says.', 'sad'),
          say('fenn', 'I would.', 'sad'),
          narrate('He puts it back in his coat.'),
        ],
        then: [{ set: 'camp.past' }],
      },
      letter: {
        lines: [
          narrate('Fenn is singing, very quietly, something about a miller’s daughter. He doesn’t know all the words. He doesn’t seem to mind.'),
          say('juniper', 'I didn’t know you could sing.', 'surprised'),
          say('fenn', 'I can’t. Dunnock couldn’t either. It never stopped him.', 'happy'),
        ],
        then: [{ set: 'camp.letter' }],
      },
      biscuit: {
        lines: [
          narrate('Biscuit eats a sock. Nobody is sure whose. Everyone checks.'),
          say('odile', 'She was the office goat for nine years. She ate the parcel scales once. All of them.', 'happy'),
        ],
        then: [{ set: 'camp.biscuit' }],
      },
      stars: {
        lines: [narrate('Nobody says much. The fire pops, and the stars come out, and somewhere far off the Wire hums along its poles.')],
      },
    },
  },
];
