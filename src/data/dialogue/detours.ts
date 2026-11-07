/** The detours: Mirrow Abbey, the Old Front and Gull's Rest, and letters L19 to L24. */
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

export const DETOUR_DIALOGUE: Dialogue[] = [
  // Mirrow Abbey.
  simple('abbey-arrive', [
    narrate('The path climbs through beech woods to a grey abbey with a bell that rings the hours whether anyone is listening or not.'),
    say('juniper', 'Libraries. Old ones. I can smell the vellum from here.', 'happy'),
  ], [{ set: 'abbey.seen' }]),
  simple('abbey-church', [narrate('Inside, the church is cool and plain. Someone has left a jam jar of wildflowers on the altar step, and someone else has left a hymn book open at the wrong hymn.')]),
  simple('novice', [say('novice', 'We’re not supposed to talk during the hours. This isn’t one of the hours. I checked.'), say('novice', 'Sister Anselm says grace for two at every meal. Nobody asks who the second one is for.')]),
  {
    id: 'anselm',
    entry: [{ if: { letter: 'L19', is: 'delivered' }, node: 'after' }, { node: 'offer' }],
    nodes: {
      offer: {
        lines: [say('anselm', 'Welcome to Mirrow. We don’t get many visitors who aren’t lost. Are you lost? You may be lost if you like.')],
        choices: deliveryChoices('L19', 'I Still Say Grace', { sealed: 'sealed', opened: 'opened', resealed: 'sealed' }),
      },
      sealed: {
        lines: [
          narrate('Sister Anselm reads it in the cloister, and laughs out loud, which echoes, and a passing brother looks scandalised.'),
          say('anselm', 'Luc. My little brother. He never once said grace in his life. He used to start eating while I was still on “for what we are about”.'),
          say('anselm', '“I still say grace.” At the Front. Oh, he’d have hated me knowing that.'),
        ],
        choices: truthOrSilence('L19', 'silence', 'truth', 'bless'),
      },
      opened: {
        lines: [
          say('anselm', 'Opened. Well, God reads everything anyway. I don’t see why couriers shouldn’t.'),
          narrate('She reads it, and smiles at something in the middle.'),
          say('anselm', 'Luc said grace. Luc! Wonders never cease, which is rather the point of us.'),
        ],
        choices: truthOrSilence('L19', 'silence', 'truth', 'bless'),
      },
      silence: { lines: [say('anselm', 'I’ve said grace for two since the war. I always thought the second one was for him. Now I know he was saying it back.')], next: 'bless' },
      truth: {
        lines: [
          say('rookie', 'It wasn’t Luc who wrote it. It was someone who knew how badly you’d want him to have.', 'sad'),
          narrate('Sister Anselm is quiet for a while.'),
          say('anselm', 'Then someone said grace for him. That’s not nothing. That’s rather a lot.'),
        ],
        next: 'bless',
      },
      bless: {
        lines: [say('anselm', 'You’ll take the abbey’s blessing with you. It isn’t much, but you’ll sleep better for it. Everyone does.')],
        then: [{ deliver: 'L19' }],
      },
      after: { lines: [say('anselm', 'I say grace for two still. I just say it smiling now.')] },
    },
  },
  {
    id: 'librarian',
    entry: [{ if: { letter: 'L20', is: 'delivered' }, node: 'after' }, { node: 'offer' }],
    nodes: {
      offer: {
        lines: [say('librarian', 'Brother Tolliver, librarian. The library is closed to visitors. The library has been closed to visitors since a visitor borrowed a book and never brought it back.')],
        choices: deliveryChoices('L20', 'Returned Library Book (Very Overdue)', { sealed: 'sealed', opened: 'opened' }),
      },
      sealed: {
        lines: [
          narrate('Brother Tolliver opens the parcel with trembling hands. Inside is a small brown book and a note.'),
          say('librarian', '“I have been at the war, which is a poor excuse, but it is the one I have.” Signed, H. Tolliver. My uncle Hal!'),
          say('librarian', 'The fine. The fine is… let me see… no, I can’t charge a dead man. I can frame it, though.'),
          say('librarian', 'For this, you may have the run of the archive. Everything. Even the records we pretend we don’t keep.'),
        ],
        then: [{ deliver: 'L20' }],
      },
      opened: {
        lines: [
          say('librarian', 'Opened, but it’s only a library book. The most important thing about it is that it’s back.'),
          narrate('He holds the book to his chest like a cat.'),
          say('librarian', 'You may have the run of the archive. Go on. Mind the ladder.'),
        ],
        then: [{ deliver: 'L20' }],
      },
      after: { lines: [say('librarian', 'I’ve framed the fine. It’s the most valuable thing in the library now, apart from the books, and the ladder.')] },
    },
  },
  beforeAfter(
    'archive',
    'archive.access',
    [narrate('A sign on the library door: ARCHIVE BY APPOINTMENT. Underneath, smaller: THERE ARE NO APPOINTMENTS.')],
    [
      narrate('The archive smells of dust and candle wax. Brother Tolliver has left a box out for you, labelled FIELD POST: PERSONNEL.'),
      narrate('MARSH, Odile. Postmistress, Field Post Office No. 2, attached to the Fourth Army, from the first winter to the armistice.'),
      narrate('Commended for the morale of families at home.'),
      narrate('In the margin, in a clerk’s pencil: Query: outgoing mail from F.P.O. 2 exceeds incoming by a wide margin. Not pursued.'),
      say('odile', 'That was a long time ago.', 'neutral'),
    ],
  ),
  {
    id: 'crypt-door',
    entry: [{ if: { flag: 'crypt.won' }, node: 'after' }, { node: 'n' }],
    nodes: {
      n: {
        lines: [narrate('Steps go down into the dark. Something pale moves at the bottom of them, and then another something.')],
        choices: [
          { text: 'Go down', then: [{ fight: 'crypt', after: 'crypt-won' }] },
          { text: 'Leave the dead in peace' },
        ],
      },
      after: { lines: [narrate('The crypt is quiet now. The little lights are gone.')] },
    },
  },
  simple('crypt-won', [
    narrate('The wisps flicker out one by one, as if someone had finally said what they were waiting to hear.'),
    narrate('In a niche at the back there is an old field-dressing tin with smelling salts in it, and a few coins in an offering bowl, which Fenn insists you leave.'),
  ], [{ item: 'salts', n: 2 }]),

  // The Old Front.
  simple('front-arrive', [
    narrate('The Old Front is green now. The trenches have softened into ditches full of wildflowers, and the wire has rusted into the hedges.'),
    narrate('Every so often there is a wooden marker with a number on it.'),
  ], [{ set: 'front.seen' }]),
  {
    id: 'moss',
    entry: [{ if: { letter: 'L22', is: 'delivered' }, node: 'after' }, { if: { inParty: 'fenn' }, node: 'fenn' }, { node: 'offer' }],
    nodes: {
      fenn: {
        lines: [
          narrate('An old man with a beard like a bird’s nest comes out of the hut with a shotgun, sees Fenn, and lowers it.'),
          say('moss', 'Harrow? Harrow! You great lump! You ran!'),
          say('fenn', 'I did.', 'sad'),
          say('moss', 'Good! Somebody had to! I didn’t, and look at me. I live in a ditch.', 'neutral'),
          say('fenn', 'You’re on the memorial at Copperhill, Moss.', 'neutral'),
          say('moss', 'I know. I go and look at it sometimes. It’s nicely done.'),
        ],
        next: 'offer',
      },
      offer: {
        lines: [say('moss', 'Private Moss. Retired. Very retired. I stayed to keep an eye on the place. Somebody ought to.')],
        choices: deliveryChoices('L22', 'You Still Owe Me Two Shillings', { sealed: 'sealed', opened: 'opened' }),
      },
      sealed: {
        lines: [
          narrate('Moss reads it, and snorts, and reads it again, and his eyes go wet.'),
          say('moss', 'Hale. Hale and his two shillings. “Three queens in one hand is a lot of queens.” It was. One of them was up my sleeve.'),
          say('moss', '“If I don’t get out, pay it to my mum.” I went round, after. She wouldn’t take it. Said she had socks.'),
          say('moss', 'I’ll buy him a pint with them. Two pints. Here, take my map. I’ve walked every road in this country looking for the lads’ families. It’s got everyone on it.'),
        ],
        then: [{ deliver: 'L22' }],
      },
      opened: {
        lines: [
          say('moss', 'Opened? Doesn’t matter. Hale never sealed anything properly anyway.'),
          narrate('He reads it and laughs until he coughs.'),
          say('moss', 'Two shillings. I’ll drink them for him. Take my map, it’ll do you more good than me.'),
        ],
        then: [{ deliver: 'L22' }],
      },
      after: { lines: [say('moss', 'Two pints, one for Hale, one for me. I drank both. He’d have understood.')] },
    },
  },
  {
    id: 'squad-marker',
    entry: [{ if: { letter: 'L21', is: 'delivered' }, node: 'after' }, { node: 'offer' }],
    nodes: {
      offer: {
        lines: [narrate('A weathered post at the end of a trench line. Someone has carved into it, long ago: SQUAD SEVEN. And underneath, more recently: STILL HERE.')],
        choices: [
          ...deliveryChoices('L21', 'To Whoever Finds Us', { sealed: 'read', opened: 'read' }).slice(0, 3),
          { text: 'Go down into the trench', if: { notFlag: 'trench.won' }, then: [{ fight: 'trench', after: 'trench-won' }] },
          { text: 'Not yet' },
        ],
      },
      read: {
        lines: [
          narrate('The letter is addressed to whoever finds it. You have found it. You read it aloud, at the post, to nobody.'),
          narrate('It is a roll call. Every member of Squad Seven, one after another, and after each name, in a different hand: present.'),
          narrate('The last line is pressed hard into the paper: Tell them we were a good squad.'),
        ],
        next: 'fenn',
      },
      fenn: {
        lines: [
          say('fenn', 'Harrow.', 'sad'),
          narrate('Nobody says anything.'),
          say('fenn', 'Present.', 'neutral'),
        ],
        then: [{ deliver: 'L21' }],
      },
      after: { lines: [narrate('The post at the end of the trench line has a new line carved under the others, in a big careful hand: HARROW. PRESENT.')] },
    },
  },
  simple('trench-won', [narrate('When the dust settles, the trench is just a ditch again, full of flowers.')], [{ coin: 30 }]),

  // Gull's Rest.
  simple('gulls-arrive', [
    narrate('The cliff path climbs over the sea. At the top, on its own headland, the lighthouse stands white and red against the sky, with the keeper’s cottage tucked behind it out of the wind.'),
    say('odile', 'There are three hundred and twelve steps up to that light. I’ve heard it said, anyway.', 'neutral'),
  ], [{ set: 'gulls.seen' }]),
  {
    id: 'stairs',
    entry: [{ node: 'n' }],
    nodes: {
      n: {
        lines: [narrate('Halfway up the stairs, the gulls notice you. A great many gulls. One of them is eyeing your satchel, and a crab has come up the cliff to see what happens.')],
        choices: [
          { text: 'Fight them off', then: [{ fight: 'stairs', after: 'stairs-won' }] },
          { text: 'Run for the top', then: [{ set: 'stairs.dodged' }], next: 'run' },
        ],
      },
      run: { lines: [narrate('You make it to the top with your hat, your dignity and most of your buttons.')] },
    },
  },
  simple('stairs-won', [narrate('The gulls retreat to a respectful distance, which for gulls is about a yard.')], [{ item: 'pie', n: 1 }]),
  {
    id: 'ines',
    entry: [{ if: { letter: 'L23', is: 'delivered' }, node: 'after' }, { node: 'offer' }],
    nodes: {
      offer: {
        lines: [say('ines', 'Ines Dove, keeper. You climbed all those stairs? Then you’ve earned tea. Nobody climbs them for nothing.')],
        choices: deliveryChoices('L23', 'Keep the Light On', { sealed: 'sealed', opened: 'opened', resealed: 'sealed' }),
      },
      sealed: {
        lines: [
          narrate('Ines reads it at the top of the stairs, with the wind in her hair, and then looks out to sea.'),
          say('ines', 'Tomas. “Cursing the wick.” I do curse the wick. I’ve cursed it every night for forty years.'),
          say('ines', 'His ship never came in. I kept the light on anyway. You don’t stop, in this job.'),
        ],
        choices: truthOrSilence('L23', 'silence', 'truth', 'charts'),
      },
      opened: {
        lines: [say('ines', 'Opened. The sea air gets into everything; maybe it got into this.'), narrate('She reads it, and looks out to sea for a long time.'), say('ines', 'I kept the light on. You don’t stop, in this job.')],
        choices: truthOrSilence('L23', 'silence', 'truth', 'charts'),
      },
      silence: { lines: [say('ines', 'He said he’d come in by it. Well. It’s still on.')], next: 'charts' },
      truth: {
        lines: [
          say('rookie', 'Tomas didn’t write it. Someone wrote it for him, because he never could.', 'sad'),
          narrate('Ines looks at Odile for a long moment, and Odile doesn’t look away.'),
          say('ines', 'Forty years I’ve read that by the lamp. You could have let me keep it.'),
          say('ines', 'I’ll keep the light on. Not for whoever wrote that.'),
        ],
        next: 'charts',
      },
      charts: {
        lines: [say('ines', 'Take my sea charts. You’re going on to Kingsend? The coast road’s quieter if you know where the old wrecks are, and I know all of them.')],
        then: [{ deliver: 'L23' }],
      },
      after: { lines: [say('ines', 'Light’s on. It’s always on. Mind the stairs on the way down; the gulls remember faces.')] },
    },
  },
  {
    id: 'barnaby',
    entry: [{ if: { letter: 'L24', is: 'delivered' }, node: 'after' }, { node: 'offer' }],
    nodes: {
      offer: {
        lines: [say('barnaby', 'Barnaby Lisk, assistant keeper. Well, assistant to the keeper. Well, I carry things. I’ve carried things up these stairs for forty years.')],
        choices: deliveryChoices('L24', 'I Am Not Dead', { sealed: 'sealed', opened: 'opened', resealed: 'resealed' }),
      },
      resealed: {
        lines: [say('barnaby', 'That’s not my seal. I pressed a coat button into mine. …Never mind. It’s still my letter.')],
        next: 'sealed',
      },
      sealed: {
        lines: [
          narrate('Barnaby looks at the envelope and goes white, then red, then white again.'),
          say('barnaby', 'That’s my writing. That’s my letter. To my mum. “I am not dead.”'),
          say('barnaby', 'They’d put me on a list, you see. Missing. I wrote to say I wasn’t, and I never heard back, and I thought, well, they’ve had the funeral, they’ve moved on, it’d only be awkward.'),
          say('barnaby', 'It never got there. Forty years. They never got it.'),
          narrate('He sits down on the top step.'),
          say('barnaby', 'I’m going home. Today. Right now. Will you walk me down? I don’t think my legs know the way.'),
        ],
        next: 'walk',
      },
      opened: {
        lines: [
          say('barnaby', 'That’s my letter. Opened? Well, I suppose I know what it says. “I am not dead.” Still true.'),
          say('barnaby', 'It never got there. I never wrote again. I’m going home, right now. Walk me down?'),
        ],
        next: 'walk',
      },
      walk: {
        lines: [
          narrate('Barnaby walks down all three hundred and twelve steps with you, talking the whole way, mostly about his mother’s cooking and a dog he had as a boy.'),
          narrate('At the bottom he shakes everyone’s hand twice, and gives you something wrapped in a cloth.'),
          say('barnaby', 'Spare lens from the light. Ines won’t miss it. She will. Tell her I said sorry. I’ll write.'),
        ],
        then: [{ deliver: 'L24' }],
      },
      after: { lines: [narrate('Barnaby’s chair by the lamp room door is empty. Ines has put a note on it: GONE HOME. ABOUT TIME.')] },
    },
  },
];
