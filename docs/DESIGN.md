# Sealbreak: game design

**This document contains spoilers.** Section 11 explains the late-game twist, and section 12 covers the endings. Everything before section 11 is safe to read.

All numbers are starting values to tune through playtesting. Distances are in tiles or logical pixels.

## 1. Pillars

1. **Every skill is a decision.** Keeping a letter, opening it and delivering it should all feel tempting.
2. **People, not plot tokens.** Each letter has a real recipient, and delivering it should feel like meeting someone.
3. **Warm and funny, with a sore spot.** The tone is a comic road trip that keeps running into what the war left behind.
4. **Short and complete.** About 90 minutes, with no padding and with reasons to replay for other endings.

## 2. Setting

The Kingdom of Vell has been at peace for 40 years since the Long Quarrel, a war against the Salt Provinces. In Vell, words sealed in wax hold on to the feeling they were written with. That small piece of everyday magic is why letters are taken seriously here, and why they can be used as weapons or comfort.

Now the Wire, a new telegraph network, is being strung across the country, and the Royal Post will close by decree at sundown on the seventh day. By law, all mail still in hand at closing goes to the furnace at the Dead Letter Office in Kingsend.

## 3. Story

### Opening

The Rookie arrives at the Thistle Cross post office to apply for a sorting job. They bring a tin holding the one letter their late gran treasured, which is the reason they wanted to work for the Post. A paperwork mix-up lists them as Senior Courier.

Odile Marsh, the retired postmistress, is packing up the office when she finds a sack marked *HELD*: 24 letters that never went out, many from the war. A courier on the rolls may legally deliver any mail until closing, and the Rookie is now the last courier on the rolls. Odile packs a bag, whistles for the office goat and sends them off with her usual goodbye: "Keep warm."

### Acts

| Act | Place | Main events |
|---|---|---|
| 1 | Thistle Cross | Meet Odile and Biscuit, learn the three letter options. Fenn Harrow, a toll-gate guard, quits his post and joins on the road |
| 2 | Bellwether Fen | Juniper Quill is in the lock-up for forgery and joins after the party deals with Bailiff Grist. Inspectors begin hunting the sack |
| 3 | Copperhill | The war's scars show. Fenn's past comes out at the mine, and Old Brass, a war-era mining engine, still follows its last orders. Widow Tarn says something strange about her letter |
| 4 | The Salt Road | Old enemy territory. Deputy Inspector Lark Sorrel confronts the party, and the truth about the sack comes out (see section 11) |
| 5 | Kingsend | The Dead Letter Office, its furnace and Chief Inspector Cressida Vane |

### Antagonist

Chief Inspector Cressida Vane is not cruel. She is precise, tired and certain, and she wants the sack badly enough to bend her own rules. The party thinks she is protecting procedure. Section 11 explains why it is personal.

## 4. Time and travel

The game has a seven-day clock. Only travel uses it.

| Route | Days |
|---|---|
| Thistle Cross → Bellwether Fen | 1 |
| Bellwether Fen → Copperhill | 1 |
| Copperhill → Salt Road | 1 |
| Salt Road → Kingsend | 1 |
| Detour and back: Mirrow Abbey (from the Fen) | 1 |
| Detour and back: the Old Front (from Copperhill) | 1 |
| Detour and back: Gull's Rest (from the Salt Road) | 1 |

- The journey begins on day 1 at Thistle Cross, so the direct route reaches Kingsend on day 5.
- There is time for two detours, not three. This is the main way players miss people.
- Delivering letter L15 gives the party a boat, which makes the Gull's Rest detour free. This is the only way to reach all three detours.
- The party cannot go back to an earlier region.
- Reaching Kingsend before day 7 has a small benefit: each spare day removes one Inspector from the fight outside the Dead Letter Office.
- A clear warning appears before any choice that would make Kingsend unreachable in time. A player can still do this on purpose, which leads to the Dead Letter ending.
- Each day of travel begins with a night at camp: a conversation by the fire, a chance to sort the satchel, and a rest that restores all HP and half of everyone's FP. The abbey's blessing makes it all FP. Inns restore everything for a price that rises along the road.

## 5. Letters

### 5.1 Rules

- Each party member can hold **3 letters** at a time. Others stay in the sack and can be swapped freely outside battle.
- **Carry:** the holder can use the letter's skill for Focus (FP).
- **Break the seal:** one use only, no FP cost, normal action weight. The letter's text is revealed, and it loses its skill. It can also be opened at camp just to read it, with no burst.
- **Opened letters** can still be delivered, but the reward drops by half and the recipient may react badly.
- **Reseal:** at camp, Juniper can reseal an opened letter using a wax stick, which restores the full delivery reward. The skill stays lost. There are 3 wax sticks in the game. Recipients who know the sender's habits may still notice.
- **Deliver:** talk to the recipient and choose whether to hand it over. The party loses the skill and gets the reward plus 30 XP each.
- Each letter's text is written out in full and can be read once opened or after delivery, when the recipient may share it.

### 5.2 Inspector Heat

Heat starts at 0. Each broken seal adds 1, including letters opened at camp. Resealing does not remove it. See section 7.3 for how Heat changes encounters. The satchel screen shows it as a simple gauge called *Inspectorate interest*.

### 5.3 Tones

A letter's tone sets its skill family. Each party member has two affinity tones that give +25% effect.

| Tone | Carry skill | FP | Break the seal |
|---|---|---|---|
| Love | Heal one ally for 25 + WIL × 1.5 | 4 | Heal the whole party for 60 + WIL × 2 |
| Joy | Party ATK +15% for 3 turns | 6 | Party ATK and DEF +30% for the whole battle |
| Grief | Power 12 and slow the target | 5 | Power 60 to all enemies and slow them |
| Anger | Power 24 to one enemy | 6 | Power 100 to one enemy |
| Debt | Power 12, restores 3 FP to the user | 3 | Power 70 to one enemy, plus 60 coin |
| Apology | Remove ailments from one ally, regenerate 5 HP per turn for 3 turns | 5 | Remove ailments from the party, regenerate 10 HP per turn for 5 turns |
| Threat | Delay one enemy by 40 ticks | 4 | Delay all enemies by 80 ticks |
| News | Move one ally to the front of the timeline | 5 | All allies act next, in speed order |

### 5.4 The sack

Hand: **R** means the letter is real, and **F** means it was forged (see section 11). Skills follow the tone table unless the note says otherwise.

**Thistle Cross**

| ID | Letter | From → To | Hand | Tone | Carry / Break names | Delivery reward |
|---|---|---|---|---|---|---|
| L01 | Home by Harvest | Pvt. Alder Finch → Mother Finch | F | Love | Mend / Homecoming | Quilt accessory (+10 HP), free inn in town |
| L02 | Final Demand | Brackwater & Sons → Ned Cobb, baker | R | Debt | Collect / Foreclose | The firm folded 30 years ago, and Ned laughs until he cries. 3 Loaves |
| L03 | I Know What You Did to My Hedge | Anonymous → Mayor Pell | R | Threat | Veiled Threat / Public Notice | Ends a hedge feud. Shop discount in town |

**Bellwether Fen**

| ID | Letter | From → To | Hand | Tone | Carry / Break names | Delivery reward |
|---|---|---|---|---|---|---|
| L04 | To My Sister, Who Stayed | Cpl. Ivo Rusk → Bea Rusk, eel-catcher | F | Apology | Clear Water / Forgiven | Bea's punt: encounters on the Fen's waterside roads −25% (the Abbey path is the one still ahead) |
| L05 | Recipe, As Promised | Aunt Dorrit → Sal Pottle, innkeeper | R | Joy | Good Cheer / Feast | Eel pie recipe: inn meals give +10% ATK in the next battle |
| L06 | The Reeds Know | An old partner → Hob Tanner, reed bandit (found in a road encounter) | R | Threat | Rumour / Confession | Hob's gang leaves the road, plus their stash |
| L07 | All My Love, Always | Lt. Rafe Corran → Elsie Corran | F | Love | Hold Fast / Always (revives one ally at full HP) | Elsie remarried long ago, and keeps it anyway. Ring accessory (+2 WIL) |

**Copperhill**

| ID | Letter | From → To | Hand | Tone | Carry / Break names | Delivery reward |
|---|---|---|---|---|---|---|
| L08 | Wages Owed, Company Scrip | Mining Co. → Union Hall | R | Debt | Garnish (also lowers DEF) / Bankrupt | Miners' Token: opens the Old Mine side area |
| L09 | Tell Pa I Didn't Run | Pvt. Sam Dunnock → Old Man Dunnock | F | Grief | Long Silence / Last Stand | Dunnock's medal. Unlocks a Fenn scene, because Sam was in his squad |
| L10 | A Proposal Regarding the Wire | Telegraph Board → Foreman Hask (found in a road encounter) | R | News | Telegram / Breaking News | Wire crews become friendly, and Wire Crawlers appear less often |
| L11 | Your Son Is Well | Sgt. M. Bell → Widow Tarn | F | Love | Comfort / Rest Easy | She says her son's sergeant couldn't write, and asks you to thank whoever did. First major clue |

**The Salt Road**

| ID | Letter | From → To | Hand | Tone | Carry / Break names | Delivery reward |
|---|---|---|---|---|---|---|
| L12 | Come Home, You Stubborn Fool | Ada Wick → Capt. Joss Wick, dune raider (found in a road encounter) | R | Anger | Scold / Full Force | Raiders leave the road |
| L13 | Terms of Armistice (Copy) | Treaty Office → Harbourmaster Quay | R | News | Fine Print (also lowers DEF) / Legal Binding (one non-boss enemy skips 3 turns) | Opens the harbour market, plus a large coin reward |
| L14 | We Were Wrong About Each Other | Sgt. Oren Vael, a Vell soldier → Mara Vell-Quay | F | Apology | Truce / Ceasefire (nobody deals damage for one forecast) | Salt Road shops and locals warm to the party |
| L15 | Last Will (Unwitnessed) | Capt. Pike → Brin Pike | R | Grief | Inheritance / Estate (also +12 FP to the party) | A small boat: the Gull's Rest detour costs no days |

**Kingsend**

| ID | Letter | From → To | Hand | Tone | Carry / Break names | Delivery reward |
|---|---|---|---|---|---|---|
| L16 | Complaint, Sixth of Many | Mr. Ogilvy → Postmaster General | R | Anger | Strongly Worded / To Whom It May Concern (hits all enemies at power 70) | The Postmaster General's stamp, plus 200 coin |
| L17 | A Child's Drawing | Pip, age seven → the Queen | R | Joy | Crayon Sun (party regen) / Royal Favour | The Queen agrees to see the party, which adds an ending scene |
| L18 | To My Cressida | Capt. Aurel Vane → Cressida Vane | R | Grief | Keepsake (passive: party DEF +10% while held) / Father (see section 10) | See section 11 |

**Detours**

| ID | Letter | From → To | Hand | Tone | Carry / Break names | Delivery reward |
|---|---|---|---|---|---|---|
| L19 | I Still Say Grace | Pvt. Luc Anselm → Sister Anselm, Mirrow Abbey | F | Joy | Grace (small party heal instead) / Benediction | Abbey blessing: resting also restores all FP |
| L20 | Returned Library Book (Very Overdue) | Hal Tolliver → Abbey library | R | Debt | Overdue (damage over time) / Forty Years' Fine (scales with the current day) | Archive access: Odile's war record, a major clue |
| L21 | To Whoever Finds Us | Squad Seven → Anyone, the Old Front | R | Grief | Roll Call (party DEF up) / All Present | Upgrades Fenn's Guard and improves his ending |
| L22 | You Still Owe Me Two Shillings | Cpl. Hale → Pvt. Moss, hermit at the Old Front | R | Debt | Two Shillings / Paid in Full | Moss's map: marks every remaining recipient on the road map |
| L23 | Keep the Light On | Mate Dove → Keeper Ines Dove, Gull's Rest | F | Love | Beacon / Safe Harbour | Sea charts: encounters on the coast road to Kingsend −25% (the Salt Road is already behind you) |
| L24 | I Am Not Dead | Barnaby Lisk → his family | R | Joy | Good News / Still Here | Barnaby is the lighthouse assistant and just never wrote again. He comes along for one scene, then gives you a rare accessory |

Key items outside the sack, which cannot be used as skills:

- **Gran's Letter:** in the Rookie's tin from the start, and readable at any time.
- **Fenn's Letter:** addressed to himself. He refuses to open it until his Copperhill scene.

## 6. Combat

Turn-based, with a party of four: the Rookie, Odile, Fenn and Juniper once all have joined. Biscuit is a bonus fifth member.

### 6.1 Timeline

Each combatant has a next-act time. After acting, it moves forward by `100 / SPD × action weight`, where weights are 0.8 for light actions, 1.0 for normal and 1.4 for heavy. The next 8 turns are always shown. A preview shows where the current actor would land for the highlighted action.

### 6.2 Forecast

Weather changes every 100 ticks. The current weather and the next two are always shown, and each region has its own weather mix. Effects apply to both sides.

| Weather | Effect |
|---|---|
| Clear | Attacks +25% |
| Rain | Healing, guarding and buffs +25% |
| Wind | Light actions move forward 25% less, Threat effects +50% |

### 6.3 Commands

Attack, Skill (innate skills), Letter (Carry), Break the Seal, Guard, Item, Run. **Deliver** also appears when the recipient of any undelivered letter, in a satchel or the sack, is in the fight. Delivering ends the battle peacefully.

Guard is a light action and halves damage taken until the guard's next turn. Ailments last 3 of the afflicted combatant's turns. Fear skips a turn half the time. Combatants start each fight a random 25–75% of one normal delay along the timeline.

Damage: `max(1, round(power × ATK / (DEF + 10) × weather × random(0.9, 1.1)))`. Basic attacks have power 10. Letter attacks use WIL against the target's WIL instead of ATK and DEF. Enemies of tier 2 and up deal 1.25 times this, so that a full party still has to look after itself.

Ailments are kept to three: **Slow** (timeline delays +50%), **Weak** (ATK −25%) and **Fear** (the target may lose its turn). Knocked-out allies can be revived with items or skills, and all recover at 1 HP after a win. If all four fall, the player restarts from the last save.

### 6.4 Party

| Character | HP | FP | ATK | DEF | SPD | WIL | Affinity | Innate skills |
|---|---|---|---|---|---|---|---|---|
| The Rookie | 60 | 20 | 9 | 6 | 10 | 8 | Joy, News | Express (light attack), Second Wind (restores own FP) |
| Odile Marsh | 50 | 30 | 6 | 5 | 8 | 12 | Love, Apology | Bandage (small heal), Sorting (rearranges the next 2 turns) |
| Fenn Harrow | 85 | 14 | 11 | 9 | 6 | 6 | Grief, Anger | Taunt, Shield Bash (toll-gate sign as a shield; can cause Slow) |
| Juniper Quill | 48 | 20 | 9 | 4 | 14 | 8 | Debt, Threat | Pickpocket, False Signature (copies an enemy's last buff) |

Per level, each gains about +8 HP, +2 FP, +1.5 ATK, +1 DEF, +0.5 SPD and +1 WIL, weighted toward their role. Fenn and Juniper join at one level below the Rookie, so nobody has to grind to catch them up. The level cap is 15, and the target is about level 12 at the final boss. Level *n* needs a total of `8n² + 12n` XP (level 1 starts at 0). A battle's XP is split equally across the party, including those knocked out; delivery XP is not split.

**Biscuit** has no HP and can't be targeted. Biscuit acts after every third turn of the timeline: a headbutt (power 8 with ATK 9, 50%), eating an enemy's held item (25%), or wandering about (25%). Items eaten by Biscuit sometimes come back later, slightly chewed. Giving Biscuit an apple adds one to a hidden trust counter.

## 7. Random encounters

### 7.1 When they happen

Encounters occur only on road and wilderness maps. Towns are always safe.

A **danger gauge** starts at 0 on a road map and after every encounter. It is shown as a small roadside bell icon that goes from still to swinging to ringing.

- Each step adds a region value: 1.5 on most roads and 1.2 on the first road.
- Off-road ground adds ×1.4, and staying on the paved road adds ×0.7.
- For the first 15 steps after an encounter, no new encounter can happen.
- Above a gauge value of 40, each step has a `(gauge − 40)%` chance to trigger.

Road maps are 120–160 steps long, which gives about 3–4 encounters per main crossing and 2 per detour. A playthrough should see about 18 in total.

### 7.2 What they are

Each encounter is 70% battle and 30% road event, with these exceptions:

- **Letter recipients:** L06, L10 and L12 can only be delivered in encounters. While the party holds one, it has a 25% chance to replace a battle on its road, and is guaranteed by the third encounter on that road.
- **Rare:** the Runaway Parcel has a 3% chance of appearing as a battle. It flees quickly and gives large XP and coin.
- **Road events** do not repeat until the regional pool has run out.

The transition into a fight should take under 0.5 s. Normal random fights should take 1–2 minutes.

**Auto-battle:** a toggle that uses basic attacks and heals anyone below 40% HP, but never breaks a seal or uses items. Can be cancelled at any point.

**Running:** the chance is `50% + 10% × (party average SPD − enemy average SPD)`, kept between 30% and 95%. It is always 100% if the party's average level is 2 or more above the enemies'. Inspectors reduce the chance by 30 percentage points. Bosses and scripted fights cannot be escaped. A failed attempt uses the turn.

**Repel Bell:** a consumable that stops the gauge rising, and keeps anything from turning up, for 40 steps. The party starts with one, and shops sell them for a price that rises by region.

### 7.3 Inspectors

When an encounter would be a battle, the chance it becomes an Inspector patrol is `min(5% + 4% × Heat, 50%)`. A patrol is one Inspector, two from Heat 3, and an Inspector with a Senior Inspector from Heat 6.

Heat also changes the final act: at Heat 3 or below, Vane fights alone. At Heat 8 or above, she brings two Senior Inspectors.

### 7.4 Enemies

| Tier | Region | Enemy | HP | ATK | DEF | WIL | SPD | XP | Coin | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Thistle Road | Bramble Hog | 26 | 7 | 3 | 2 | 8 | 10 | 4 | Charges |
| 1 | | Angry Goose | 16 | 8 | 2 | 2 | 14 | 10 | 2 | Honk delays one ally |
| 1 | | Road Brigand | 34 | 8 | 4 | 3 | 9 | 14 | 8 | Steals coin |
| 2 | Fen Road | Leech Clump | 56 | 9 | 3 | 4 | 7 | 18 | 4 | Drains HP |
| 2 | | Marsh Wisp | 40 | 6 | 2 | 12 | 13 | 20 | 6 | Fear, weak to Love: reading any Love letter near one hurts it |
| 2 | | Reed Bandit | 72 | 11 | 5 | 4 | 10 | 22 | 12 | Comes in groups |
| 3 | Copperhill Road | Rust Hound | 80 | 14 | 6 | 4 | 14 | 26 | 8 | Bites cause Weak |
| 3 | | Slag Crawler | 120 | 13 | 12 | 5 | 5 | 28 | 10 | High DEF, low WIL |
| 3 | | Company Thug | 92 | 15 | 7 | 5 | 9 | 26 | 18 | Calls for help |
| 4 | Salt Road | Salt Crab | 110 | 16 | 14 | 6 | 6 | 32 | 10 | Counterattacks |
| 4 | | Gull Swarm | 68 | 14 | 4 | 6 | 17 | 30 | 6 | Steals items |
| 4 | | Dune Raider | 120 | 18 | 9 | 7 | 11 | 34 | 24 | Hits hard in Wind |
| 5 | Kingsend Road | Wire Crawler | 140 | 20 | 12 | 10 | 13 | 40 | 18 | Weak to Rain |
| 5 | | Royal Guard | 170 | 22 | 15 | 9 | 9 | 42 | 26 | Guards allies |
| Any | Any | Inspector | ×1.2 | ×1.1 | ×1.1 | ×1.1 | ×1.0 | ×1.5 | ×1 | Stats scale from the current region's toughest regular enemy |
| Any | Any | Senior Inspector | ×1.8 | ×1.3 | ×1.2 | ×1.3 | ×1.1 | ×2.5 | ×2 | Appears from Heat 6 |
| Any | Any | Runaway Parcel | 18 | 1 | 40 | 40 | 25 | 150 | 150 | Flees after 3 turns |
| 0 | Thistle Cross | Sorting Room Rat | 12 | 5 | 2 | 1 | 11 | 6 | 1 | Tutorial only |

## 8. Bosses and scripted fights

| Fight | Place | Notes |
|---|---|---|
| Sorting Room Rats | Thistle Cross | Tutorial for Attack and Carry |
| Toll Gate Dispute | Thistle Road | Fenn joins partway |
| **Bailiff Grist** (HP 180) | Bellwether Fen | Boss. Keeps "fining" the party, which lowers coin or adds Weak |
| Mirrow Abbey Crypt | Detour | Optional |
| Union Hall Brawl | Copperhill | Choose a side first |
| **Old Brass** (HP 380) | Copperhill Old Mine | Boss. Still follows wartime orders. Reading the right letter aloud can shut down one of its attacks |
| Squad Seven's Trench | The Old Front | Optional |
| Harbour Ambush | Salt Road | Inspectors |
| Gull's Rest Stairs | Detour | Optional |
| **Deputy Inspector Lark Sorrel** (HP 600) | Salt Road | Boss. A rival who still believes in the Post |
| Outside the Office | Kingsend | Inspector count depends on spare days |
| **Chief Inspector Cressida Vane** (HP 1,100) | Dead Letter Office | Final boss, see section 10 |

## 9. Places

| Place | Type | Contents |
|---|---|---|
| Thistle Cross | Town | Post office, inn, shop, bakery, Mayor's hedge |
| Bellwether Fen | Stilted village | Eel market, lock-up, inn |
| Mirrow Abbey | Detour | Cloister, library, crypt |
| Copperhill | Mining town | Union Hall, war memorial, Old Mine |
| The Old Front | Detour | Overgrown trenches, Moss's hut |
| The Salt Road | Coastal port town | Harbour, market, Salt Road inn |
| Gull's Rest | Detour | Lighthouse and stairs |
| Kingsend | Capital | Palace gate, Post HQ, Dead Letter Office |

Each main stop has a town map and a road map before it. Maps are hand-authored as text grids.

**Road events** (at least 12): stranded traveller, suspicious toll, shortcut offer, wedding party, lost dog, someone asking for their letter early, storm shelter, peddler with rare goods, a child who wants to be a courier, a Wire crew's lunch break, a goat admirer, and an old oak where people nail messages for the dead.

**Towns** each have a shop and an inn. Shops sell the basics at prices that rise by region; the Mayor's word gets a fifth off in Thistle Cross, and the Salt Road's goodwill does the same there. At Copperhill, Old Brass blocks the east road until it is beaten, and the Miners' Token opens the Old Mine's upper workings, where a few wartime stores are still waiting.

**Items and gear** stay small: Loaf and Pie (heal HP), Ink (restore FP), Smelling Salts (revive), Repel Bell, Apple (for Biscuit), and one accessory slot per character. Coin buys these from shops. There are no weapons or armour to manage, because the letters are the build.

## 10. Final boss: Chief Inspector Cressida Vane

| Phase | HP | Behaviour |
|---|---|---|
| 1. Procedure | 100–60% | Stamps cause Weak and Slow, and she demands the sack |
| 2. Seizure | 60–30% | Can confiscate a held letter's skill for the fight, and the furnace behind her heats the room |
| 3. Furnace | 30–0% | Attacks hit the whole party. Letters in the party's hands visibly smoulder |

**Deliver works mid-fight.** Vane is a recipient. Below 50% HP, if L18 is still unopened, the Deliver command appears. Using it ends the fight on the spot and leads to the Last Post ending if its other conditions are met.

**Break the seal on L18** is the temptation: *Father* deals damage equal to 60% of her maximum HP. It wins the fight almost immediately and closes off the Last Post ending for good. Its text reads like a normal skill description, with one line about what kind of letter this is.

If L18 was opened earlier, Deliver never appears and the fight simply goes to the end.

## 11. The twist (spoilers)

### The Kind Hand

Among forgers there is a legend called the Kind Hand, a master who is never caught and whose work never made anyone money. Juniper has wanted to meet them all her life.

**The Kind Hand is Odile.** During the war she ran a field post office and watched families wait for letters that would never come. So she started writing them herself: last words from soldiers who had none, in voices she knew from reading their mail. She has carried on for 40 years.

The sack is not simply lost wartime mail. Sixteen letters are genuine and were held back for ordinary reasons. Eight are hers, written for families she never got to, and hiring a courier who would deliver them after she was gone is why she has been waiting. The Rookie being hired "by mistake" was no mistake.

### The tell

Every letter by Odile ends with the words **"Keep warm."**, whoever is supposed to have written it. She says the same thing out loud when she says goodbye in the first scene. It is never pointed out.

**Gran's Letter**, which the player has been able to read since the first minute, ends with "Keep warm." too. The letter that made the Rookie want to work for the Post was a forgery.

### How it unfolds

1. **Small clues:** Widow Tarn's remark (L11), Odile's record in the Abbey archive (L20), and any forged letters the player has opened.
2. **The reveal, Salt Road:** Sorrel lays out the Inspectorate's case against an unknown forger. Juniper compares the letters and recognises one hand. The player can have the Rookie open the tin and compare. Odile doesn't deny it.
3. **After the reveal:** delivering any remaining forged letter adds a choice: **say nothing** or **tell them the truth**. Reactions differ, and neither answer is treated as correct. Odile stays in the party, and the mood at camp changes.

In the game, the reveal happens on the quay at the Salt Road after the Harbour Ambush, and Sorrel is fought straight after it. The first nights at camp afterwards let the Rookie answer Odile (it was still a kind thing, or she should have said), and decide whether Juniper goes and talks to her, which sets how Juniper feels about Odile for the epilogues.

### Why Vane wants the sack

Vane was a child when she received a letter from her father, a captain killed in the war. It got her through her childhood. As an adult inspector she found it was a forgery, and she has spent her career hunting the Kind Hand.

L18, **To My Cressida**, is her father's real last letter. It was in the sack all along, and she has no idea. It's short, awkward and much less beautiful than the fake, and it does not end with "Keep warm."

### Fenn

Fenn left his squad at Copperhill during a retreat and has never read the letter they sent after him. If the player completes his Copperhill scene, he opens it. It's real, and it tells him they were glad one of them got out. L21 and L09 add more to this scene. Forcing no one's choices is the point: the player can only bring him to it.

## 12. Endings

Checked in this order when the final fight resolves:

1. **Goat Post (secret, comedic).** Biscuit's trust is 5 or more. As the Decree of Closure is handed over for countersigning, a new option appears: let Biscuit have it. With no valid decree, the Post stays legally open. Biscuit is appointed acting Postmaster General, the party keeps delivering, and the credits are presented as a parcel-tracking sheet.
2. **Dead Letter (deadline).** Kingsend wasn't reached by sundown on day 7. The closing scene is short, and shows the furnace and each recipient the player never reached.
3. **Last Post.** L18 was delivered mid-fight and unopened, at least 14 letters were delivered in total, and Heat is 6 or below. Vane reads her letter. The office stays open for one last night while the party's work and Odile's confession are heard. Vane decides what to do about Odile, and the letter Odile leaves for the Rookie closes the game. It's the only one of her letters to be signed with her own name.
4. **Open Book.** 8 or more letters were opened. The Rookie reads everything aloud at Kingsend. The forgeries become public and the country is split about it: some are furious and some are grateful.
5. **Dead Letter (furnace).** Any other result. The party wins, but the remaining letters burn and the Post closes quietly.

After the final fight, a clerk brings the Decree of Closure to be countersigned; if Biscuit's trust is high enough, the choice to let her have it appears there. Endings found are remembered across games and counted on the title screen, with the two Dead Letter endings counted as one.

Each ending also shows a short epilogue for every recipient reached and every party member. Scenes depend on the choices made: truth or silence at each forged delivery, Fenn's letter, Juniper's feelings about Odile, and the Queen's audience (L17).

## 13. Character art

**This game has more detailed characters than Gloamward.** The goal is hi-bit pixel art with clear personality, still fully drawn in code with no image files.

### 13.1 Sizes

The game renders at a logical 640×360, scaled up by whole numbers. When whole numbers would leave much of the screen empty, as on a phone with the browser's bars showing, it scales to fit instead. Menu and dialogue text never shrinks below a readable size.

| Sprite | Size | Frames |
|---|---|---|
| Field | 32×48 | 4 directions: idle 2 and walk 6 |
| Battle (party, bosses, key NPCs) | 64×96 | Idle 4, attack 5, read or cast 5, break the seal 6, hit 2, guard 2, knocked out 3, victory 4 |
| Battle (regular enemies) | 48–72 px | Idle 2–4, attack 3, hit 1, defeat 2 |
| Dialogue portrait | 96×96 | Neutral, happy, sad, angry and surprised, each with blink and mouth frames. Key NPCs get at least 3 expressions |
| Town NPCs | 32×48 | Assembled from shared body, hair, coat and accessory parts in about 12 combinations, with unique touches for named recipients |

### 13.2 How the art is made

Sprites are built at load time, then cached to sprite sheets so runtime drawing stays cheap:

1. **Part rig:** each character is made of named layers such as head, hair, torso, coat tails, arms and props, with poses defined per frame. Parts are short paths or shapes.
2. **Low-res rendering:** parts are drawn to a canvas at exact sprite size.
3. **Pixel cleanup:** alpha is thresholded to hard edges, and colours are snapped to the character's palette.
4. **Shading:** each material has 3–4 tones, with light from the upper left.
5. **Outline:** a selective outline pass uses a dark tone of the neighbouring colour, not flat black.
6. **Detail layer:** small hand-placed pixel grids add faces, buttons, buckles, stitching and ink stains.

Motion should have weight: secondary movement on coat tails, hair and satchels, and a step bob on walking frames.

### 13.3 Character details

| Character | Palette | Details that must be readable |
|---|---|---|
| The Rookie | Faded post blue, brass, tan | Coat too big with rolled sleeves, brass buttons, crooked cap, heavy satchel on one shoulder, scuffed boots, Gran's tin in a coat pocket |
| Odile Marsh | Plum, ash grey, ink black | Grey braided bun, round spectacles on a chain, long cardigan, fingerless gloves, ink-stained right fingers, walking stick topped with a brass stamp |
| Fenn Harrow | Olive drab, iron, weathered brown | Tall and broad, old greatcoat with darker patches where the insignia used to be, grey stubble, scar through one eyebrow, shield made from a toll-gate sign |
| Juniper Quill | Waxed green, wine red, black | Short dark hair with an ink streak, jeweller's loupe pushed up on the forehead, coat full of pockets, bandolier of sealing-wax sticks |
| Biscuit | Cream, tan, red | Goat with one bent horn, ear tag, small red post saddlebags, always chewing something |
| Cressida Vane | Black, silver, pale gold | Long severe uniform, silver buttons, pale hair pinned up, grey gloves, heavy stamp used as a mace |
| Lark Sorrel | Inspectorate black, russet | Younger, russet hair escaping a cap, uniform slightly too neat, clipboard |

### 13.4 Quality checks

- **Silhouette test:** in solid black at field size, every party member can be told apart.
- **Sprite gallery:** a debug page at `?sprites` shows every sprite and animation at 1× and 4× on light and dark backgrounds.
- **Budget:** full detail goes to the party, bosses and portraits. Tile art stays simpler and lower in contrast so characters stand out.

## 14. Look and sound

**World palette:** soft autumn greens and browns at Thistle Cross, blue-grey water at the Fen, rust and soot at Copperhill, bleached sand and teal at the Salt Road, and stone with copper wire at Kingsend.

**Tiles:** 32×32, drawn in code with some variation so that roads and walls don't look repeated.

**Letters:** the reading screen shows paper with wax, stamp and postmark details. Each author has a visibly different text style, using a safe browser font stack and some spacing and slant changes. Letters by Odile also get a small curl beneath the signature.

**Sound:** everything uses Web Audio, with no sample files.

- Simple tunes per region using plucked and reed-like synth voices, with a fiddle-like lead
- A battle theme that changes intensity with the forecast
- Paper rustle and wax crack effects built from filtered noise
- A goat bleat, which will need some attention to be funny

## 15. Controls and screens

| Action | Keyboard | Touch |
|---|---|---|
| Move | WASD or arrow keys | Left-side floating joystick |
| Confirm or talk | Enter, Space or Z | Tap the action button |
| Cancel or menu | Esc or X | Menu button |
| Run | Hold Shift | Run toggle |

Movement is tile-based at 5 tiles per second, because encounters are counted in steps.

On phones the game plays in landscape. In portrait it asks the player to turn the phone, and offers full screen where the browser allows it. Menus, dialogue and letters can be tapped directly.

**Screens:** title, naming the Rookie, field, dialogue, satchel, letter reader, road map, camp, shop, battle, game over, ending, and credits.

**Saving:** autosave on entering a town or arriving on a new day, plus 3 manual slots. Saves can only be made outside battle.

Accessibility options: text speed, reduced motion, larger text, and encounter rate (normal or low).

## 16. Out of scope for version 1

- Multiplayer and online features
- Accounts or any backend
- Voice acting
- Gear systems beyond accessories
- Languages other than English, though text should stay in data files so it could be added later
