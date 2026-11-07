/** Kingsend: letters L16 to L18, the office, Chief Inspector Vane and the decree. */
import type { Dialogue } from '../../game/dialogue';
import { beforeAfter, deliveryChoices, narrate, say, simple } from './helpers';

export const KINGSEND_DIALOGUE: Dialogue[] = [
  simple('kingsend-road-start', [
    narrate('The Wire is everywhere now: poles on both sides of the road, lines humming overhead, little porcelain cups catching the light.'),
    say('juniper', 'Every one of those carries a hundred messages an hour. None of them will ever be found in a drawer.', 'neutral'),
    say('odile', 'Last road, everyone.', 'neutral'),
  ], [{ set: 'kingsend.roadSeen' }]),
  simple('kingsend-arrive', [
    narrate('Kingsend is stone and flags and lamplight. Bells are ringing somewhere, and it takes you a moment to understand that they are ringing for the Post.'),
    narrate('A notice on every corner: THE ROYAL POST CLOSES AT SUNDOWN ON THE SEVENTH DAY. GOD SAVE THE QUEEN. ALSO THE WIRE.'),
    say('fenn', 'The Dead Letter Office is the black building on the square. Everything else first, if you’ve anything else to do.', 'neutral'),
  ], [{ set: 'kingsend.arrived' }]),
  simple('office-locked', [narrate('The doors are shut. Inspectors are watching them from the steps.')]),
  simple('fountain', [narrate('A fountain with a bronze courier on top, running. Someone has tied a ribbon to his satchel. Coins glint in the water: wishes, mostly from couriers.')]),
  simple('shelves', [narrate('Shelves and shelves of letters nobody could deliver. Each bundle has a tag: NO SUCH STREET. ADDRESSEE DECEASED. ILLEGIBLE. One just says: TOO LATE.')]),
  simple('vane-wait', [say('vane', 'Come closer, Senior Courier. I would rather not shout in here.', 'neutral')]),
  simple('hqclerk', [
    say('hqclerk', 'Forty-one years at the Royal Post Headquarters, and the last thing I’ll stamp is my own redundancy.'),
    say('hqclerk', 'You’re the courier, aren’t you? The one with the sack? We all have a sweepstake on you. I’ve got you at the palace by Thursday.'),
  ]),
  beforeAfter(
    'pip',
    'queen.audience',
    [say('pip', 'Are you a courier? I drew the Queen a picture. I posted it ages ago. Like a month. It must be lost.'), say('pip', 'It had a sun on it. And her. And a horse, but the horse went wrong.')],
    [say('pip', 'The Queen got my picture! The guard told me! She said the horse was very good! It wasn’t, but she said!')],
  ),
  {
    id: 'arcadist',
    entry: [{ node: 'n' }],
    nodes: {
      n: {
        lines: [say('arcadist', 'Kingsend Arcade. The finest of everything, at the finest prices. Mostly the prices.')],
        choices: [
          { text: 'Buy something', then: [{ open: 'shop', id: 'kingsend' }] },
          { text: 'Not now' },
        ],
      },
    },
  },
  {
    id: 'kinn',
    entry: [{ node: 'n' }],
    nodes: {
      n: {
        lines: [say('kinn', 'The Crown and Satchel. Couriers have stayed here for two hundred years. You might be the last. Best room’s yours.')],
        choices: [
          { text: 'Take a room', then: [{ open: 'inn', id: 'kingsend' }] },
          { text: 'Not now' },
        ],
      },
    },
  },
  {
    id: 'sorrel-kingsend',
    entry: [{ node: 'n' }],
    nodes: {
      n: {
        lines: [
          say('sorrel', 'I’m not here. Officially I’m writing a report in Salt Road.', 'neutral'),
          say('sorrel', 'The Chief’s inside. She’s been at the furnace since dawn, reading the file. She does that.', 'neutral'),
          say('sorrel', 'Whatever happens in there, it was an honour to fail to catch you.', 'happy'),
        ],
      },
    },
  },

  // L16: the Postmaster General.
  {
    id: 'pmg',
    entry: [{ if: { letter: 'L16', is: 'delivered' }, node: 'after' }, { node: 'offer' }],
    nodes: {
      offer: {
        lines: [say('pmg', 'The Postmaster General. Formerly. As of sundown on the seventh day, Postmaster of Nothing in Particular.')],
        choices: deliveryChoices('L16', 'Complaint, Sixth of Many', { sealed: 'sealed', opened: 'opened' }),
      },
      sealed: {
        lines: [
          narrate('The Postmaster General opens it, reads the first line, and begins to laugh.'),
          say('pmg', 'Ogilvy! It’s Ogilvy! The sixth! We never got the sixth! We’ve had the first five framed in the corridor for forty years!'),
          say('pmg', '“I shall continue to write until the matter of my parcel is resolved or one of us is dead.” He got his parcel, you know. In the end. Eleven years late. It was a hat.'),
          say('pmg', 'Here, take my stamp. Take some coin. Go away before I cry on the Royal Mail.'),
        ],
        then: [{ deliver: 'L16' }],
      },
      opened: {
        lines: [
          say('pmg', 'Opened, but who cares, it’s Ogilvy! The sixth complaint! The lost complaint!'),
          narrate('He reads it aloud to the corridor, where three clerks gather to listen with their eyes shut, like a choir.'),
          say('pmg', 'Take my stamp. Take some coin. Go on.'),
        ],
        then: [{ deliver: 'L16' }],
      },
      after: { lines: [say('pmg', 'We’ve hung it with the others. The set is complete. I can retire now. I have to retire now. Still.')] },
    },
  },

  // L17: Pip's drawing, for the Queen.
  {
    id: 'palace',
    entry: [{ if: { letter: 'L17', is: 'delivered' }, node: 'after' }, { node: 'offer' }],
    nodes: {
      offer: {
        lines: [say('royalguard', 'The palace is closed to the public. The Queen sees no one without an appointment, and there are no appointments.')],
        choices: deliveryChoices('L17', 'A Child’s Drawing', { sealed: 'sealed', opened: 'opened' }),
      },
      sealed: {
        lines: [
          narrate('The guard takes the envelope, which has a sun drawn on the back of it, very carefully, as if it might be dangerous.'),
          say('royalguard', '“To the Queen, from Pip, age seven.” Right.'),
          narrate('He goes inside. You wait for some time. When he comes back, he is standing up even straighter.'),
          say('royalguard', 'Her Majesty has received the drawing. Her Majesty says the horse is very good. Her Majesty will see the couriers, when their business is done.'),
        ],
        then: [{ deliver: 'L17' }],
      },
      opened: {
        lines: [
          say('royalguard', 'This has been opened. Have you been showing the Queen’s post around? …Is that a horse?'),
          narrate('He takes it inside anyway. When he comes back, he is standing up even straighter.'),
          say('royalguard', 'Her Majesty will see the couriers, when their business is done.'),
        ],
        then: [{ deliver: 'L17' }],
      },
      after: { lines: [say('royalguard', 'Her Majesty has put the drawing on the mantelpiece. Between two Old Masters. The Old Masters have been moved.')] },
    },
  },

  // Outside the office.
  {
    id: 'outside-1',
    entry: [{ if: { flag: 'spare.days', is: 2 }, node: 'few' }, { node: 'many' }],
    nodes: {
      few: {
        lines: [
          narrate('A single Inspector stands on the office steps, looking at his watch, then at the sky, then at you.'),
          say('inspector', 'You’re early. Everyone else is still on the roads looking for you. Well. I suppose it’s me, then.'),
        ],
      },
      many: {
        lines: [
          narrate('Inspectors are waiting on the steps of the Dead Letter Office in a neat black row.'),
          say('inspector', 'Last day of the Post, last courier on the rolls. The Chief Inspector would like that sack. So would we.'),
        ],
      },
    },
  },
  simple('outside-2', [narrate('The doors of the Dead Letter Office swing open. Inside, at the far end of a long room of shelves, a fire is burning.')]),

  // Vane.
  {
    id: 'vane-1',
    entry: [{ node: 'n' }],
    nodes: {
      n: {
        lines: [
          narrate('A tall woman in a black uniform stands by the furnace with a file open in her grey-gloved hands. She closes it as you come in.'),
          say('vane', 'Chief Inspector Cressida Vane. You must be the Senior Courier.', 'neutral'),
          say('vane', 'I have read every report. The toll gate. The bailiff. The engine. Deputy Inspector Sorrel says she could not catch you. Sorrel has never failed to catch anyone.', 'neutral'),
          say('vane', 'The Post closes at sundown. Everything in that sack is mine by law. I would prefer you to hand it over.', 'neutral'),
          say('odile', 'Cressida.', 'sad'),
          say('vane', 'Mrs Marsh. I know who you are. I have known for a week. I have wanted to know for twenty-six years.', 'neutral'),
          say('vane', 'When I was nine, I had a letter from my father. He had been dead a month. It was the most beautiful thing anyone has ever said to me. I read it every night until I was grown.', 'sad'),
          say('vane', 'Then I joined the Inspectorate and I saw the file. Your hand. On my father’s letter.', 'angry'),
          say('vane', 'You do not get to decide what people need to hear, Mrs Marsh. Nobody does. Put the sack down.', 'angry'),
          say('fenn', 'No.', 'angry'),
        ],
      },
    },
  },
  {
    id: 'vane-reads',
    entry: [{ node: 'n' }],
    nodes: {
      n: {
        lines: [
          narrate('You hold out the letter. Vane stops with her stamp raised.'),
          narrate('TO MY CRESSIDA. In a hand she has never seen, and knows at once.'),
          say('vane', 'That is not your hand.', 'surprised'),
          say('odile', 'No. It’s his. It was in the sack all along. I never knew whose it was.', 'sad'),
          narrate('Vane lowers the stamp. She reads the letter standing by the furnace. It is short. It is about a stream, and a jam jar, and a frog she would not put back.'),
          say('vane', 'He couldn’t spell greens. He never could. I had forgotten that.', 'sad'),
          say('vane', 'The other one was so much better than this.', 'sad'),
          narrate('She reads it again.'),
          say('vane', 'This one is his.', 'sad'),
        ],
        then: [{ deliver: 'L18' }, { set: 'vane.read' }],
      },
    },
  },
  {
    id: 'vane-falls',
    entry: [{ node: 'n' }],
    nodes: {
      n: {
        lines: [
          narrate('Vane goes down on one knee by the furnace, and stays there.'),
          say('vane', 'Well. The law will take its course without me. Sundown is sundown.', 'sad'),
          narrate('Behind her, the furnace roars, waiting.'),
        ],
      },
    },
  },
  {
    id: 'decree',
    entry: [{ node: 'n' }],
    nodes: {
      n: {
        lines: [
          narrate('A clerk comes in with a silver tray. On it lies the Decree of Closure: the Royal Post, closed by order of the Crown, to be countersigned by the last courier on the rolls.'),
          narrate('He holds out a pen. Biscuit, who has been very good all day, looks at the decree with great interest.'),
        ],
        choices: [
          { text: 'Sign it', then: [{ set: 'decree.signed' }] },
          { text: 'Let Biscuit have it', if: { all: [{ flagAtLeast: 'biscuit.trust', n: 5 }, { flag: 'biscuit.joined' }] }, then: [{ set: 'ending.goat' }], next: 'goat' },
        ],
      },
      goat: {
        lines: [
          narrate('Biscuit eats the Decree of Closure. She eats the seal. She considers the silver tray, and decides against it.'),
          say('fenn', 'Well.', 'surprised'),
          say('juniper', 'I can’t forge that. Nobody could. There’s nothing left to forge.', 'happy'),
          say('odile', 'Without a decree, there’s no closure. The Post is still open.', 'happy'),
        ],
      },
    },
  },
];
