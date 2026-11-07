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
      { if: { all: [{ flag: 'reveal.done' }, { notFlag: 'camp.reveal' }] }, node: 'reveal' },
      { if: { all: [{ flag: 'reveal.done' }, { inParty: 'juniper' }, { notFlag: 'camp.juniper' }] }, node: 'juniper' },
      { if: { all: [{ flag: 'reveal.done' }, { notFlag: 'camp.quiet' }] }, node: 'quiet' },
      { if: { all: [{ flag: 'fenn.letterRead' }, { notFlag: 'camp.letter' }] }, node: 'letter' },
      { if: { all: [{ flag: 'fenn.past' }, { notFlag: 'fenn.letterRead' }, { notFlag: 'camp.past' }] }, node: 'past' },
      { if: { all: [{ inParty: 'juniper' }, { notFlag: 'camp.kindhand' }] }, node: 'kindhand' },
      { if: { all: [{ inParty: 'fenn' }, { notFlag: 'camp.gate' }] }, node: 'gate' },
      { if: { notFlag: 'camp.biscuit' }, node: 'biscuit' },
      { node: 'stars' },
    ],
    nodes: {
      reveal: {
        lines: [
          narrate('Odile sits on the far side of the fire tonight, with her cardigan pulled round her, and doesn’t knit.'),
          say('odile', 'You can ask me anything. I’ve no right to refuse.', 'sad'),
          say('rookie', 'Did Gran know?', 'sad'),
          say('odile', 'I don’t think so. I hope not. I think she knew it was what Tam would have said, and that was what she needed.', 'sad'),
          say('odile', 'She came into the office every week after that, for years. Never to post anything. Just to say good morning.', 'sad'),
          narrate('The fire settles. Somewhere out in the dark, a sheep says something rude.'),
        ],
        choices: [
          { text: '“It was still a kind thing.”', then: [{ set: 'rookie.forgives' }], next: 'kind' },
          { text: '“You should have told me.”', next: 'told' },
        ],
      },
      kind: { lines: [say('odile', 'Kind isn’t the same as right. I’ve known that for forty years. Thank you all the same.', 'sad')], then: [{ set: 'camp.reveal' }] },
      told: { lines: [say('odile', 'Yes. I should. I was afraid you’d stop walking.', 'sad'), say('rookie', 'I haven’t.', 'neutral')], then: [{ set: 'camp.reveal' }] },
      juniper: {
        lines: [
          narrate('Juniper has been sharpening the same stick of wax for an hour. She hasn’t looked at Odile once.'),
          say('fenn', 'Talk to her or don’t. But stop murdering that wax.', 'neutral'),
        ],
        choices: [
          { text: 'Tell Juniper to go and talk to her', then: [{ set: 'juniper.view', to: 'admire' }], next: 'talk' },
          { text: 'Leave Juniper be', then: [{ set: 'juniper.view', to: 'hurt' }], next: 'leave' },
        ],
      },
      talk: {
        lines: [
          narrate('Juniper gets up, walks round the fire and sits down next to Odile without asking.'),
          say('juniper', 'How do you do your g’s? The tail. I’ve tried for twenty years and I can’t get it.', 'neutral'),
          narrate('Odile looks at her for a long moment. Then she takes the pencil out of Juniper’s pocket and shows her.'),
          say('juniper', 'Oh. Oh, that’s cheating.', 'happy'),
          say('odile', 'Most good things are.', 'happy'),
        ],
        then: [{ set: 'camp.juniper' }],
      },
      leave: {
        lines: [narrate('Juniper goes to bed early, and takes the long way round the fire to do it.'), say('odile', 'She’s entitled.', 'sad')],
        then: [{ set: 'camp.juniper' }],
      },
      quiet: {
        lines: [
          narrate('Nobody says much tonight. Fenn makes tea for everyone, including Odile, without being asked.'),
          narrate('Biscuit lies down with her head on Odile’s foot and won’t be moved.'),
        ],
        then: [{ set: 'camp.quiet' }, { add: 'biscuit.trust', by: 1 }],
      },
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
