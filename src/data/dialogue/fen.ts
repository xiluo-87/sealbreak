/** Bellwether Fen and the Fen Road: Grist, Juniper, and letters L04 to L07. */
import type { Dialogue } from '../../game/dialogue';
import { beforeAfter, deliveryChoices, narrate, say, simple } from './helpers';

export const FEN_DIALOGUE: Dialogue[] = [
  simple('no-going-back', [narrate('The way back is behind you now. The Post won’t wait; there’s only forward.')]),
  simple('fen-road-start', [
    say('fenn', 'Fen Road. Mind your feet. The boards are older than me and in worse shape.', 'neutral'),
    say('odile', 'Bellwether Fen’s on stilts. They say the eels have the vote.', 'happy'),
  ], [{ set: 'fen.roadSeen' }]),
  simple('fen-not-yet', [say('fenn', 'The bailiff’s men are on the east boards. We’re not getting past without dealing with Grist.', 'neutral')]),

  // Arrival.
  {
    id: 'fen-arrive-1',
    entry: [{ node: 'n' }],
    nodes: {
      n: {
        lines: [
          narrate('A man in a black gown and a tall hat is waiting at the end of the boardwalk, as if he had been told you were coming.'),
          say('grist', 'Halt. Bailiff Grist, Bellwether Fen. You are carrying a sack.'),
          say('rookie', 'It’s the Royal Post.', 'neutral'),
          say('grist', 'It is a sack. Sacks are freight. Freight on the public boards is subject to boardage. Boardage is twelve coin.'),
          say('odile', 'There’s no such thing as boardage, Mr. Grist.', 'angry'),
          say('grist', 'There is now. Fined. Report to my office to settle it, and we’ll discuss the contents of that sack.'),
          narrate('He strides off along the boards, his gown dragging in the water.'),
          say('fenn', 'That man fines puddles.', 'neutral'),
        ],
        then: [{ set: 'fen.arrived' }],
      },
    },
  },
  simple('fen-notice', [
    narrate('NOTICE TO ALL CONSTABLES AND OFFICERS OF THE CROWN.'),
    narrate('The Postal Inspectorate seeks a sack of undelivered mail, believed to be travelling east toward the capital. Persons carrying it are to be detained.'),
    narrate('By order of C. Vane, Chief Inspector.'),
    narrate('Someone has pinned a second notice beside it: FINED FOR READING THE NOTICE. — G.'),
  ], [{ set: 'notice.read' }]),
  {
    id: 'constable',
    entry: [{ if: { flag: 'grist.beaten' }, node: 'after' }, { node: 'before' }],
    nodes: {
      before: { lines: [say('constable', 'Don’t look at me. I just hold the keys. Mr. Grist holds everything else.'), say('constable', 'Including my wages, which he fined.')] },
      after: { lines: [say('constable', 'First time in eleven years nobody’s been fined before lunch. I could get used to this.')] },
    },
  },
  {
    id: 'eelman',
    entry: [{ node: 'n' }],
    nodes: {
      n: {
        lines: [
          say('eelman', 'Eels? No eels today. Fined for having too many eels yesterday.'),
          say('eelman', 'You know what an eel does when it’s fined? Nor do I. I’ve never seen one pay.'),
        ],
      },
    },
  },
  beforeAfter(
    'fenkid',
    'grist.beaten',
    [say('fenkid', 'Are you couriers? Real ones? Is the bailiff going to fine you? He fined my dog.')],
    [say('fenkid', 'You beat the bailiff! My dog says thank you. He can’t write.')],
  ),
  {
    id: 'fen-trader',
    entry: [{ node: 'n' }],
    nodes: {
      n: {
        lines: [say('trader', 'Eel market’s open. Well, the eel market’s a table. But it’s open.')],
        choices: [
          { text: 'Buy something', then: [{ open: 'shop', id: 'fen' }] },
          { text: 'Not now' },
        ],
      },
    },
  },
  simple('door-bea', [narrate('Nets hang drying under the eaves. There’s a smell of tar and smoke and eel.')]),

  // Juniper.
  {
    id: 'lockup-window',
    entry: [{ if: { flag: 'juniper.met' }, node: 'again' }, { node: 'first' }],
    nodes: {
      first: {
        lines: [
          narrate('A face appears at the barred window: short dark hair with a blue streak in it, and a jeweller’s loupe pushed up on the forehead.'),
          say('juniper', 'Oh, visitors. Lovely. Are you here to fine me? Get in line, he’s already done it twice today.', 'happy'),
          say('juniper', 'Juniper Quill. I’m in for forgery. Allegedly. I allegedly wrote out a release for Harl the eelman, who was in here for owing Grist a fine for owing Grist a fine.', 'neutral'),
          say('juniper', 'It was a beautiful release. Better than Grist’s real signature. That was the trouble, really.', 'happy'),
          say('rookie', 'Is that a sack of letters you’re looking at?', 'surprised'),
          say('juniper', 'It’s a sack of very old paper. I can smell the sealing wax from here.', 'surprised'),
          say('juniper', 'Get me out of this box and I’ll make it worth your while. There’s nothing with a seal on it I can’t put back the way it was.', 'neutral'),
        ],
        then: [{ set: 'juniper.met' }],
      },
      again: { lines: [say('juniper', 'Still here. Grist has the keys. Grist has everyone’s keys. Go and have a word, would you?', 'neutral')] },
    },
  },
  beforeAfter('lockup-door', 'grist.beaten', [narrate('Locked. A brass plate says: FINE FOR KNOCKING.')], [narrate('The lock-up stands open. The brass plate has been taken down and used to prop the door.')]),
  beforeAfter('office-door', 'grist.beaten', [narrate('BAILIFF’S OFFICE. FINES PAYABLE WITHIN. FINES ALSO PAYABLE WITHOUT.')], [narrate('The office is empty. A ledger of fines lies open on the desk. Someone has written PAID across every page.')]),
  {
    id: 'grist',
    entry: [{ node: 'n' }],
    nodes: {
      n: {
        lines: [
          say('grist', 'Ah. The freight. Twelve coin boardage, three coin for loitering, and the sack itself, which I am impounding pending inspection.'),
          say('grist', 'The Inspectorate pays well for that sack, I’m told. Very well.'),
          say('fenn', 'The Post is the Crown’s. You can’t fine the Crown.', 'angry'),
          say('grist', 'Watch me. Fined for insolence.'),
        ],
        choices: [
          { text: 'Pay the boardage', if: { coinAtLeast: 12 }, next: 'pay' },
          { text: 'Refuse', next: 'refuse' },
        ],
      },
      pay: {
        lines: [narrate('You count out twelve coin. Grist pockets it, and holds out his hand again, for the sack.'), say('grist', 'And the sack.'), say('odile', 'No.', 'angry'), say('grist', 'Fined.')],
        then: [{ coin: -12 }],
        next: 'fight',
      },
      refuse: { lines: [say('grist', 'Then I shall collect in person.')], next: 'fight' },
      fight: {
        lines: [narrate('Grist rolls up his sleeves, raises his gavel and advances along the boards.')],
        then: [{ fight: 'grist', after: 'grist-won' }],
      },
    },
  },
  {
    id: 'grist-won',
    entry: [{ node: 'won' }],
    nodes: {
      won: {
        lines: [
          narrate('Grist sits down heavily on the boards. His hat floats gently away down the channel.'),
          say('grist', 'This is… this is highly irregular.'),
          say('constable', 'I’ll take those, Mr. Grist.'),
          narrate('The constable unhooks the keys from Grist’s belt and walks straight to the lock-up.'),
        ],
        then: [{ set: 'grist.beaten' }],
        next: 'juniper',
      },
      juniper: {
        lines: [
          narrate('Juniper strolls out of the lock-up, stretching, and looks at you as if she has been expecting you all morning.'),
          say('juniper', 'That was very good. A bit loud. I’d have used a forged eviction notice, but there’s a time and a place.', 'happy'),
          say('juniper', 'So. Old letters, a deadline, and a bailiff in the water. Where are you going?', 'neutral'),
          say('rookie', 'Kingsend. Everyone in the sack gets their letter.', 'neutral'),
          say('juniper', 'Then you need someone who can open a seal and close it again so nobody knows. I have three sticks of wax and no shame.', 'happy'),
          narrate('Juniper joins the party.'),
          say('odile', 'Welcome aboard, Miss Quill.', 'neutral'),
          say('juniper', 'Juniper. And don’t call it aboard. We’re on stilts.', 'happy'),
        ],
        then: [{ join: 'juniper' }, { set: 'juniper.joined' }],
      },
    },
  },
  simple('grist-after', [say('grist', 'I shall be writing to the Inspectorate about this.'), say('juniper', 'Want me to write it for you? I do a lovely Grist.', 'happy')]),

  // L04: Bea Rusk.
  {
    id: 'bea',
    entry: [{ if: { letter: 'L04', is: 'delivered' }, node: 'after' }, { node: 'offer' }],
    nodes: {
      offer: {
        lines: [say('bea', 'If you’re after eels, you’re late. If you’re after the bailiff, you’re welcome to him.'), say('bea', 'Post, is it? There’s nobody left to write to me.')],
        choices: deliveryChoices('L04', 'To My Sister, Who Stayed', { sealed: 'sealed', opened: 'opened', resealed: 'resealed' }),
      },
      sealed: {
        lines: [
          narrate('Bea looks at the name on the front and goes very still.'),
          say('bea', 'Ivo.'),
          narrate('She reads it standing up, in the wind, without moving.'),
          say('bea', '“Nine times.” He started everything nine times. Couldn’t tie a knot on the first go.'),
          say('bea', 'He went off in a hat and I stayed with the punts. I said things at the jetty I’ve been taking back ever since.'),
          say('bea', 'Well. He’s said his piece. I suppose I can stop arguing with him in my head now.'),
        ],
        next: 'punt',
      },
      opened: {
        lines: [
          say('bea', 'Somebody’s had their thumbs in this.'),
          narrate('She reads it anyway, and her face doesn’t change, and then it does.'),
          say('bea', 'Don’t tell me you read it. I don’t want to know who else has seen him say sorry.'),
        ],
        next: 'punt',
      },
      resealed: {
        lines: [
          narrate('Bea turns the letter over and frowns at the seal.'),
          say('bea', 'Ivo always sealed on the left. Left-handed, the great lump.'),
          narrate('She looks at you, and you look at the eels, and after a moment she lets it go and opens it.'),
          say('bea', '“Nine times.” That’s him all right.'),
        ],
        next: 'punt',
      },
      punt: {
        lines: [
          say('bea', 'You’re going on, east? Take the punt. Through the channels you’ll miss half the trouble on the roads round here.'),
          say('bea', 'Bring it back if you’re passing. You won’t be. Keep it.'),
        ],
        then: [{ deliver: 'L04' }],
      },
      after: { lines: [say('bea', 'I went down to the jetty this morning. Stood about for a bit. Daft. Felt better.')] },
    },
  },

  // L05: Sal Pottle, and the inn.
  {
    id: 'sal',
    entry: [{ if: { letter: 'L05', is: 'delivered' }, node: 'after' }, { node: 'offer' }],
    nodes: {
      offer: {
        lines: [say('sal', 'Welcome to the Drowned Lantern! It’s not drowned. We just liked the name.'), say('sal', 'Beds upstairs, stew downstairs, and nobody here’s been fined since breakfast.')],
        choices: [
          { text: 'Take a room', then: [{ open: 'inn', id: 'fen' }] },
          ...deliveryChoices('L05', 'Recipe, As Promised', { sealed: 'sealed', opened: 'opened' }).slice(0, 3),
          { text: 'Not now' },
        ],
      },
      sealed: {
        lines: [
          say('sal', 'That’s Aunt Dorrit’s writing! She promised me the eel pie. She promised me in the year of the floods.'),
          narrate('Sal reads it, and laughs, and reads it again, and laughs harder.'),
          say('sal', '“Don’t go showing your mother.” Oh, she’s left something out. Of course she has. That’s the point, she says.'),
          say('sal', 'Right. Pie for everyone who stays here, from now on. Tell the whole road.'),
        ],
        then: [{ deliver: 'L05' }],
      },
      opened: {
        lines: [
          say('sal', 'Oh, it’s been opened. Did you try it? Did you make the pie? You didn’t, did you. Nobody can, without the bit she left out.'),
          narrate('Sal reads it anyway, mouthing the ingredients.'),
          say('sal', 'Still. It’s her. Thank you for bringing it.'),
        ],
        then: [{ deliver: 'L05' }],
      },
      after: {
        lines: [say('sal', 'Pie’s on! I’ve made eleven. Nine were wrong. Two were right, and I don’t know why.')],
        choices: [
          { text: 'Take a room', then: [{ open: 'inn', id: 'fen' }] },
          { text: 'Not now' },
        ],
      },
    },
  },

  // L07: Elsie Corran.
  {
    id: 'elsie',
    entry: [{ if: { letter: 'L07', is: 'delivered' }, node: 'after' }, { node: 'offer' }],
    nodes: {
      offer: {
        lines: [say('elsie', 'You’ll forgive me if I don’t ask you in. Arthur’s asleep in the chair and he wakes up talking about pigs.')],
        choices: deliveryChoices('L07', 'All My Love, Always', { sealed: 'sealed', opened: 'opened', resealed: 'resealed' }),
      },
      sealed: {
        lines: [
          narrate('Elsie sees the name on the back of the envelope and puts a hand on the doorframe.'),
          say('elsie', 'Rafe.'),
          narrate('She reads it on the step. When she’s done she folds it very small.'),
          say('elsie', 'He did used to argue about the washing up. Every evening. I think he liked losing.'),
          say('elsie', 'I married again, you know. Twenty years ago. Arthur’s a good man. He snores like a pump.'),
          say('elsie', 'I’ll keep it all the same. A person can be grateful for two things.'),
        ],
        next: 'ring',
      },
      opened: {
        lines: [
          say('elsie', 'The seal’s gone.'),
          narrate('She holds it a moment, deciding something.'),
          say('elsie', 'I don’t mind who’s read it. It’s not as if it was ever just mine. Half the Fen knew how he felt about me. He told the eels.'),
          narrate('She reads it on the step and smiles at the part about the lark.'),
        ],
        next: 'ring',
      },
      resealed: {
        lines: [
          narrate('Elsie reads it on the step, and smiles at the part about the lark.'),
          say('elsie', 'He did used to argue about the washing up. I married again, you know. I’ll keep this all the same.'),
        ],
        next: 'ring',
      },
      ring: {
        lines: [
          narrate('She twists something off her right hand: a thin gold band, worn flat on one side.'),
          say('elsie', 'He gave me this. I wear Arthur’s on the left now. This one should go somewhere it’ll be useful.'),
        ],
        then: [{ deliver: 'L07' }],
      },
      after: { lines: [say('elsie', 'Arthur asked what I was smiling at. I said pigs. He was delighted.')] },
    },
  },

  // L06: Hob Tanner, met on the Fen Road.
  {
    id: 'recipient-L06',
    entry: [
      { if: { letter: 'L06', is: 'opened' }, node: 'opened' },
      { node: 'sealed' },
    ],
    nodes: {
      sealed: {
        lines: [
          narrate('The bandit chief takes the letter as if it might bite, and reads it with his lips moving.'),
          say('hob', '“The reeds know where you put it.”'),
          say('hob', 'Forty years. Forty years she’s been coming up this road, in my head. Every night I’ve heard her.'),
          say('hob', 'She was right. Half of it was hers. I was going to give it back. I was going to give it back for forty years.'),
          say('hob', 'Lads, we’re finished on this road. Dig it up and give it to these people. They’ll know what to do with it better than I did.'),
        ],
        then: [{ deliver: 'L06' }, { set: 'hob.met' }],
      },
      opened: {
        lines: [
          say('hob', 'This is open. You’ve read it, then. You know what I did.'),
          narrate('He reads it anyway. He sits down in the reeds.'),
          say('hob', 'I’m done. Take the stash. Take the road. I’m going home, if anyone’s left there.'),
        ],
        then: [{ deliver: 'L06' }, { set: 'hob.met' }],
      },
    },
  },
];
