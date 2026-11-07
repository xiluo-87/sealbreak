/**
 * Ending text (design 12): each ending's pages, an epilogue for every
 * recipient reached and every party member, the Queen's audience, and the
 * credits. Built from the game state so choices show.
 */
import { ENDING_NAMES, type EndingId, undelivered } from '../game/endings';
import type { GameState } from '../game/state';
import { LETTER_BY_ID, type LetterDef } from './letters';

export interface EndingPage {
  title?: string;
  lines: string[];
  /** A letter to show in the reader on this page. */
  letter?: Pick<LetterDef, 'title' | 'from' | 'to' | 'style' | 'postmark' | 'body' | 'signature' | 'hand'>;
  /** Credits laid out as a parcel-tracking sheet. */
  tracking?: [string, string, string][];
}

const RECIPIENTS: Record<string, string | ((s: GameState) => string)> = {
  L01: 'Mother Finch still leaves the gate on the latch, out of habit. The quilt went with someone who needed it more.',
  L02: 'Ned Cobb keeps a framed bill behind the bakery counter. Customers ask if he ever paid. He tells them he’s thinking about it.',
  L03: 'The hedge feud of Thistle Cross is over. Nobody admits to starting it. The topiary peacock grows its moustache back.',
  L04: 'Bea Rusk goes down to the jetty in the mornings now, for no reason she will admit to.',
  L05: 'The Drowned Lantern’s eel pie becomes famous all along the Fen. Nobody else can make it the same. Sal says that’s the point.',
  L06: 'Hob Tanner goes home. The reeds keep the rest of their secrets.',
  L07: 'Elsie Corran keeps one letter in her apron pocket and one husband in the chair, and is grateful for both.',
  L08: 'Every miner in Copperhill applies for his wages in writing. Ashworth reads all four hundred applications. They are paid in coin.',
  L09: 'The forge in Copperhill is lit every morning, and the whole street hears it.',
  L10: 'Foreman Hask runs the Wire into Kingsend along the old mine road, and stops his crew for lunch whenever anyone in a post coat goes by.',
  L11: 'Widow Tarn reads her letter every evening. Someone took the trouble, she tells people. That’s what she keeps.',
  L12: 'Captain Joss Wick goes home to Ada, a leaking roof, and a goat who eats the washing. For once in his life, he is on time.',
  L13: 'The armistice clauses hang on the harbour wall at the Salt Road, forty years late and exactly on time.',
  L14: (s) =>
    s.flags['truth.L14'] === 'truth'
      ? 'Mara Vell-Quay keeps her letter on the shelf. Someone on the other side thought her worth a kind lie, she says. She is still deciding whether that is better or worse.'
      : 'Mara Vell-Quay keeps her letter on the shelf with a cup in front of it, always full.',
  L15: 'Brin Pike never paints the boat blue. It steers left. She leans right.',
  L16: 'Mr. Ogilvy’s complaints hang together in the corridor at Post Headquarters, with a gap where the fourth should be. Someone writes a seventh, as a joke, and posts it.',
  L17: 'The Queen keeps Pip’s drawing on her mantelpiece, between two Old Masters who have been moved to make room.',
  L18: 'Cressida Vane keeps her father’s letter in her breast pocket, where the regulations say her warrant card should go.',
  L19: 'Sister Anselm still says grace for two at every meal, and now she says it smiling.',
  L20: 'The abbey library has its book back, forty years overdue. The fine is waived, then reinstated, then framed.',
  L21: 'Squad Seven’s names are read aloud at the Old Front every year. Someone always answers for each of them.',
  L22: 'Private Moss pays his two shillings at last, on a pint for an old friend who never turns up.',
  L23: (s) =>
    s.flags['truth.L23'] === 'truth'
      ? 'Ines Dove knows who really wrote her letter. She keeps it in a drawer she doesn’t open, and keeps the light on anyway.'
      : 'Ines Dove keeps the light on at Gull’s Rest, every night, however long it takes.',
  L24: 'Barnaby Lisk goes home at last. His family talk for eleven hours straight. He writes to Ines every week, mostly apologies.',
};

/** One line per letter delivered, in the order of the road. */
export function recipientEpilogues(s: GameState): string[] {
  return Object.keys(RECIPIENTS)
    .filter((id) => s.letters[id]?.state === 'delivered')
    .map((id) => {
      const e = RECIPIENTS[id];
      return typeof e === 'function' ? e(s) : (e ?? '');
    });
}

function partyEpilogues(s: GameState, ending: EndingId): string[] {
  const out: string[] = [];
  const name = s.rookieName;
  if (s.party.includes('fenn')) {
    if (s.flags['fenn.letterRead'] && s.flags['fenn.squad']) out.push('Fenn goes back to the Old Front every year to hear the names read, and when they reach the end, he answers for himself.');
    else if (s.flags['fenn.letterRead']) out.push('Fenn hangs the toll sign over his fireplace and drinks a pint for each of Squad Seven once a year, without counting.');
    else out.push('Fenn never opens his letter. He keeps it in his coat. Some things, he says, keep.');
  }
  if (s.party.includes('juniper')) {
    if (s.flags['juniper.view'] === 'hurt') out.push('Juniper goes back to the Fen and opens a shop that reseals things. She doesn’t write to Odile. Odile doesn’t expect her to. Every year, a stick of wax arrives anyway.');
    else out.push('Juniper learns to do her g’s properly. She never forges for money again. Now and then she does it for kindness, and signs her own name.');
  }
  if (ending !== 'lastpost') {
    out.push(
      ending === 'openbook'
        ? 'Odile is called to account in Kingsend. Half the country wants her in prison and the other half wants her knighted. She goes home to Thistle Cross in between hearings and does the crossword.'
        : ending === 'goat'
          ? 'Odile reopens the Thistle Cross office, on the grounds that nobody has told her not to. On Fridays she still has half a stout and the crossword.'
          : 'Odile goes home to Thistle Cross and the office with no post in it. On Fridays she still has half a stout and the crossword, and nobody talks to her until it’s done.',
    );
  }
  if (s.flags['sorrel.beaten']) out.push('Lark Sorrel is promoted for failing to catch you. Nobody understands why, least of all her.');
  if (s.flags['biscuit.joined'] && ending !== 'goat') out.push('Biscuit retires to Thistle Cross, where she eats the new Wire noticeboard and is never punished for it.');
  out.push(
    s.flags['rookie.forgives']
      ? `${name} keeps Gran’s letter in the tin. It is still the kindest thing anyone ever wrote, whoever wrote it.`
      : `${name} keeps Gran’s letter in the tin, and some evenings takes it out, and doesn’t read it, and puts it back.`,
  );
  return out;
}

function queenPage(s: GameState, ending: EndingId): EndingPage | null {
  if (!s.flags['queen.audience']) return null;
  const lines = [
    'The Queen receives you in a small room with a large fire. Pip’s drawing is on the mantelpiece.',
    ending === 'goat'
      ? 'She has read the regulation about goats. She says she has never been so pleased to be outmanoeuvred by livestock.'
      : ending === 'openbook'
        ? 'She has read every letter in the papers, like everyone else. She asks Odile one question: whether she would do it again. Odile says yes. The Queen nods, and doesn’t say what she thinks.'
        : 'She asks to hear about the road. All of it. She has tea brought in twice, and the second time she pours it herself.',
  ];
  return { title: 'An Audience', lines };
}

/** Odile's letter to the Rookie, the only one she ever signed with her own name. */
export function odilesLetter(s: GameState): NonNullable<EndingPage['letter']> {
  return {
    title: 'For the Senior Courier',
    from: 'Odile Marsh',
    to: s.rookieName,
    hand: 'real',
    style: 'elegant',
    postmark: 'THISTLE CROSS',
    body: [
      `${s.rookieName},`,
      'I’ve said all of it out loud now, so this should be easy. It isn’t. Forty years of other people’s letters and I can’t start my own.',
      'You carried every one of them the whole way. Even the ones that weren’t true. Perhaps those most of all.',
      'I won’t pretend to know if I did right. I know your gran said good morning to me every week for twelve years, and I would do it all again for that.',
      'I don’t know how to finish this. I’ve never had to sign one. Go home the long way, and stop at every gate.',
    ],
    signature: 'Odile',
  };
}

export function endingPages(s: GameState, ending: EndingId): EndingPage[] {
  const pages: EndingPage[] = [];
  const left = undelivered(s);
  switch (ending) {
    case 'goat':
      pages.push(
        { title: ENDING_NAMES.goat, lines: ['With no valid decree, the Royal Post cannot legally close.', 'The Crown’s lawyers spend a month looking for a precedent. They find only a regulation from the old king’s reign, concerning goats.', 'Biscuit is appointed Acting Postmaster General. She accepts by eating the appointment.'] },
        { lines: ['The party keeps delivering. The Wire carries the news; the Post carries everything else.', left.length > 0 ? `There are ${left.length} letters still in the sack. There is time now.` : 'The sack is empty. People have started writing again.'] },
      );
      break;
    case 'deadline':
      pages.push({
        title: ENDING_NAMES.deadline,
        lines: ['The sun goes down on the seventh day with the party still on the road.', 'At the Dead Letter Office in Kingsend, the furnace is lit for everything left undelivered.', `${left.length} letters burn.`],
      });
      pages.push({ title: 'Never reached', lines: left.map((id) => LETTER_BY_ID[id]?.to ?? id).slice(0, 12) });
      break;
    case 'lastpost':
      pages.push(
        { title: ENDING_NAMES.lastpost, lines: ['Vane reads her letter twice, by the furnace, and then she closes the furnace door.', 'The Dead Letter Office stays open for one last night. Every letter delivered is read into the record, and so is Odile’s confession, in her own words.'] },
        {
          lines:
            s.flags['truth.L14'] === 'truth' || s.flags['truth.L23'] === 'truth'
              ? ['In the morning Vane writes her report. It names the Kind Hand, and recommends no further action, on the grounds that the Inspectorate has more urgent business. She signs it.', 'Odile goes home to Thistle Cross. Nobody comes for her.']
              : ['In the morning Vane closes the file on the Kind Hand. Under CONCLUSION she writes: Hand not identified.', 'Then she takes Odile to breakfast, and they talk for three hours, and nobody else ever knows what about.'],
        },
        { lines: ['When you get back to Thistle Cross, there is a letter waiting for you in the empty post office. You know the hand.'], letter: odilesLetter(s) },
      );
      break;
    case 'openbook':
      pages.push(
        { title: ENDING_NAMES.openbook, lines: [`On the steps of the Dead Letter Office, ${s.rookieName} opens the sack and reads everything aloud. Real and forged, one after another, to whoever stops to listen.`, 'By noon there is a crowd. By evening it is in every paper in Vell.'] },
        { lines: ['The country splits down the middle. Some are furious: grief is not a thing to be written for you by a stranger. Some are grateful: somebody wrote, when nobody else did.', 'Families write in from every county, asking whether their letter was one of hers. Some of them hope it was.'] },
      );
      break;
    default:
      pages.push({
        title: ENDING_NAMES.furnace,
        lines: ['The party wins. It doesn’t feel like it.', left.length > 0 ? `At sundown the furnace takes the ${left.length} letters still in the sack, and the Royal Post closes quietly, the way most things do.` : 'There is nothing left in the sack for the furnace. At sundown the Royal Post closes quietly, the way most things do.'],
      });
  }
  const q = queenPage(s, ending);
  if (q) pages.push(q);
  const recipients = recipientEpilogues(s);
  for (let i = 0; i < recipients.length; i += 4) pages.push({ title: i === 0 ? 'Afterwards' : undefined, lines: recipients.slice(i, i + 4) });
  const party = partyEpilogues(s, ending);
  pages.push({ title: 'The party', lines: party.slice(0, 4) });
  if (party.length > 4) pages.push({ lines: party.slice(4) });
  pages.push(credits(ending));
  return pages;
}

function credits(ending: EndingId): EndingPage {
  const roles: [string, string][] = [
    ['Written, drawn and scored', 'in code, with no image or sound files'],
    ['Letters carried', 'by the last courier on the rolls'],
    ['Goat', 'Biscuit'],
    ['Thank you', 'for playing Sealbreak'],
  ];
  if (ending === 'goat') {
    return {
      title: 'Tracking',
      lines: ['Parcel: SEALBREAK. Signed for by: B. Goat, Acting Postmaster General.'],
      tracking: [['Thistle Cross', 'Collected', 'Day 1'], ['Bellwether Fen', 'In transit', 'Day 2'], ['Copperhill', 'In transit', 'Day 3'], ['Salt Road', 'In transit', 'Day 4'], ['Kingsend', 'Out for delivery', 'Ongoing'], ...roles.map(([a, b]): [string, string, string] => [a, b, '✓'])],
    };
  }
  return { title: 'Sealbreak', lines: roles.map(([a, b]) => `${a}: ${b}`) };
}
