/**
 * The Thistle Road and the toll gate, and the road events that can turn up
 * on any road (design 9). Events don't repeat until a region's pool runs out.
 */
import type { Dialogue } from '../../game/dialogue';
import { beforeAfter, narrate, say, simple } from './helpers';

export const ROAD_DIALOGUE: Dialogue[] = [
  simple('road-ahead', [narrate('The road runs on toward Bellwether Fen. You’ll need to settle things at the gate first.')]),
  simple('fenn-gate', [narrate('The big man by the booth is reading the gate as if it might change its mind.'), say('fenn', 'Talk to Mudge. He’s the one with the ledger.')]),
  simple('mudge-gate', [say('mudge', 'Tolls are payable at the gate. The gate is that way. I am also that way.')]),
  beforeAfter(
    'tollgate',
    'toll.won',
    [narrate('The toll gate is down. A sign hangs on it: BACK SOON. — F.H.'), narrate('Under that, an older sign: BACK SOON. Under that, older still: BACK SOON.')],
    [narrate('The gate is up, for the first time in years. A bill is pinned to it, addressed to the Royal Post.')],
  ),
  simple('tollbooth', [
    narrate('Through the window: a ledger, a kettle, and a chair worn to the exact shape of one man.'),
    narrate('A list on the wall is headed TOLLABLE GOODS. Near the bottom, newly added in pencil: FEELINGS (POSTED).'),
  ]),
  {
    id: 'toll-1',
    entry: [{ node: 'n' }],
    nodes: {
      n: {
        lines: [
          narrate('A stout man in a green coat bustles out of the booth with a ledger, tapping it with a pencil.'),
          say('mudge', 'Halt. Toll.'),
          say('rookie', 'We’re the Royal Post.', 'neutral'),
          say('mudge', 'And I’m the Thistle Road Toll Board. Mail is freight. Freight is a penny a pound. That sack looks like forty pounds of somebody’s feelings.'),
          say('odile', 'The Post has gone toll-free since the old king’s charter, Mr. Mudge. Every courier knows that.', 'neutral'),
          say('mudge', 'The Post closes on the seventh day. I’m getting in early.'),
          narrate('The big man by the booth hasn’t moved. He’s still reading the gate.'),
          say('mudge', 'Fenn. See them off.'),
          say('fenn', 'No.'),
          say('mudge', 'I pay you to guard this gate!'),
          say('fenn', 'I am guarding it.'),
          say('mudge', 'Fine. Lads!'),
          narrate('Two men in borrowed hats step out from behind the booth, cracking their knuckles in a way they have practised.'),
        ],
        then: [{ ready: 'fenn' }],
      },
    },
  },
  {
    id: 'toll-2',
    entry: [{ node: 'n' }],
    nodes: {
      n: {
        lines: [
          narrate('Mudge retreats into the booth and locks it from the inside. A small window opens. A bill comes out. The window shuts.'),
          say('fenn', 'Fenn Harrow. I’ve minded this gate twenty-two years.', 'neutral'),
          say('fenn', 'Couriers came through every week. Then every month. Then you.', 'neutral'),
          say('odile', 'Odile Marsh. Thistle Cross post office, retired as of this morning.', 'neutral'),
          say('fenn', 'I know who you are. You used to walk my letters up here yourself. Said the hill did you good.', 'neutral'),
          say('odile', 'It did.', 'happy'),
          say('rookie', 'We’re taking the sack to Kingsend. Everyone in it gets their letter.', 'neutral'),
          say('fenn', 'Everyone?', 'surprised'),
          say('rookie', 'Everyone we can reach.', 'neutral'),
          narrate('Fenn looks at the gate a long time. Then he lifts the toll sign off its hook and slings it on his arm like a shield.'),
          say('fenn', 'Then you’ll want someone for the heavy end.', 'neutral'),
          narrate('Fenn joins the party.'),
          say('odile', 'There’s a letter in your coat, Fenn. Addressed in your own hand.', 'neutral'),
          say('fenn', 'It’ll keep.', 'sad'),
        ],
        then: [{ join: 'fenn' }, { set: 'toll.won' }],
      },
    },
  },

  // -------------------------------------------------------------------------
  // Road events.
  {
    id: 'event-traveller',
    entry: [{ node: 'n' }],
    nodes: {
      n: {
        lines: [
          narrate('A cart sits at an angle in the ditch, one wheel off. Its owner is explaining the situation to the wheel.'),
          say('traveller', 'It was fine. It was fine for eleven years. Then you look away once.'),
        ],
        choices: [
          { text: 'Help with the wheel', next: 'help' },
          { text: 'Wish him luck and walk on', next: 'leave' },
        ],
      },
      help: {
        lines: [
          narrate('It takes all of you and most of an hour. Biscuit supervises.'),
          say('traveller', 'You’re the post? I didn’t think there was any post left. Here, take something for your trouble.'),
        ],
        then: [{ coin: 12 }, { item: 'loaf', n: 1 }, { set: 'event.traveller' }],
      },
      leave: { lines: [say('traveller', 'Luck. Yes. That’s what got me here.')] },
    },
  },
  {
    id: 'event-goat-admirer',
    entry: [{ if: { flag: 'biscuit.joined' }, node: 'n' }, { node: 'none' }],
    nodes: {
      none: { lines: [narrate('A woman leaning on a fence watches you pass, a little disappointed, as if she had hoped for a goat.')] },
      n: {
        lines: [
          narrate('A woman leaning on a fence straightens up at the sight of Biscuit.'),
          say('admirer', 'Oh, now she’s a proper goat. Look at that horn. Look at that attitude.'),
          say('admirer', 'I’ll give you thirty for her. Forty. Name your price.'),
        ],
        choices: [
          { text: 'She isn’t for sale', next: 'no' },
          { text: 'Let her give Biscuit a scratch', next: 'pat' },
        ],
      },
      no: {
        lines: [say('admirer', 'Course she isn’t. The good ones never are.'), narrate('Biscuit looks pleased with herself, and with you.')],
        then: [{ add: 'biscuit.trust', by: 1 }],
      },
      pat: {
        lines: [narrate('The woman scratches Biscuit behind the bent horn. Biscuit closes her eyes and leans into it, then eats the woman’s glove.'), say('admirer', 'Worth it. Here, she’ll want these.')],
        then: [{ item: 'apple', n: 2 }],
      },
    },
  },
  {
    id: 'event-oak',
    entry: [{ node: 'n' }],
    nodes: {
      n: {
        lines: [
          narrate('An old oak stands by the road, its trunk covered in paper. Notes, nailed up and left to the weather.'),
          narrate('MISS YOU, DAD. — YOUR SOUP RECIPE IS STILL WRONG, I’VE BEEN TRYING FOR TEN YEARS. — HAPPY BIRTHDAY, WHEREVER YOU ARE.'),
        ],
        choices: [
          { text: 'Read them all', next: 'read' },
          { text: 'Leave them be', next: 'leave' },
        ],
      },
      read: {
        lines: [
          narrate('You read every one. It takes a while. Nobody hurries you.'),
          say('odile', 'People write to whoever they need to. The address is the least of it.', 'sad'),
          narrate('You walk on lighter, somehow.'),
        ],
        then: [{ heal: 0.25, fp: 0.5 }],
      },
      leave: { lines: [narrate('Some letters aren’t for the post.')] },
    },
  },
  {
    id: 'event-child-courier',
    entry: [{ node: 'n' }],
    nodes: {
      n: {
        lines: [
          narrate('A small child falls into step beside you, carrying a bag that is mostly string.'),
          say('child', 'Are you a real courier? I’m going to be one. I’ve been practising. I deliver to the cows.'),
          say('child', 'Can I carry something? Anything. I’m very fast.'),
        ],
        choices: [
          { text: 'Swear them in as a junior courier', next: 'swear' },
          { text: 'Tell them the Post is closing', next: 'truth' },
        ],
      },
      swear: {
        lines: [
          say('rookie', 'Raise your right hand. Do you promise to get it there, whatever it is?', 'happy'),
          say('child', 'I promise!'),
          narrate('The child runs off at full speed in the wrong direction, then comes back, then runs off in the right one. They leave you an apple, as a fee.'),
        ],
        then: [{ item: 'apple', n: 1 }, { set: 'event.junior' }],
      },
      truth: {
        lines: [say('child', 'Then who’s going to deliver to the cows?'), narrate('Nobody has a good answer.')],
      },
    },
  },
  {
    id: 'event-wedding',
    entry: [{ node: 'n' }],
    nodes: {
      n: {
        lines: [
          narrate('A wedding party comes down the road with a fiddle, a cake on a handcart, and nowhere particular to be.'),
          say('bride', 'You! Couriers! You’re good luck. Everyone knows that. Dance with us.'),
        ],
        choices: [
          { text: 'Dance', next: 'dance' },
          { text: 'Congratulate them and keep going', next: 'go' },
        ],
      },
      dance: {
        lines: [narrate('The fiddler knows three tunes and plays all of them twice. Fenn turns out to be a fine dancer, and is annoyed about it.'), say('bride', 'Take some cake. Take two. Take the bit Biscuit has started.')],
        then: [{ heal: 1, fp: 0.3 }, { item: 'pie', n: 1 }],
      },
      go: { lines: [say('bride', 'Your loss! Bring us a letter one day!')] },
    },
  },
  {
    id: 'event-lost-dog',
    entry: [{ node: 'n' }],
    nodes: {
      n: {
        lines: [narrate('A man is calling for a dog called Sergeant. He has been calling for some time. His voice has gone.'), say('owner', 'Brown. About this high. Answers to anything but his name.')],
        choices: [
          { text: 'Help look', next: 'look' },
          { text: 'Keep an eye out on the way', next: 'leave' },
        ],
      },
      look: {
        lines: [
          narrate('Biscuit walks straight into a hedge, headbutts it, and a small brown dog shoots out the other side.'),
          say('owner', 'Sergeant! You idiot! You absolute treasure!'),
          say('owner', 'Here, it’s not much. Your goat should have a medal.'),
        ],
        then: [{ coin: 20 }, { add: 'biscuit.trust', by: 1 }],
      },
      leave: { lines: [narrate('Later, faintly, you hear the man calling. Then barking. Then the man calling the dog an idiot, fondly.')] },
    },
  },
  {
    id: 'event-shortcut',
    entry: [{ node: 'n' }],
    nodes: {
      n: {
        lines: [say('local', 'Couriers? You don’t want the road. Nobody wants the road. There’s a shortcut through there. Very short. Hardly any cut.')],
        choices: [
          { text: 'Take the shortcut', next: 'take' },
          { text: 'Stick to the road', next: 'stay' },
        ],
      },
      take: {
        lines: [narrate('The shortcut is short. It ends at a clearing full of people who were waiting for someone to take the shortcut.')],
        then: [{ fight: 'random' }],
      },
      stay: { lines: [say('local', 'Suit yourselves.'), narrate('He wanders off toward the shortcut, looking for someone else to tell.')] },
    },
  },
  {
    id: 'event-early-letter',
    entry: [{ node: 'n' }],
    nodes: {
      n: {
        lines: [
          say('pim', 'Is that the post? Is there anything for Pim? Pim Arkwright?'),
          narrate('You check the sack. There’s nothing for Pim.'),
          say('pim', 'No, that’s all right. I wasn’t expecting anything. I’ve not been expecting anything for twenty years. I just like to ask.'),
        ],
        choices: [
          { text: 'Stay and talk a while', next: 'talk' },
          { text: 'Apologise and go', next: 'go' },
        ],
      },
      talk: {
        lines: [narrate('Pim tells you about the letter he didn’t get. It sounds like a good one. He gives you a pot of ink he was saving for the reply.')],
        then: [{ item: 'ink', n: 1 }],
      },
      go: { lines: [say('pim', 'Next time, maybe!')] },
    },
  },
  {
    id: 'event-storm',
    entry: [{ node: 'n' }],
    nodes: {
      n: {
        lines: [narrate('The sky turns the colour of a bruise. There’s a barn by the road with its door open and a lamp lit inside.')],
        choices: [
          { text: 'Shelter until it passes', next: 'shelter' },
          { text: 'Press on through it', next: 'press' },
        ],
      },
      shelter: {
        lines: [narrate('Other travellers are already inside. Someone has soup. Someone else has a song nobody knows the end of. You sleep for an hour.')],
        then: [{ heal: 1, fp: 0.5 }],
      },
      press: {
        lines: [narrate('You arrive soaked, with the letters dry. Odile wrapped them in oilcloth without anyone noticing.')],
      },
    },
  },
  {
    id: 'event-peddler',
    entry: [{ node: 'n' }],
    nodes: {
      n: {
        lines: [say('peddler', 'Rare goods! Things you can’t get in shops! Mostly because shops won’t have them.')],
        choices: [
          { text: 'Smelling Salts (25 coin)', if: { coinAtLeast: 25 }, next: 'salts' },
          { text: 'A Repel Bell (20 coin)', if: { coinAtLeast: 20 }, next: 'bell' },
          { text: 'A pot of good ink (12 coin)', if: { coinAtLeast: 12 }, next: 'ink' },
          { text: 'Just looking', next: 'look' },
        ],
      },
      salts: { lines: [say('peddler', 'Wakes the dead. Well. The nearly dead. Don’t try it on the dead.')], then: [{ coin: -25 }, { item: 'salts', n: 1 }] },
      bell: { lines: [say('peddler', 'Ring it and nothing bothers you. Except me, now and then.')], then: [{ coin: -20 }, { item: 'repel-bell', n: 1 }] },
      ink: { lines: [say('peddler', 'Squid ink. Or possibly not squid.')], then: [{ coin: -12 }, { item: 'ink', n: 1 }] },
      look: { lines: [say('peddler', 'Looking’s free. For now.')] },
    },
  },
  {
    id: 'event-wire-lunch',
    entry: [{ node: 'n' }],
    nodes: {
      n: {
        lines: [
          narrate('A Wire crew sits by a half-strung pole, eating lunch out of tins. One of them waves you over.'),
          say('lineman', 'The post! Come and sit. Don’t worry, we’re not here to put you out of work. We’re here to put you out of work slowly.'),
        ],
        choices: [
          { text: 'Sit with them', next: 'sit' },
          { text: 'Keep walking', next: 'go' },
        ],
      },
      sit: {
        lines: [
          say('lineman', 'A message along the Wire gets there in a minute. Clever. Course, you can’t keep it in a drawer for forty years. You can’t smell it.'),
          say('lineman', 'My gran kept every letter my grandad sent. Nobody’s going to keep a telegram.'),
          narrate('They send you off with half a loaf and a tin of something.'),
        ],
        then: [{ heal: 0.4 }, { item: 'loaf', n: 1 }],
      },
      go: { lines: [say('lineman', 'Mind the wire! It’s live! Actually it isn’t yet. Mind it anyway.')] },
    },
  },
  {
    id: 'event-toll',
    entry: [{ node: 'n' }],
    nodes: {
      n: {
        lines: [narrate('A man with a bucket stands in the middle of the road. A hand-painted sign beside him says ROAD TAX.'), say('tollman', 'Road tax. Ten coin. It goes to the upkeep of the road.'), narrate('The road has not been kept up.')],
        choices: [
          { text: 'Pay the ten coin', if: { coinAtLeast: 10 }, next: 'pay' },
          { text: 'Let Fenn handle it', if: { inParty: 'fenn' }, next: 'fenn' },
          { text: 'Refuse', next: 'refuse' },
        ],
      },
      pay: { lines: [say('tollman', 'Lovely. The road thanks you.'), narrate('Behind you, you hear him tell the road he’ll see it later.')], then: [{ coin: -10 }] },
      fenn: {
        lines: [say('fenn', 'Where’s your licence? Who’s your board? What’s your rate per axle?', 'angry'), say('tollman', 'My what per what?'), say('fenn', 'Go home.', 'neutral'), narrate('He goes home. He leaves the bucket. There are four coins in it.')],
        then: [{ coin: 4 }],
      },
      refuse: { lines: [say('tollman', 'Then you’ll pay another way!'), narrate('He whistles. Things come out of the hedges. Some of them are his friends.')], then: [{ fight: 'random' }] },
    },
  },
];
