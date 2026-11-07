/**
 * Thistle Cross: the arrival, the office scene and the people of the town.
 * Lines are kept short; humour comes from people being people.
 */
import type { Dialogue } from '../../game/dialogue';
import { beforeAfter, deliveryChoices, narrate, say, simple } from './helpers';

const DONE = 'intro.done';

export const THISTLE_CROSS_DIALOGUE: Dialogue[] = [
  simple('arrival', [
    narrate('Thistle Cross, on the first morning of the last week of the Royal Post.'),
    narrate('By royal decree, the Post closes at sundown on the seventh day. After that it will all be the Wire: telegraph poles from here to Kingsend.'),
    narrate('You have one good coat, one tin, and an application for a sorting job.'),
    say('rookie', 'Post office. Red door. Can’t miss it.'),
  ]),

  // The office scene, in four parts around the walking.
  simple(
    'office-1',
    [
      narrate('The post office smells of string, dust and toffee. Half the pigeonholes are already empty.'),
      say('odile', 'We’re closing, love. Six days and a bit. If it’s stamps you’re after, I’ll do you a very good price.', 'neutral'),
      say('rookie', 'I’m here about the sorting job. I wrote in.'),
      say('odile', 'You wrote in. To a post office with a week to live.', 'surprised'),
      say('odile', 'Well. Somebody raised you properly. Name?', 'happy'),
      say('rookie', '{name}.'),
      say('odile', '{name}, {name}… here you are. Oh.', 'neutral'),
      say('odile', 'Oh, dear.', 'surprised'),
      say('rookie', 'Is it bad?', 'surprised'),
      say('odile', 'Kingsend’s had a go at the paperwork. You’re not down for sorting. You’re down as Senior Courier.', 'neutral'),
      say('odile', 'Brass buttons. A pension. Sole authority over any mail in hand.', 'neutral'),
      say('rookie', 'I’ve never delivered anything. I delivered a cake once. It was to me.', 'surprised'),
      say('odile', 'Doesn’t matter. In this kingdom the paperwork wins. It’s the only thing that ever does.', 'happy'),
      narrate('Something heavy slides off the top shelf behind the counter and lands with a thump.'),
    ],
    [{ set: 'intro.sackFell' }],
  ),
  simple(
    'office-rats',
    [
      narrate('The sack twitches. Something inside it squeaks.'),
      say('odile', 'Rats. In the HELD sack. Of course there are.', 'angry'),
      narrate('She fishes a letter out of the sack and presses it into your hand.'),
      say('odile', 'Hold this. Sealed words keep hold of whatever they were written with. In a pinch, so can you.', 'neutral'),
      say('odile', 'Senior Courier, I believe this is your department.', 'neutral'),
    ],
    [{ give: 'L02', to: 'rookie' }],
  ),
  simple('office-after-rats', [
    say('odile', 'Well swung. You’ll do.', 'happy'),
    say('odile', 'Now. Let’s see what they were nesting in.', 'neutral'),
  ]),
  simple('office-2', [
    say('odile', 'Now where did you come from?', 'surprised'),
    say('odile', 'It’s tagged HELD. Twenty-four letters, never sent.', 'neutral'),
    say('odile', 'Some of these are older than you. A lot of them are from the war.', 'sad'),
    say('rookie', 'Why were they held?'),
    say('odile', 'All sorts. Wrong address. No stamp. The censors. A war on.', 'neutral'),
    say('odile', 'Mostly a war on.', 'sad'),
    say('rookie', 'What happens to them now?', 'sad'),
    say('odile', 'When the Post closes, anything still in hand goes to the Dead Letter Office in Kingsend. They’ve a furnace there. Very modern.', 'neutral'),
    say('rookie', 'They burn them?', 'surprised'),
    say('odile', 'Unless a courier on the rolls delivers them first. That’s the law as well. Older law. Better one.', 'neutral'),
    say('odile', 'And as of this morning, the last courier on the rolls is…', 'neutral'),
    say('rookie', 'Me?', 'surprised'),
    say('odile', 'You, Senior Courier.', 'happy'),
  ]),
  {
    id: 'office-3',
    entry: [{ node: 'tin' }],
    nodes: {
      tin: {
        lines: [
          narrate('You touch the tin in your coat pocket. Your gran kept one letter in it for thirty years. It’s why you’re here.'),
          say('rookie', 'My gran had a letter that came late. She read it until the folds went soft.', 'neutral'),
          say('odile', 'Then you know what these are worth to somebody.', 'neutral'),
          say('odile', 'It’s five days to Kingsend if you go straight. Seven if you stop for people.', 'neutral'),
          say('odile', 'You’ll stop for people. You’ve got the face for it.', 'happy'),
        ],
        choices: [
          { text: 'I’ll take them.', next: 'eager', then: [{ set: 'intro.answer', to: 'eager' }] },
          { text: 'Seven days isn’t long.', next: 'worried', then: [{ set: 'intro.answer', to: 'worried' }] },
        ],
      },
      eager: { lines: [say('odile', 'Good. I was going to make you anyway.', 'happy')], next: 'coming' },
      worried: { lines: [say('odile', 'No. It never is. Best not stand about, then.', 'neutral')], next: 'coming' },
      coming: {
        lines: [
          say('odile', 'I’m coming with you. Somebody has to read the maps, and you look like you’d hold one upside down.', 'happy'),
          say('rookie', 'What about the office?', 'surprised'),
          say('odile', 'The office is closing. I’m not.', 'neutral'),
          narrate('Odile pulls a carpet bag from under the counter and drops the date stamp into it.'),
          say('odile', 'Biscuit! Up you get.', 'happy'),
          narrate('In the corner, the office goat looks up from a parcel string it has been eating since breakfast.'),
          say('odile', 'Biscuit comes too. Biscuit is also on the rolls. Don’t ask. It was a long winter.', 'neutral'),
        ],
      },
    },
  },
  simple(
    'office-4',
    [
      narrate('Odile turns the key twice, and then once more for luck.'),
      narrate('She rests her hand flat on the red door for a moment.'),
      say('odile', 'Forty years. Well.', 'sad'),
      say('odile', 'Keep warm.', 'neutral'),
    ],
    [{ set: DONE }, { join: 'odile' }, { set: 'biscuit.joined' }],
  ),

  // Doors, signs and things.
  simple('po-locked', [narrate('Odile locked it. Twice, and then once more for luck.')]),
  simple('leave-early', [say('rookie', 'Not yet. I’ve come all this way to apply for a job.')]),
  simple('door-bakery', [narrate('It smells of warm bread and something slightly burnt. Ned’s out the front.')]),
  simple('door-shop', [
    narrate('A sign on the door: CLOSED FOR STOCKTAKING.'),
    narrate('Underneath, smaller: SORRY. Underneath that, smaller still: STRING.'),
  ]),
  simple('door-inn', [narrate('The Thistle and Crown. Locked until the evening trade.')]),
  simple('door-mayor', [narrate('A brass plate reads MAYOR. Under it, a smaller plate reads PELL. Under that: PLEASE WIPE FEET.')]),
  simple('door-finch', [narrate('The curtains are open. Inside, a chair has been turned to face the road.')]),
  simple('door-house', [narrate('Nobody answers.')]),
  simple('noticeboard', [
    narrate('PUBLIC NOTICE. By decree of the Crown, the Royal Post shall close at sundown on the seventh day of this month.'),
    narrate('All mail in hand at closing is to be forwarded to the Dead Letter Office, Kingsend, for disposal.'),
    narrate('Someone has written underneath: SHAME. Someone else has written: SPELL IT RIGHT THEN.'),
    narrate('Nobody can work out what was spelled wrong.'),
  ]),
  simple('well', [narrate('A wishing well. Someone has thrown in a button.')]),

  // People.
  {
    id: 'ned',
    entry: [
      { if: { letter: 'L02', is: 'delivered' }, node: 'after' },
      { if: { flag: DONE }, node: 'offer' },
      { node: 'before' },
    ],
    nodes: {
      before: {
        lines: [
          say('ned', 'Morning! You’re new. Nobody’s new in Thistle Cross. We had a new cow in the spring and it was the talk of the place.'),
          say('ned', 'Post office? Red door. Tell Odile her loaf’s ready. Same loaf thirty years. I could bake it in my sleep. I have.'),
        ],
      },
      offer: {
        lines: [say('ned', 'Delivering, are you? Nobody’s sent me a letter in thirty years.'), say('ned', 'Bills, yes. I don’t count bills. Nobody counts bills. That’s the trouble with them.')],
        choices: deliveryChoices('L02', 'Final Demand', { sealed: 'sealed', opened: 'opened' }),
      },
      sealed: {
        lines: [
          narrate('Ned opens it, reads it, and goes very still.'),
          say('ned', 'Brackwater and Sons.'),
          say('ned', 'Brackwater and Sons went bust before I grew my first moustache. Old Brackwater ran off with the takings and a dancer from Millbridge.'),
          say('ned', 'Eleven shillings and fourpence! For flour!'),
          narrate('Ned laughs until he has to sit down on a sack of flour, and then he laughs some more.'),
          say('ned', 'I’m framing this. Here, take some loaves. On the house. On Brackwater.'),
        ],
      },
      opened: {
        lines: [
          say('ned', 'Seal’s broken. Somebody’s had a read of this.'),
          narrate('He reads it anyway, and the corner of his mouth starts to go.'),
          say('ned', 'Brackwater and Sons. They went bust thirty years ago. I suppose you know the joke already, then.'),
          say('ned', 'Still. It’s a good joke. Have a loaf.'),
        ],
      },
      after: { lines: [say('ned', 'I’ve put it up behind the counter. Customers ask if I ever paid. I tell them I’m thinking about it.')] },
    },
  },
  {
    id: 'mayor',
    entry: [
      { if: { letter: 'L03', is: 'delivered' }, node: 'after' },
      { if: { flag: DONE }, node: 'offer' },
      { node: 'before' },
    ],
    nodes: {
      before: {
        lines: [
          say('mayor', 'Look at this. LOOK at it. Someone has been at my hedge in the night.'),
          say('mayor', 'That was a peacock. Now it is a peacock with a moustache. Done with shears. Professional work.'),
          say('mayor', 'I have my suspicions. I have a list of suspicions.'),
        ],
      },
      offer: {
        lines: [say('mayor', 'Going round with letters, are you? Keep an eye out for anyone carrying shears.')],
        choices: deliveryChoices('L03', 'I Know What You Did to My Hedge', { sealed: 'sealed', opened: 'opened' }),
      },
      sealed: {
        lines: [
          narrate('The Mayor reads it twice. His moustache rises slowly, like a drawbridge.'),
          say('mayor', '“I know what you did to my hedge.” This was posted thirty years ago.'),
          say('mayor', 'I did do something to a hedge, thirty years ago. I trimmed it. It was in the way of my peacock.'),
          say('mayor', 'Which means the moustache last night was… Hester. It has to be Hester. She waited thirty years.'),
          say('mayor', 'That is magnificent. I’m going round there to apologise. For the hedge. Not for the peacock.'),
          say('mayor', 'And Mrs. Dray is my cousin. I’ll tell her to look after you.'),
        ],
      },
      opened: {
        lines: [
          say('mayor', 'This has been opened. A private letter, opened by the Post, in MY town.'),
          narrate('He reads it with his lips pressed tight. Then a little less tight.'),
          say('mayor', '…Well. I suppose you know what I did to the hedge, then. Everybody will by teatime.'),
          say('mayor', 'I’ll make my peace with Hester. And I’ll tell Mrs. Dray you’re a courier of flexible principles.'),
        ],
      },
      after: { lines: [say('mayor', 'Hester and I are on speaking terms again. Mostly we speak about the peacock.')] },
    },
  },
  {
    id: 'hester',
    entry: [
      { if: { letter: 'L03', is: 'delivered' }, node: 'after' },
      { if: { flag: DONE }, node: 'later' },
      { node: 'before' },
    ],
    nodes: {
      before: {
        lines: [
          say('hester', 'The Mayor’s out shouting at his hedge again.'),
          say('hester', 'It was a peacock. Now it’s a peacock with a moustache. Honestly, I think it’s an improvement.'),
        ],
      },
      later: { lines: [say('hester', 'If anyone asks, I was asleep. Very asleep. Ask my cat.')] },
      after: {
        lines: [
          say('hester', 'The Mayor came round and apologised. For the hedge. Thirty years late.'),
          say('hester', 'I didn’t know what to do with my face. So I made him a cup of tea. It’s the first time he’s been in my kitchen.'),
        ],
      },
    },
  },
  {
    id: 'finch',
    entry: [
      { if: { letter: 'L01', is: 'delivered' }, node: 'after' },
      { if: { flag: DONE }, node: 'offer' },
      { node: 'before' },
    ],
    nodes: {
      before: {
        lines: [
          say('finch', 'Are you from the post? No, you’ve not got the bag.'),
          say('finch', 'I watch the road in the mornings. Habit. My boy used to come up that way.'),
          say('finch', 'Never mind me, dear.'),
        ],
      },
      offer: {
        lines: [say('finch', 'That’s a post bag. You’re a courier.'), say('finch', 'If there’s ever anything for Finch… well. You’d bring it, wouldn’t you.')],
        choices: deliveryChoices('L01', 'Home by Harvest', { sealed: 'sealed', opened: 'opened' }),
      },
      sealed: {
        lines: [
          narrate('Mother Finch looks at the handwriting for a long time before she opens it.'),
          narrate('She reads it at the gate. Then she reads it again.'),
          say('finch', '“Home by harvest.” He always said that. Every time he went anywhere. Home by harvest, Mam.'),
          say('finch', 'He was never home by harvest once in his life. Always late. I’d leave the gate on the latch.'),
        ],
        next: 'quilt',
      },
      opened: {
        lines: [
          say('finch', 'It’s been opened.'),
          say('finch', 'Did you read it? …No. Don’t tell me. It doesn’t matter.'),
          narrate('She reads it at the gate, with her back to you.'),
          say('finch', 'He always said that. Home by harvest. He was never once on time.'),
        ],
        next: 'quilt',
      },
      quilt: {
        lines: [
          narrate('She folds the letter carefully along its old creases.'),
          say('finch', 'Wait there.'),
          narrate('She comes back with a quilt over her arm.'),
          say('finch', 'I made this for when he came home. You’re out on the roads. You have it.'),
          say('finch', 'And tell Gil Ashby you’re my guests. He owes me for the jam.'),
        ],
      },
      after: { lines: [say('finch', 'I’ve put it on the mantel, by his picture. I read it in the mornings. Habit.')] },
    },
  },
  {
    id: 'gil',
    entry: [
      { if: { flag: 'inn.free.thistle' }, node: 'free' },
      { if: { flag: DONE }, node: 'after' },
      { node: 'before' },
    ],
    nodes: {
      before: {
        lines: [
          say('gil', 'The Thistle and Crown opens at six. Three rooms, and two of them have windows.'),
          say('gil', 'Odile drinks here Fridays. Half of stout and the crossword, and nobody talks to her till it’s done.'),
        ],
      },
      after: { lines: [say('gil', 'Leaving with Odile? Then I suppose the crossword’s mine now. Seven across has been empty since Tuesday.')] },
      free: { lines: [say('gil', 'Mother Finch says you’re her guests. Then you’re mine as well. There’s always a bed here for you.')] },
    },
  },
  {
    id: 'dray',
    entry: [
      { if: { flag: 'shop.discount.thistle' }, node: 'discount' },
      { if: { flag: DONE }, node: 'after' },
      { node: 'before' },
    ],
    nodes: {
      before: { lines: [say('dray', 'Sundries. That’s everything that isn’t something else.'), say('dray', 'We’re shut for stocktaking. I’m counting the string. It’s going badly.')] },
      after: {
        lines: [
          say('dray', 'Off on the road? Mind the geese. They’ve no respect for the uniform.'),
          say('dray', 'Come back when I’ve finished the string and I’ll sell you a Repel Bell.'),
        ],
      },
      discount: { lines: [say('dray', 'My cousin the Mayor says I’m to look after you. When I open, you’ll pay what I pay. Don’t tell anyone.')] },
    },
  },
  beforeAfter(
    'wireman',
    DONE,
    [
      say('wireman', 'Mind the ladder. Ten more poles to Bellwether by Friday.'),
      say('wireman', 'Once she’s strung, you’ll send a message to Kingsend in a minute flat. No stamps. No waiting. No goat.'),
    ],
    [
      say('wireman', 'Couriers, is it? Not for long, friend. No offence.'),
      say('wireman', 'It’s progress. Progress doesn’t take offence. That’s what’s good about it.'),
    ],
  ),
  beforeAfter(
    'tib',
    DONE,
    [
      say('tib', 'Are you a courier? You’ve got a courier face.'),
      say('tib', 'When I’m big I’m going to deliver things. Fast things. Like news.'),
    ],
    [say('tib', 'You ARE a courier! I knew it. Is the goat a courier too?'), say('tib', '…Can I be the goat?')],
  ),

  // Thistle Road.
  simple('goose-appears', [narrate('A goose steps out of the hedge and looks at you as if you owe it money.')]),
  simple('hogs-appear', [narrate('Two hogs come crashing out of the brambles, wearing most of them.')]),
  simple('brigand-appears', [
    say('brigand', 'Hold it there. Your money or your letters.'),
    say('rookie', 'The letters aren’t mine to give.', 'neutral'),
    say('brigand', 'Then I’ll take the money. And the goose takes whatever it likes. It’s that sort of goose.'),
  ]),
  simple(
    'road-start',
    [
      say('odile', 'That’s the Thistle Road. Bellwether Fen’s at the far end. A day’s walk, if the geese let us.', 'neutral'),
    ],
    [{ set: 'road.seen' }],
  ),
  simple('tollgate', [
    narrate('The toll gate is down. A sign hangs on it: BACK SOON. — F.H.'),
    narrate('Under that, an older sign: BACK SOON. Under that, older still: BACK SOON.'),
  ]),
];
