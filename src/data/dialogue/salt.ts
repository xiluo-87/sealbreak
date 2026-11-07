/**
 * The Salt Road: the harbour, letters L12 to L15, the Harbour Ambush,
 * Deputy Inspector Sorrel, and the truth about the sack (design 11).
 */
import type { Choice, Dialogue } from '../../game/dialogue';
import { beforeAfter, deliveryChoices, narrate, say, simple } from './helpers';

/** After the reveal, delivering a forged letter asks whether to tell the truth (design 11). */
function truthOrSilence(letter: string, silence: string, truth: string, before: string): Choice[] {
  return [
    { text: 'Say nothing', if: { flag: 'reveal.done' }, next: silence, then: [{ set: `truth.${letter}`, to: 'silence' }] },
    { text: 'Tell them who really wrote it', if: { flag: 'reveal.done' }, next: truth, then: [{ set: `truth.${letter}`, to: 'truth' }] },
    { text: 'Go on', if: { notFlag: 'reveal.done' }, next: before },
  ];
}

export const SALT_DIALOGUE: Dialogue[] = [
  simple('salt-road-start', [
    narrate('The road comes down out of the hills to the sea, and the sea is enormous and very blue and smells of salt and fish and tar.'),
    say('juniper', 'The Salt Provinces. Forty years ago, coming down this road in that coat would have got you shot.', 'neutral'),
    say('rookie', 'And now?', 'neutral'),
    say('fenn', 'Now they’ll just stare.', 'neutral'),
  ], [{ set: 'salt.roadSeen' }]),
  simple('salt-arrive', [
    narrate('The harbour town is all whitewash and blue shutters and nets drying on poles. People stop talking when you pass, and start again once you’re by.'),
    say('odile', 'Courtesy, everyone. We’re guests here, and not very welcome ones.', 'neutral'),
  ], [{ set: 'salt.arrived' }]),
  simple('salt-not-yet', [say('fenn', 'There are Inspectors all over the quay. Whatever they’re waiting for, it’s us.', 'neutral')]),
  simple('salt-notice', [
    narrate('A brass frame on the harbour wall, polished bright, labelled TREATY OF THE LONG QUARREL. It is empty. It has been empty for forty years.'),
    narrate('Someone has chalked inside it: NO INSPECTORS.'),
  ]),
  simple('inspector-loiter', [say('inspector', 'Move along. Nothing to see. We are simply standing on this quay. In force.')]),
  simple('sorrel-wait', [say('sorrel', 'Give me a moment. I’m deciding what to put in the report.')]),
  {
    id: 'salt-trader',
    entry: [{ if: { flag: 'salt.warm' }, node: 'warm' }, { node: 'cold' }],
    nodes: {
      cold: {
        lines: [say('salttrader', 'Vell coin’s good here. Vell couriers, I’m less sure about.')],
        choices: [
          { text: 'Buy something', then: [{ open: 'shop', id: 'salt' }] },
          { text: 'Not now' },
        ],
      },
      warm: {
        lines: [say('salttrader', 'Friends of Mara’s! Here, I’ll do you a price. Don’t tell the fish.')],
        choices: [
          { text: 'Buy something', then: [{ open: 'shop', id: 'salt' }] },
          { text: 'Not now' },
        ],
      },
    },
  },
  {
    id: 'salt-inn',
    entry: [{ node: 'n' }],
    nodes: {
      n: {
        lines: [say('saltinn', 'The Salt Road Inn. Clean sheets, sea view, and a cook who used to feed a regiment. Which side, she won’t say.')],
        choices: [
          { text: 'Take a room', then: [{ open: 'inn', id: 'salt' }] },
          { text: 'Not now' },
        ],
      },
    },
  },
  beforeAfter(
    'fishwife',
    'salt.warm',
    [say('fishwife', 'Vell couriers. We remember your lot. Your lot remember us too, I expect, but they get it wrong.')],
    [say('fishwife', 'Mara says you’re all right. That’ll do for me. Mind the gulls; they’ll have the buttons off your coat.')],
  ),
  simple('oldsoldier', [
    say('oldsoldier', 'I was at the Front too, same as your big friend there. Other side of it.'),
    say('oldsoldier', 'We had a field post too. Same as yours. Same queue of mothers outside it every morning.'),
    say('oldsoldier', 'Nobody wrote to half of us either.'),
  ]),

  // L13: Harbourmaster Quay.
  {
    id: 'quay',
    entry: [{ if: { letter: 'L13', is: 'delivered' }, node: 'after' }, { node: 'offer' }],
    nodes: {
      offer: {
        lines: [say('quay', 'Harbourmaster Quay. If you’re here about a berth, we’re full. If you’re here about the Inspectors on my quay, so am I.')],
        choices: deliveryChoices('L13', 'Terms of Armistice (Copy)', { sealed: 'sealed', opened: 'opened' }),
      },
      sealed: {
        lines: [
          narrate('The harbourmaster reads it, then reads it again, then fetches his spectacles and reads it a third time.'),
          say('quay', '“The Harbourmaster is directed to post these clauses in a public place.” Forty years late. Directed.'),
          say('quay', 'Clause four. The harbour open to both sides. Without let or hindrance. We’ve been doing it anyway, but it’s nice to have it in writing.'),
          say('quay', 'I’m going to nail this to the harbour wall. Then I’m going to open the market to anyone who can pay, and I’m going to pay you first.'),
        ],
        then: [{ deliver: 'L13' }],
      },
      opened: {
        lines: [
          say('quay', 'Opened. Well, it’s a treaty. Everyone’s read it but me.'),
          narrate('He reads the clauses aloud to the empty office.'),
          say('quay', 'Right. Up on the wall it goes. And the market opens. And you can have this for your trouble.'),
        ],
        then: [{ deliver: 'L13' }],
      },
      after: { lines: [say('quay', 'Clause nine’s my favourite. No fortifications within sight of the light. The Inspectors had to move their hut.')] },
    },
  },

  // L14: Mara Vell-Quay. A forged letter, so after the reveal there's a choice.
  {
    id: 'mara',
    entry: [{ if: { letter: 'L14', is: 'delivered' }, node: 'after' }, { node: 'offer' }],
    nodes: {
      offer: {
        lines: [say('mara', 'You’re the couriers everyone’s talking about. I don’t get letters. Nobody here writes to Vell, and nobody in Vell writes to here.')],
        choices: deliveryChoices('L14', 'We Were Wrong About Each Other', { sealed: 'sealed', opened: 'opened', resealed: 'sealed' }),
      },
      sealed: {
        lines: [
          narrate('Mara reads it in the doorway. Then she sits down on the step, as if her legs have decided for her.'),
          say('mara', 'The soldier at the gate. The winter they took the harbour.'),
          say('mara', 'I remember the cup. I gave him water because he looked about twelve. I didn’t remember his face. I’ve thought about that, since: I gave a man water and never looked at him.'),
        ],
        choices: truthOrSilence('L14', 'silence', 'truth', 'reward'),
      },
      opened: {
        lines: [
          say('mara', 'It’s been opened. Of course it has. Everything from Vell gets opened twice before it gets here.'),
          narrate('She reads it standing up, and her hand goes to the doorframe.'),
          say('mara', 'The soldier at the gate. I remember the cup. I don’t remember him.'),
        ],
        choices: truthOrSilence('L14', 'silence', 'truth', 'reward'),
      },
      silence: {
        lines: [
          narrate('You say nothing. Odile says nothing.'),
          say('mara', 'He wanted to bring the cup back full. I’d like to have seen that.'),
        ],
        next: 'reward',
      },
      truth: {
        lines: [
          say('rookie', 'He didn’t write it. Someone who read soldiers’ letters for years wrote it, for a man who never could.', 'sad'),
          narrate('Mara looks at the letter, and at Odile, who meets her eyes and doesn’t look away.'),
          say('mara', 'So someone on your side thought we were worth a kind lie.'),
          say('mara', 'I don’t know if that’s worse or better. I think I’ll keep it while I decide.'),
        ],
        next: 'reward',
      },
      reward: {
        lines: [say('mara', 'You’ll tell the market you’re friends of mine. They’ll treat you better. They’ll pretend not to, but they will.')],
        then: [{ deliver: 'L14' }],
      },
      after: {
        lines: [say('mara', 'I’ve put the letter on the shelf with a cup in front of it. Full. Don’t ask me why.')],
      },
    },
  },

  // L15: Brin Pike.
  {
    id: 'brin',
    entry: [{ if: { letter: 'L15', is: 'delivered' }, node: 'after' }, { node: 'offer' }],
    nodes: {
      offer: {
        lines: [narrate('A woman is mending a net at the end of the pier, beside a small boat that has very clearly never been painted blue.'), say('brin', 'Brin Pike. If you want a boat, this one’s not for sale. It was my dad’s. He never left a will, so it’s technically the Navy’s.')],
        choices: deliveryChoices('L15', 'Last Will (Unwitnessed)', { sealed: 'sealed', opened: 'opened' }),
      },
      sealed: {
        lines: [
          narrate('Brin reads it, and laughs out loud, and then puts the back of her hand to her mouth.'),
          say('brin', '“The gulls will have to do.” Oh, Dad.'),
          say('brin', '“She steers left, so lean right.” She does! Nobody believes me!'),
          say('brin', 'Well, that’s the Navy told. She’s mine. And you’re going up the coast, aren’t you? Take her round to Gull’s Rest if you need to. She knows the way better than I do.'),
        ],
        then: [{ deliver: 'L15' }],
      },
      opened: {
        lines: [
          say('brin', 'Somebody’s read my dad’s will. Fine. Did you laugh at the bit about blue? Everyone should.'),
          narrate('She reads it and wipes her eyes on her sleeve.'),
          say('brin', 'The boat’s mine, then. If you need to get round to Gull’s Rest, she’ll take you. Lean right.'),
        ],
        then: [{ deliver: 'L15' }],
      },
      after: { lines: [say('brin', 'Painted her name on the side. Not in blue.')] },
    },
  },

  // L12: Capt. Joss Wick, met on the Salt Road.
  {
    id: 'recipient-L12',
    entry: [{ if: { letter: 'L12', is: 'opened' }, node: 'opened' }, { node: 'sealed' }],
    nodes: {
      sealed: {
        lines: [
          narrate('The raider captain recognises the handwriting from three paces away and stops dead.'),
          say('wick', 'That’s Ada.'),
          narrate('He reads it. His raiders pretend not to watch.'),
          say('wick', '“Sulking with a sword.” I am not… I have never…'),
          say('wick', '“The goat ate the washing.” We don’t have a goat. She’s got a goat. She got a goat while I was out here.'),
          say('wick', 'Lads. We’re going home. Don’t argue. I’ll explain on the way, and you won’t understand it either.'),
        ],
        then: [{ deliver: 'L12' }, { set: 'wick.met' }],
      },
      opened: {
        lines: [
          say('wick', 'You’ve read it. Then you know I’m a fool. She said it in writing.'),
          narrate('He reads it anyway, twice.'),
          say('wick', 'Right. Home. All of us. Before she stops writing for good.'),
        ],
        then: [{ deliver: 'L12' }, { set: 'wick.met' }],
      },
    },
  },

  // The Harbour Ambush, Sorrel, and the reveal.
  simple('ambush-1', [
    narrate('Black coats step out from between the warehouses: more Inspectors than you have seen in one place.'),
    say('inspector', 'Royal Postal Inspectorate. You are carrying undelivered mail after notice of closure. Set the sack down and step away from it.'),
    say('fenn', 'Make us.', 'angry'),
  ]),
  simple('sorrel-1', [
    narrate('A young woman in an Inspectorate cap walks down the quay with a clipboard. Her uniform is pressed. Her russet hair is escaping from under the cap on all sides.'),
    say('sorrel', 'Deputy Inspector Lark Sorrel. Please don’t hit me. I’ve only just ironed this.', 'neutral'),
    say('sorrel', 'You’ve made fools of the Inspectorate from Thistle Cross to the sea. I’ll be honest: I’ve enjoyed the reports.', 'happy'),
    say('rookie', 'We’re delivering the post. That’s all.', 'neutral'),
    say('sorrel', 'I know. I believe in the Post as well. It’s why I joined.', 'neutral'),
    say('sorrel', 'But that sack is not just the post. The Chief Inspector has been looking for it for twenty-six years.', 'neutral'),
    say('sorrel', 'There are letters in there from the dead that the dead never wrote. Privates who couldn’t write. Sergeants who couldn’t read. We have a file on the hand behind them as thick as my arm. The forgers have a name for it.', 'neutral'),
    say('juniper', 'The Kind Hand.', 'surprised'),
    say('sorrel', 'The Kind Hand.', 'neutral'),
  ]),
  {
    id: 'reveal-1',
    entry: [{ node: 'n' }],
    nodes: {
      n: {
        lines: [
          narrate('Juniper is already kneeling by the sack. She goes through it fast, setting letters aside, until only a few are left in her hand. She holds them to the light, one beside another, the loupe down over her eye.'),
          say('juniper', 'Look at the g’s. Look how the lines lean when the writer’s tired. Look at the pressure on the downstrokes.', 'neutral'),
          say('juniper', 'These are one hand. Every one of them. It’s one person.', 'surprised'),
          say('juniper', 'And I know it.', 'sad'),
          narrate('She stands up slowly.'),
          say('juniper', 'I’ve seen it every day since the Fen. On the label on that sack. On the list in your cardigan pocket.', 'sad'),
          narrate('Everyone looks at Odile.'),
          narrate('In your coat pocket, the tin with your gran’s letter in it is suddenly very heavy.'),
        ],
        choices: [
          { text: 'Open the tin and look at Gran’s letter', then: [{ set: 'reveal.tin' }] },
          { text: 'Leave the tin closed' },
        ],
      },
    },
  },
  {
    id: 'reveal-2',
    entry: [{ if: { flag: 'reveal.tin' }, node: 'tin' }, { node: 'closed' }],
    nodes: {
      tin: {
        lines: [narrate('You have read it more times than you can count. This time you look at the hand instead of the words.'), narrate('It is the same hand.'), say('rookie', 'Odile?', 'sad')],
        next: 'confess',
      },
      closed: {
        lines: [narrate('You don’t open the tin. You find you don’t need to.'), say('rookie', 'Odile?', 'sad')],
        next: 'confess',
      },
      confess: {
        lines: [
          say('odile', 'Yes.', 'sad'),
          say('odile', 'In the war I ran the field post behind the lines. Every morning there were families writing to boys who were already gone, and boys whose letters were never going to come.', 'sad'),
          say('odile', 'I had read their mail for years. I knew how they talked. So one day I wrote back for one of them. And then I couldn’t stop.', 'sad'),
          say('odile', 'Eight of the letters in that sack are mine. I never got to them all. I needed someone who would carry them the whole way, after I couldn’t.', 'sad'),
          say('rookie', 'And my gran’s?', 'sad'),
          say('odile', 'Tam never wrote. He was gone before he could. Nell came to the post office every morning for a month, and every morning I had to tell her no.', 'sad'),
          say('odile', 'So one morning I told her yes.', 'sad'),
          say('odile', 'And I put your name on the rolls as Senior Courier. That wasn’t a mistake either. I’m sorry.', 'sad'),
          narrate('Nobody says anything. A gull lands on the bollard, looks at everyone, and leaves.'),
          say('fenn', 'They were kind letters.', 'sad'),
          say('juniper', 'The Kind Hand. I’ve wanted to shake your hand my whole life. You could have said something in the Fen.', 'angry'),
          say('odile', 'I could have.', 'sad'),
          say('sorrel', 'Mrs. Marsh, I am arresting you for forging letters in the Royal Post.', 'neutral'),
          narrate('Fenn steps in front of Odile. So, after a moment, does Juniper.'),
          say('fenn', 'No.', 'angry'),
          say('sorrel', 'Then I’m afraid I have to insist.', 'angry'),
        ],
      },
    },
  },
  {
    id: 'sorrel-after',
    entry: [{ node: 'n' }],
    nodes: {
      n: {
        lines: [
          narrate('Sorrel sits down on a bollard, takes her cap off, and puts it back on straight.'),
          say('sorrel', 'All right. You win. I’ll write that I couldn’t catch you, which is true.', 'sad'),
          say('sorrel', 'I don’t know what’s right here. I know the Chief Inspector will burn that sack, and everything in it, real or not.', 'neutral'),
          say('sorrel', 'She’s waiting at the Dead Letter Office. If you’re going to deliver them, do it before you go in.', 'neutral'),
          narrate('She stands, salutes the sack, which is not regulation, and walks back up the quay.'),
          say('odile', 'I’ll understand if any of you want to walk on without me.', 'sad'),
          say('fenn', 'Don’t be daft.', 'neutral'),
          narrate('Odile stays.'),
        ],
        then: [{ set: 'sorrel.beaten' }, { set: 'reveal.done' }],
      },
    },
  },
];
