/** Copperhill and its road: the Union Hall, Old Brass, Fenn's memorial, and letters L08 to L11. */
import type { Dialogue } from '../../game/dialogue';
import { beforeAfter, deliveryChoices, narrate, say, simple } from './helpers';

export const COPPERHILL_DIALOGUE: Dialogue[] = [
  simple('cop-road-start', [
    narrate('The hills here are heaps: black slag, rust-red spoil, and the Wire’s new poles marching over the top of all of it.'),
    say('fenn', 'Copperhill.', 'sad'),
    say('juniper', 'You’ve been?', 'neutral'),
    say('fenn', 'Once.', 'neutral'),
  ], [{ set: 'cop.roadSeen' }]),
  {
    id: 'cop-arrive-1',
    entry: [{ node: 'n' }],
    nodes: {
      n: {
        lines: [
          narrate('Copperhill is quiet in the way a town gets before a shout. Men stand about outside the Union Hall in their work clothes, not working.'),
          narrate('Somewhere under the east end of town, something big turns over in its sleep. The cobbles hum.'),
          say('odile', 'They’re on strike, by the look of it. Mind your step and your manners.', 'neutral'),
        ],
        then: [{ set: 'cop.arrived' }],
      },
    },
  },
  simple('copper-not-yet', [narrate('The east road runs right past the mouth of the Old Mine. Something in there is awake, and it doesn’t want anyone on that road.')]),
  simple('cop-notice', [
    narrate('COPPERHILL MINING COMPANY. NOTICE. Wages for the quarter will be settled in Company scrip, redeemable at the Company store.'),
    narrate('Someone has added in chalk: REDEEMABLE FOR WHAT?'),
  ]),
  simple('miner1', [say('miner1', 'Scrip. They want to pay us in scrip. You can’t eat scrip. Well. You can. I tried.')]),
  beforeAfter(
    'miner2',
    'brass.beaten',
    [say('miner2', 'Hear that rumbling? That’s Old Brass, in the Old Mine. War engine. Comes out at the east road and won’t let anyone by. Been worse this week.')],
    [say('miner2', 'Old Brass, quiet. Forty years I’ve heard that thing grumbling under my bed. I don’t know if I’ll be able to sleep.')],
  ),
  {
    id: 'storekeep',
    entry: [{ node: 'n' }],
    nodes: {
      n: {
        lines: [say('storekeep', 'Company Store. We take coin, and scrip, and coin.')],
        choices: [
          { text: 'Buy something', then: [{ open: 'shop', id: 'copperhill' }] },
          { text: 'Not now' },
        ],
      },
    },
  },
  {
    id: 'landlord',
    entry: [{ node: 'n' }],
    nodes: {
      n: {
        lines: [say('landlord', 'The Davy Lamp. Beds, beer, and no Company men. Well. One. He’s asleep in the corner. He’s been there since the strike.')],
        choices: [
          { text: 'Take a room', then: [{ open: 'inn', id: 'copperhill' }] },
          { text: 'Not now' },
        ],
      },
    },
  },
  simple('ashworth', [
    say('ashworth', 'J. Ashworth, clerk to the Directors. I wrote the scrip notice. I want you to know I wrote it very well.'),
    say('ashworth', 'Nobody ever says, “Ashworth, that was an elegant sentence about deferred wages.” Nobody.'),
  ]),

  // The Union Hall brawl, and L08.
  {
    id: 'brannigan',
    entry: [
      { if: { letter: 'L08', is: 'delivered' }, node: 'after' },
      { if: { flag: 'union.side', is: 'company' }, node: 'offerCold' },
      { if: { flag: 'union.brawl' }, node: 'offer' },
      { node: 'brawl' },
    ],
    nodes: {
      brawl: {
        lines: [
          say('brannigan', 'Brannigan, Union secretary. You’ve picked a fine morning. The Company’s sent its lads round to break up the meeting.'),
          narrate('Three men in bowler hats are coming down the street with clubs, whistling.'),
          say('brannigan', 'So. Are you with us, or are you with them? Nobody stands in the middle in Copperhill. The middle’s where they hit hardest.'),
        ],
        choices: [
          { text: 'With the miners', then: [{ set: 'union.side', to: 'miners' }, { fight: 'union-thugs', after: 'union-won-miners' }] },
          { text: 'With the Company', then: [{ set: 'union.side', to: 'company' }, { fight: 'union-miners', after: 'union-won-company' }] },
          { text: 'We’re just passing through' },
        ],
      },
      offer: {
        lines: [say('brannigan', 'Post, is it? Anything for the Union Hall? We’ve had nothing but notices for a year.')],
        choices: deliveryChoices('L08', 'Wages Owed, Company Scrip', { sealed: 'sealed', opened: 'opened' }),
      },
      offerCold: {
        lines: [say('brannigan', 'Post, is it? You picked your side. Go on, then. What’s the Company sent us now?')],
        choices: deliveryChoices('L08', 'Wages Owed, Company Scrip', { sealed: 'sealed', opened: 'opened' }),
      },
      sealed: {
        lines: [
          narrate('Brannigan reads it aloud to the men on the steps. By the second paragraph there is muttering. By the third, laughter.'),
          say('brannigan', '“Any man who prefers coin may apply in writing.” Did you hear that, lads? In writing!'),
          say('brannigan', 'Get the paper out. Every man in Copperhill is going to apply in writing. Every single one. In his best hand.'),
          say('brannigan', 'That’s a turn, I’ll give you that. Here: a Miners’ Token. It opens the old workings by the east road. There’s stores up there nobody’s touched since the war.'),
        ],
        then: [{ deliver: 'L08' }],
      },
      opened: {
        lines: [
          say('brannigan', 'Opened, is it? Well, it’s Company paper. Can’t think it’d be any more insulting sealed.'),
          narrate('He reads it aloud anyway. The men laugh at “apply in writing” and go for paper.'),
          say('brannigan', 'Here. A Miners’ Token, for the old workings by the east road. Fair’s fair.'),
        ],
        then: [{ deliver: 'L08' }],
      },
      after: { lines: [say('brannigan', 'Four hundred applications! In writing! Ashworth has to read every one. Some of them are in verse.')] },
    },
  },
  simple('union-won-miners', [
    say('brannigan', 'That’s seen them off. Copperhill won’t forget it.'),
    narrate('The miners cheer. Somebody buys Fenn a drink, and then somebody else does, and Fenn has to be quite firm about it.'),
  ]),
  simple('union-won-company', [
    say('brannigan', 'Well. We know where you stand, then.'),
    narrate('The miners go quiet and back into the hall. Ashworth tips his hat to you from across the street. It doesn’t feel as good as you thought it would.'),
  ]),

  // Old Brass.
  {
    id: 'brass-1',
    entry: [{ node: 'n' }],
    nodes: {
      n: {
        lines: [
          narrate('The cobbles jump. With a noise like a church organ falling downstairs, something rolls out of the mouth of the Old Mine.'),
          narrate('It is an engine the size of a cottage, all boiler and brass and guns, with a face like a stove door.'),
          narrate('It speaks in a voice made of whistles: HALT. PASS HELD BY ORDER. FOURTH ENGINEERS. NONE SHALL PASS UNTIL RELIEVED.'),
          say('fenn', 'Old Brass.', 'surprised'),
          say('juniper', 'You know it?', 'surprised'),
          say('fenn', 'It knows me.', 'sad'),
        ],
      },
    },
  },
  {
    id: 'brass-2',
    entry: [{ node: 'n' }],
    nodes: {
      n: {
        lines: [
          narrate('Old Brass shudders, lets out a long sigh of steam, and settles onto its tracks. The light in its face goes out.'),
          say('fenn', 'The Fourth left it here to hold the pass, so the rest of us could get over the river.', 'sad'),
          say('fenn', 'Squad Seven was dug in up at the Front, holding the road for them. I was in Seven. When the shelling started, I ran.', 'sad'),
          say('odile', 'You were nineteen, Fenn.', 'sad'),
          say('fenn', 'So were they.', 'sad'),
          narrate('Nobody says anything for a while. The engine ticks as it cools.'),
          say('fenn', 'Their names are on the memorial. I’ve never gone and looked.', 'neutral'),
        ],
        then: [{ set: 'brass.beaten' }, { set: 'fenn.past' }],
      },
    },
  },

  // The memorial and Fenn's letter.
  {
    id: 'memorial',
    entry: [{ if: { flag: 'fenn.letterRead' }, node: 'after' }, { node: 'n' }],
    nodes: {
      n: { lines: [narrate('A stone soldier on a plinth, and under him the names of Copperhill’s dead. Someone keeps the names polished. The stone around them is black with soot.')] },
      after: { lines: [narrate('Seven names together near the bottom, polished brighter than the rest. Someone has put a wildflower in the gap between two of them.')] },
    },
  },
  {
    id: 'memorial-fenn',
    entry: [
      { if: { all: [{ flag: 'fenn.dunnock' }, { flag: 'fenn.squad' }] }, node: 'both' },
      { if: { flag: 'fenn.dunnock' }, node: 'dunnock' },
      { if: { flag: 'fenn.squad' }, node: 'squad' },
      { node: 'plain' },
    ],
    nodes: {
      plain: {
        lines: [
          narrate('Fenn stands in front of the memorial for a long time. His lips move as he reads the names.'),
          say('fenn', 'Hale. Dunnock. Pryce. Okafor. Lister. Fisher. Moss.', 'sad'),
          say('fenn', 'Moss isn’t dead. He’s just on here. Somebody got it wrong.', 'neutral'),
        ],
        next: 'open',
      },
      dunnock: {
        lines: [
          narrate('Fenn stands in front of the memorial, reading the names. Old Man Dunnock comes out of the forge and stands beside him, wiping his hands.'),
          say('dunnock', 'Sam talked about you. In his letters. “Harrow’s got feet like canal boats.”'),
          say('fenn', 'I left him.', 'sad'),
          say('dunnock', 'He said you’d run. In the last one. He said good. He said somebody ought to.'),
        ],
        next: 'open',
      },
      squad: {
        lines: [
          narrate('Fenn stands in front of the memorial, reading the names.'),
          say('fenn', 'I heard their names read out at the Front. Every one of them answered, in that letter. All present.', 'sad'),
          say('fenn', 'All but me.', 'sad'),
        ],
        next: 'open',
      },
      both: {
        lines: [
          narrate('Fenn stands in front of the memorial. Old Man Dunnock comes out of the forge and stands beside him.'),
          say('dunnock', 'Sam talked about you. Said you’d run. Said good, somebody ought to.'),
          say('fenn', 'I heard them all answer at the Front. All present. All but me.', 'sad'),
          say('dunnock', 'Well. You’re present now.'),
        ],
        next: 'open',
      },
      open: {
        lines: [
          narrate('Fenn takes the letter out of his coat. The paper has gone soft as cloth.'),
          say('fenn', 'They sent it after me. I’ve carried it forty years. I thought if I didn’t open it, it couldn’t say what I knew it said.', 'sad'),
          narrate('He opens it.'),
        ],
      },
    },
  },
  simple(
    'memorial-fenn-2',
    [
      narrate('Fenn reads it twice. Then he folds it, and laughs, once, and wipes his face with the back of his hand.'),
      say('fenn', 'He was wearing my boots. Of course he was.', 'happy'),
      say('fenn', '“We were glad.” Forty years I’ve had that in my pocket.', 'sad'),
      say('odile', 'Sometimes a letter waits for you to be ready for it.', 'sad'),
      say('fenn', 'Come on. There’s a lot of road left, and I’ve a pint to drink for each of them. I’m not going to count.', 'happy'),
    ],
    [{ set: 'fenn.letterRead' }],
  ),

  // L09: Old Man Dunnock.
  {
    id: 'dunnock',
    entry: [{ if: { letter: 'L09', is: 'delivered' }, node: 'after' }, { node: 'offer' }],
    nodes: {
      offer: {
        lines: [narrate('An old man sits in the door of a cold forge, hands folded, looking at nothing.'), say('dunnock', 'Forge is shut. Has been a while.')],
        choices: deliveryChoices('L09', 'Tell Pa I Didn’t Run', { sealed: 'sealed', opened: 'opened', resealed: 'resealed' }),
      },
      sealed: {
        lines: [
          narrate('Dunnock reads it slowly, holding it at arm’s length.'),
          say('dunnock', '“Feet apart, chin down, like at the forge.” I did teach him that. He was hopeless at it. Kept dropping the tongs on his foot.'),
          say('dunnock', '“Light the forge in the mornings.”'),
          narrate('He gets up. He goes inside. After a while you hear the bellows, and then the first hammer in a long time.'),
        ],
        next: 'medal',
      },
      opened: {
        lines: [
          say('dunnock', 'This has been read.'),
          narrate('He reads it anyway, very slowly.'),
          say('dunnock', 'Doesn’t matter who else knows my boy stood his ground. Let the whole town know.'),
          narrate('He gets up and goes into the forge. After a while you hear the bellows.'),
        ],
        next: 'medal',
      },
      resealed: {
        lines: [
          narrate('Dunnock runs his thumb over the seal and says nothing. He reads it.'),
          say('dunnock', '“Light the forge in the mornings.”'),
          narrate('He goes inside. You hear the bellows, then the hammer.'),
        ],
        next: 'medal',
      },
      medal: {
        lines: [
          narrate('He comes back with a medal on a faded ribbon.'),
          say('dunnock', 'They sent me this after. I never knew where to put it. You’ve a long way to walk. Take it.'),
          say('dunnock', 'And your big friend there. Harrow. Sam wrote about a Harrow. Tell him he’s welcome at the forge.'),
        ],
        then: [{ deliver: 'L09' }],
      },
      after: { lines: [narrate('The forge is lit. Dunnock is hammering something that doesn’t need hammering, very loudly, and the whole street can hear it.')] },
    },
  },

  // L11: Widow Tarn. The first real clue.
  {
    id: 'tarn',
    entry: [{ if: { letter: 'L11', is: 'delivered' }, node: 'after' }, { node: 'offer' }],
    nodes: {
      offer: {
        lines: [say('tarn', 'You’ll be the post. I’d heard there was a sack going about. I didn’t like to hope.')],
        choices: deliveryChoices('L11', 'Your Son Is Well', { sealed: 'sealed', opened: 'opened', resealed: 'resealed' }),
      },
      sealed: {
        lines: [
          narrate('Widow Tarn reads it in the doorway with her glasses on and then with them off.'),
          say('tarn', '“He sings in the evenings.” He did. Terribly. The one about the miller’s daughter, every night, until his father threw a boot.'),
          say('tarn', 'It’s a kind letter. It’s a very kind letter.'),
          narrate('She looks at the signature for a long time.'),
          say('tarn', 'Sergeant Bell couldn’t write, you know. Couldn’t read, either. My boy wrote his letters home for him. Told me so.'),
          say('tarn', 'So I don’t know who wrote this. But whoever it was, they knew my son. Thank them for me, if you ever meet them.'),
        ],
        next: 'end',
      },
      opened: {
        lines: [
          say('tarn', 'It’s been opened. Well, I’m sure it was opened before ever it reached you.'),
          narrate('She reads it, and smiles at the part about the singing.'),
          say('tarn', 'Sergeant Bell couldn’t write, you know. My boy did his letters for him. So I don’t know who wrote this.'),
          say('tarn', 'If you ever find them, thank them for me.'),
        ],
        next: 'end',
      },
      resealed: {
        lines: [
          narrate('She reads it, and smiles at the part about the singing.'),
          say('tarn', 'Sergeant Bell couldn’t write, you know. Couldn’t read. My boy did his letters for him.'),
          say('tarn', 'So whoever wrote this, it wasn’t Bell. Thank them for me, if you ever meet them.'),
        ],
        next: 'end',
      },
      end: {
        lines: [say('juniper', '…', 'neutral'), narrate('Juniper doesn’t say anything, which is so unusual that everyone notices.')],
        then: [{ deliver: 'L11' }, { set: 'clue.tarn' }],
      },
      after: { lines: [say('tarn', 'I read it every evening. Someone took the trouble. That’s what I keep thinking. Someone took the trouble.')] },
    },
  },

  // L10: Foreman Hask, met on the Copperhill Road.
  {
    id: 'recipient-L10',
    entry: [{ if: { letter: 'L10', is: 'opened' }, node: 'opened' }, { node: 'sealed' }],
    nodes: {
      sealed: {
        lines: [
          narrate('The foreman wipes his hands on his trousers before he takes the letter, which tells you something about him.'),
          say('hask', 'From the Board? They never write back. They never…'),
          say('hask', 'The old mine road. They’re taking the line the way I said. And a shilling a pole. And Kingsend.'),
          say('hask', 'Lads! Down tools! We’re not fighting the post, we’re buying it a drink!'),
        ],
        then: [{ deliver: 'L10' }, { set: 'hask.met' }],
      },
      opened: {
        lines: [
          say('hask', 'Somebody’s read this. Probably the Board itself, checking its spelling.'),
          narrate('He reads it and his face goes slowly pink with pleasure.'),
          say('hask', 'They listened. Well, I’ll be. Lads, leave them be. They’re carrying good news.'),
        ],
        then: [{ deliver: 'L10' }, { set: 'hask.met' }],
      },
    },
  },

  // The Old Mine.
  simple('mine-locked', [narrate('The mine gate is chained. A sign says: UNION MEMBERS ONLY. TOKEN REQUIRED.')]),
  simple('mine-enter', [narrate('The upper workings are dry and quiet. Rails run off into the dark, and there are crates nobody has opened since the war.')], [{ set: 'mine.seen' }]),
  {
    id: 'mine-crate-a',
    entry: [{ if: { flag: 'mine.crateA' }, node: 'empty' }, { node: 'full' }],
    nodes: {
      full: { lines: [narrate('An old field-dressing crate. Inside, still sealed in oilcloth: smelling salts and a pot of ink.')], then: [{ item: 'salts', n: 1 }, { item: 'ink', n: 1 }, { set: 'mine.crateA' }] },
      empty: { lines: [narrate('Empty now, apart from a very old sandwich.')] },
    },
  },
  {
    id: 'mine-crate-b',
    entry: [{ if: { flag: 'mine.crateB' }, node: 'empty' }, { node: 'full' }],
    nodes: {
      full: { lines: [narrate('A pay chest, forced open long ago. Someone missed the bottom tray: sixty coin, in wartime silver.')], then: [{ coin: 60 }, { set: 'mine.crateB' }] },
      empty: { lines: [narrate('Empty.')] },
    },
  },
  simple('mine-orders', [
    narrate('A board nailed to the wall, the paint nearly gone: FOURTH ENGINEERS. STANDING ORDERS. THE ENGINE WILL HOLD THE PASS UNTIL RELIEVED.'),
    narrate('Underneath, in pencil, in a dozen different hands: RELIEVED? and WHEN? and, lower down, GONE HOME. SORRY, BRASS.'),
  ]),
];
