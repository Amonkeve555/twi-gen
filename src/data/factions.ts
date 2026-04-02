export interface FactionTech {
  name: string;
  type: "unit" | "green" | "blue" | "yellow" | "red";
  prerequisites?: string;
  description: string;
}

export interface Faction {
  name: string;
  shortName: string;
  color: string; // tailwind-compatible hsl
  abilities?: string[];
  promissoryNote?: string;
  startingUnits?: string;
  startingTech?: string[];
  commodities?: number;
  strategyTip?: string;
  factionTech?: FactionTech[];
}

export const TI4_FACTIONS: Faction[] = [
  {
    name: "The Arborec",
    shortName: "Arborec",
    color: "120 50% 35%",
    abilities: [
      "Mitosis: During the status phase, place 1 infantry from your reinforcements on any planet you control.",
      "Deploy: When you produce ground forces, you may place them on any planet you control instead of your space dock's system.",
    ],
    promissoryNote: "Stall Order — Action: Place this card face-up in your play area. The next time another player activates a system, you may exhaust this card to end your turn.",
    startingUnits: "1 Carrier, 1 Cruiser, 5 Infantry, 1 Space Dock, 2 Fighters, 1 PDS",
    startingTech: ["Magen Defense Grid"],
    commodities: 3,
    strategyTip: "Focus on spreading infantry across planets early. Your Mitosis ability snowballs over time. Prioritize Warfare or Production to maximize unit output.",
    factionTech: [
      { name: "Bioplasmosis", type: "green", prerequisites: "GG", description: "At the end of the status phase, you may remove any number of infantry from planets you control and place them on 1 or more planets you control in the same or adjacent systems." },
      { name: "Letani Warrior II", type: "unit", prerequisites: "GG", description: "Cost 1 / Combat 8(×2). After this unit is destroyed, roll 1 die. If the result is 6 or greater, place the unit on this card. At the start of your next turn, place each unit that is on this card on a planet you control in your home system." },
    ],
  },
  {
    name: "The Barony of Letnev",
    shortName: "Letnev",
    color: "0 0% 25%",
    abilities: [
      "Munitions Reserves: At the start of each round of space combat, you may spend 2 trade goods to apply +1 to each of your ship's combat rolls.",
      "Armada: The maximum number of non-fighter ships you can have in a system is equal to 2 more than the number of tokens in your fleet pool.",
    ],
    promissoryNote: "War Funding — After a player's destroyer or cruiser is destroyed: Place it back on the game board in the system instead. Then return this card to the Barony.",
    startingUnits: "1 Dreadnought, 1 Carrier, 1 Destroyer, 3 Infantry, 1 Fighter, 1 Space Dock",
    startingTech: ["Antimass Deflectors", "Plasma Scoring"],
    commodities: 2,
    strategyTip: "Leverage your Armada ability to field massive fleets. Spend trade goods aggressively for combat bonuses. The Barony excels at military dominance.",
  },
  {
    name: "The Clan of Saar",
    shortName: "Saar",
    color: "35 70% 45%",
    abilities: [
      "Scavenge: After you gain control of a planet, gain 1 trade good.",
      "Nomadic: Your space docks have the 'sustain damage' ability. They are placed in space and can move with your fleet.",
    ],
    promissoryNote: "Ragh's Call — After you commit 1 or more units to a planet: Remove all of the Saar player's ground forces from that planet and place them on a planet they control. Then return this card.",
    startingUnits: "2 Carriers, 1 Cruiser, 4 Infantry, 2 Fighters, 1 Space Dock",
    startingTech: ["Antimass Deflectors"],
    commodities: 3,
    strategyTip: "Stay mobile. Your floating space docks mean you never need to defend a home system. Expand aggressively and use Scavenge to fuel your economy.",
  },
  {
    name: "The Embers of Muaat",
    shortName: "Muaat",
    color: "15 80% 50%",
    abilities: [
      "Star Forge: Action: Spend 1 token from your strategy pool to place either 2 fighters or 1 destroyer from your reinforcements in a system that contains 1 or more of your war suns.",
      "Gashlai Physiology: Your war suns lose their Bombardment ability during the first round of a space combat.",
    ],
    promissoryNote: "Promise of Protection — Action: Place this card face-up in your play area. While this card is in your play area, the Muaat player cannot activate your home system.",
    startingUnits: "1 War Sun, 2 Fighters, 4 Infantry, 1 Space Dock",
    startingTech: ["Plasma Scoring"],
    commodities: 4,
    strategyTip: "Your War Sun start is your biggest asset—protect it early. Use Star Forge to generate free units. Rush War Sun II tech for devastating fleets.",
  },
  {
    name: "The Emirates of Hacan",
    shortName: "Hacan",
    color: "45 80% 50%",
    abilities: [
      "Masters of Trade: You do not have to spend a command token to resolve the secondary ability of the Trade strategy card.",
      "Guild Ships: You can negotiate transactions with players who are not your neighbors.",
    ],
    promissoryNote: "Trade Convoys — Action: Place this card face-up in your play area. While this card is in your play area, you may negotiate transactions with the Hacan player.",
    startingUnits: "2 Carriers, 1 Cruiser, 4 Infantry, 2 Fighters, 1 Space Dock",
    startingTech: ["Antimass Deflectors", "Sarween Tools"],
    commodities: 6,
    strategyTip: "You are the trade king. Use your massive commodity pool and Guild Ships to broker deals across the galaxy. Economic dominance is your path to victory.",
  },
  {
    name: "The Federation of Sol",
    shortName: "Sol",
    color: "210 60% 50%",
    abilities: [
      "Orbital Drop: Action: Spend 1 command token from your strategy pool to place 2 infantry from your reinforcements on any planet you control.",
      "Versatile: When you gain command tokens during the status phase, gain 1 additional command token.",
    ],
    promissoryNote: "Military Support — At the start of the Sol player's turn: remove 1 token from the Sol player's strategy pool and return this card. Then place the removed token in your reinforcements.",
    startingUnits: "2 Carriers, 1 Destroyer, 5 Infantry, 2 Fighters, 1 Space Dock",
    startingTech: ["Antimass Deflectors", "Neural Motivator"],
    commodities: 4,
    strategyTip: "Use Orbital Drop to contest planets without moving fleets. Versatile gives you action economy advantage. Sol is flexible—adapt to the table's dynamics.",
  },
  {
    name: "The Ghosts of Creuss",
    shortName: "Creuss",
    color: "220 70% 60%",
    abilities: [
      "Quantum Entanglement: You treat all systems that contain either an alpha or beta wormhole as adjacent to each other.",
      "Slipstream: During your tactical actions, you can move through systems that contain other players' ships.",
    ],
    promissoryNote: "Creuss Iff — At the start of your turn: Place or move a Creuss wormhole token into either a system that contains a planet you control or a non-home system that is adjacent to one of your ships. Then return this card.",
    startingUnits: "2 Carriers, 1 Destroyer, 4 Infantry, 2 Fighters, 1 Space Dock",
    startingTech: ["Gravity Drive"],
    commodities: 4,
    strategyTip: "Wormhole control is your superpower. Place wormholes strategically for surprise attacks and easy scoring. Your mobility is unmatched when wormholes are on the board.",
  },
  {
    name: "The L1Z1X Mindnet",
    shortName: "L1Z1X",
    color: "200 30% 35%",
    abilities: [
      "Assimilate: When you gain control of a planet that contains another player's PDS or space dock, you may replace it with one of your own from your reinforcements.",
      "Harrow: At the end of each round of ground combat, your dreadnoughts in the system may use their Bombardment ability against your opponent's ground forces on the planet.",
    ],
    promissoryNote: "Cybernetic Enhancements — At the start of your turn: Remove 1 token from the L1Z1X player's strategy pool and return this card. Then place the removed token in your fleet pool.",
    startingUnits: "1 Dreadnought, 1 Carrier, 5 Infantry, 3 Fighters, 1 Space Dock, 1 PDS",
    startingTech: ["Neural Motivator", "Plasma Scoring"],
    commodities: 2,
    strategyTip: "Harrow makes your dreadnoughts terrifying in ground combat. Assimilate stolen infrastructure to fuel your expansion. Play aggressively—your units are built for war.",
  },
  {
    name: "The Mentak Coalition",
    shortName: "Mentak",
    color: "40 60% 45%",
    abilities: [
      "Ambush: At the start of space combat, you may roll 1 die for up to 2 of your cruisers or destroyers. For each result >= 6, produce 1 hit.",
      "Pillage: After another player gains trade goods or resolves a transaction, you may take 1 trade good from that player.",
    ],
    promissoryNote: "Promise of Protection — Action: Place this card face-up in your play area. While this card is in your play area, the Mentak player cannot use their Pillage ability against you.",
    startingUnits: "2 Carriers, 1 Cruiser, 4 Infantry, 3 Fighters, 1 Space Dock, 1 PDS",
    startingTech: ["Sarween Tools", "Plasma Scoring"],
    commodities: 2,
    strategyTip: "Pillage is your economic engine—use it every chance you get. Ambush makes your smaller ships dangerous. Build a cruiser-heavy fleet for maximum efficiency.",
  },
  {
    name: "The Naalu Collective",
    shortName: "Naalu",
    color: "50 70% 50%",
    abilities: [
      "Telepathic: At the end of the strategy phase, place the Naalu '0' token on your strategy card; you are first in initiative order.",
      "Foresight: After another player moves ships into a system that contains 1 or more of your ships, you may place 1 token from your reinforcements in your fleet pool.",
    ],
    promissoryNote: "Gift of Prescience — At the end of the strategy phase: Place the Naalu '0' token on your strategy card; you are first in initiative order. Then return this card to the Naalu player.",
    startingUnits: "1 Carrier, 1 Cruiser, 1 Destroyer, 4 Infantry, 3 Fighters, 1 Space Dock, 1 PDS",
    startingTech: ["Neural Motivator", "Sarween Tools"],
    commodities: 3,
    strategyTip: "Going first every round is enormously powerful. Use Telepathic to always act before your opponents. Score objectives before others can interfere.",
  },
  {
    name: "The Nekro Virus",
    shortName: "Nekro",
    color: "0 70% 40%",
    abilities: [
      "Galactic Threat: You cannot vote on agendas. Once per agenda phase, after an agenda is revealed, you may predict aloud the outcome. If correct, gain 1 technology.",
      "Technological Singularity: When you win a combat, you may copy 1 technology from the losing player.",
    ],
    promissoryNote: "Antivirus — At the start of a combat: Place this card face-up in your play area. The Nekro player cannot use their Technological Singularity ability against you. Return this card at the end of the combat.",
    startingUnits: "1 Dreadnought, 1 Carrier, 2 Infantry, 2 Fighters, 1 Space Dock",
    startingTech: ["Dacxive Animators"],
    commodities: 3,
    strategyTip: "You gain tech through combat, not research. Attack frequently to steal technologies. Predict agenda outcomes wisely for free tech gains.",
  },
  {
    name: "Sardakk N'orr",
    shortName: "Sardakk",
    color: "0 60% 30%",
    abilities: [
      "Unrelenting: Apply +1 to the result of each of your unit's combat rolls.",
      "Valefar Assimilator: When you research a technology, you may exhaust 2 planets and replace 1 of your technologies with a faction technology that is not owned by the Sardakk N'orr or the Nekro Virus.",
    ],
    promissoryNote: "Tekklar Legion — At the start of ground combat: Apply +1 to the result of each of your unit's combat rolls during this combat. Then return this card.",
    startingUnits: "2 Carriers, 1 Cruiser, 5 Infantry, 1 Space Dock, 1 PDS",
    startingTech: [],
    commodities: 3,
    strategyTip: "Your +1 combat bonus is devastating. You start with no tech, so plan your tech path carefully. Prioritize combat-boosting technologies to become unstoppable.",
  },
  {
    name: "The Universities of Jol-Nar",
    shortName: "Jol-Nar",
    color: "260 50% 55%",
    abilities: [
      "Fragile: Apply -1 to the result of each of your unit's combat rolls.",
      "Brilliant: When you spend a command token to resolve the secondary ability of the Technology strategy card, you may resolve the primary ability instead.",
    ],
    promissoryNote: "Research Agreement — After the Jol-Nar player researches a technology that is not a faction technology: Gain that technology. Then return this card.",
    startingUnits: "2 Carriers, 1 Dreadnought, 2 Infantry, 1 Fighter, 1 Space Dock, 2 PDS",
    startingTech: ["Antimass Deflectors", "Neural Motivator", "Sarween Tools", "Plasma Scoring"],
    commodities: 4,
    strategyTip: "You start with 4 technologies—an enormous advantage. Rush high-tier tech to offset Fragile. Avoid direct combat when possible; let your tech carry you.",
  },
  {
    name: "The Winnu",
    shortName: "Winnu",
    color: "270 40% 45%",
    abilities: [
      "Blood Ties: You do not have to pay influence to remove the custodians token from Mecatol Rex.",
      "Reclamation: After you resolve a tactical action during which you gained control of Mecatol Rex, you may place 1 PDS or 1 space dock from your reinforcements on Mecatol Rex.",
    ],
    promissoryNote: "Acquiescence — At the end of the strategy phase: Exchange your strategy card with the Winnu player's strategy card. Then return this card.",
    startingUnits: "1 Carrier, 1 Cruiser, 2 Infantry, 2 Fighters, 1 Space Dock, 1 PDS",
    startingTech: [],
    commodities: 3,
    strategyTip: "Rush Mecatol Rex—Blood Ties makes it free. Control of the center gives you VP and leverage. Build a strong fleet to hold Mecatol against challengers.",
  },
  {
    name: "The Xxcha Kingdom",
    shortName: "Xxcha",
    color: "140 40% 40%",
    abilities: [
      "Peace Accords: After you resolve the primary or secondary ability of the Diplomacy strategy card, you may gain 1 command token.",
      "Quash: When an agenda is revealed, you may spend 1 token from your strategy pool to discard that agenda and reveal the next agenda from the top of the deck.",
    ],
    promissoryNote: "Political Favor — When an agenda is being voted on: Cast your votes for the current agenda. Those votes must be cast for the same outcome as the Xxcha player's votes. Then return this card.",
    startingUnits: "2 Carriers, 1 Cruiser, 4 Infantry, 3 Fighters, 1 Space Dock, 1 PDS",
    startingTech: ["Graviton Laser System"],
    commodities: 4,
    strategyTip: "You excel in the political game. Use Quash to control the Agenda phase. PDS networks with Graviton Laser System create powerful defensive zones.",
  },
  {
    name: "The Yin Brotherhood",
    shortName: "Yin",
    color: "0 0% 80%",
    abilities: [
      "Indoctrination: When you gain control of a planet, you may replace 1 of the other player's infantry on that planet with 1 of your own infantry.",
      "Devotion: After each space combat round, you may destroy 1 of your cruisers or destroyers in the active system to produce 1 hit.",
    ],
    promissoryNote: "Greyfire Mutagen — After a system is activated: Place this card face-up in your play area. The Yin player cannot use their Devotion ability during combat in this system. Return this card at the end of combat.",
    startingUnits: "2 Carriers, 1 Destroyer, 4 Infantry, 4 Fighters, 1 Space Dock",
    startingTech: ["Sarween Tools"],
    commodities: 2,
    strategyTip: "Devotion turns your smaller ships into guaranteed hits. Indoctrination helps you take planets efficiently. Build a swarm of expendable ships for maximum combat value.",
  },
  {
    name: "The Yssaril Tribes",
    shortName: "Yssaril",
    color: "130 60% 30%",
    abilities: [
      "Stall Tactics: Action: Discard 1 action card from your hand to pass.",
      "Scheming: When you draw action cards, draw 1 additional card. Then return 1 action card to the bottom of the deck.",
    ],
    promissoryNote: "Spy Net — At the start of your turn: Look at the Yssaril player's hand of action cards. Choose 1 and add it to your hand. Then return this card.",
    startingUnits: "2 Carriers, 1 Cruiser, 5 Infantry, 2 Fighters, 1 Space Dock",
    startingTech: ["Neural Motivator"],
    commodities: 3,
    strategyTip: "Action card advantage is your superpower. Use Stall Tactics to always act last when it matters. Hoard action cards for devastating combo plays.",
  },
];

export const POK_FACTIONS: Faction[] = [
  {
    name: "The Argent Flight",
    shortName: "Argent",
    color: "0 0% 70%",
    abilities: [
      "Zeal: You may perform a tactical action in a system that contains 1 or more of your command tokens.",
      "Raid Formation: When 1 or more of your units use Anti-Fighter Barrage, for each hit produced in excess of your opponent's fighters, choose 1 of your opponent's non-fighter ships to be destroyed.",
    ],
    promissoryNote: "Strike Wing Ambuscade — When you use Anti-Fighter Barrage: Apply +2 to each of your units' Anti-Fighter Barrage rolls. Then return this card.",
    startingUnits: "2 Carriers, 1 Destroyer, 5 Infantry, 2 Fighters, 1 Space Dock, 1 PDS",
    startingTech: ["Neural Motivator", "Sarween Tools"],
    commodities: 3,
    strategyTip: "Raid Formation makes your destroyers lethal—excess AFB hits kill capital ships. Zeal gives incredible flexibility for re-activating systems.",
  },
  {
    name: "The Empyrean",
    shortName: "Empyrean",
    color: "280 50% 50%",
    abilities: [
      "Voidborn: Nebulae do not affect your ship movement.",
      "Aetherpassage: After a player activates a system that is adjacent to 1 or more of your systems, you may allow that player to move their ships through your systems.",
    ],
    promissoryNote: "Blood Pact — Action: Place this card face-up in your play area. The Empyrean player places a command token from their reinforcements in your fleet pool.",
    startingUnits: "1 Carrier, 1 Dreadnought, 3 Infantry, 2 Fighters, 1 Space Dock, 1 PDS",
    startingTech: ["Dark Energy Tap"],
    commodities: 4,
    strategyTip: "Use Aetherpassage as a diplomatic tool—offer passage in exchange for favors. Your flexibility in negotiation is your greatest strength.",
  },
  {
    name: "The Mahact Gene-Sorcerers",
    shortName: "Mahact",
    color: "50 50% 40%",
    abilities: [
      "Edict: When you win a combat, place the loser's command token in your fleet pool if it is not already there.",
      "Imperia: While another player's command token is in your fleet pool, you can use that player's commander ability.",
    ],
    promissoryNote: "Scepter of Emelpar — At the start of a combat: Remove 1 token from the Mahact player's fleet pool and return this card. That token is placed in your reinforcements.",
    startingUnits: "2 Carriers, 1 Cruiser, 3 Infantry, 2 Fighters, 1 Space Dock",
    startingTech: ["Bio-Stims", "Predictive Intelligence"],
    commodities: 3,
    strategyTip: "Win combats to steal command tokens and commander abilities. Mahact grows stronger with every victory. Target players with the best commanders first.",
  },
  {
    name: "The Naaz-Rokha Alliance",
    shortName: "Naaz-Rokha",
    color: "90 40% 40%",
    abilities: [
      "Distant Suns: When you explore a planet, draw 1 additional card. Then return 1 exploration card to the top or bottom of the deck.",
      "Fabrication: Action: Either purge 2 of your relic fragments of the same type to gain 1 relic, or purge 1 of your relic fragments to gain 1 command token.",
    ],
    promissoryNote: "Black Market Forgery — Action: Purge 2 of your relic fragments of any type to gain 1 relic. Then return this card.",
    startingUnits: "2 Carriers, 1 Destroyer, 3 Infantry, 2 Fighters, 1 Space Dock, 1 Mech",
    startingTech: ["Psychoarchaeology", "AI Development Algorithm"],
    commodities: 3,
    strategyTip: "Explore aggressively to accumulate relic fragments. Fabrication turns fragments into relics or command tokens. Double exploration draws give you massive discovery advantage.",
  },
  {
    name: "The Nomad",
    shortName: "Nomad",
    color: "30 50% 45%",
    abilities: [
      "The Company: During setup, place your flagship in your home system. It does not count against your fleet supply.",
      "Future Sight: During the agenda phase, you may look at the top card of the agenda deck at any time.",
    ],
    promissoryNote: "The Cavalry — At the start of a space combat in a system that is adjacent to the Nomad's flagship: The Nomad places their flagship in the active system.",
    startingUnits: "1 Carrier, 1 Flagship, 1 Destroyer, 4 Infantry, 2 Fighters, 1 Space Dock",
    startingTech: ["Sling Relay"],
    commodities: 4,
    strategyTip: "Your flagship is your mobile base of operations. Future Sight gives you agenda phase intelligence. Use The Cavalry promissory note as a powerful diplomatic bargaining chip.",
  },
  {
    name: "The Titans of Ul",
    shortName: "Ul",
    color: "20 60% 40%",
    abilities: [
      "Terragenesis: After you explore a planet that does not have a sleeper token, place 1 sleeper token on that planet.",
      "Awaken: After you activate a system that contains 1 or more of your sleeper tokens, you may replace each of your sleeper tokens in that system with 1 PDS.",
    ],
    promissoryNote: "Terraform — Action: Attach this card to a non-home, non-Mecatol Rex planet you control. Its resource and influence values are each increased by 1.",
    startingUnits: "1 Carrier, 1 Cruiser, 1 Dreadnought, 3 Infantry, 1 Fighter, 1 Space Dock, 1 PDS",
    startingTech: ["Antimass Deflectors", "Scanlink Drone Network"],
    commodities: 2,
    strategyTip: "Spread sleeper tokens everywhere, then awaken them into PDS networks. Your defensive infrastructure becomes nearly impenetrable. Control the map through zone denial.",
  },
  {
    name: "The Vuil'Raith Cabal",
    shortName: "Vuil'Raith",
    color: "340 70% 35%",
    abilities: [
      "Dimensional Anchors: After you win a space combat, you may purge 1 of the losing player's captured units to gain 1 command token.",
      "The Rift: Whenever 1 of your ships is destroyed during combat, you may capture it instead.",
    ],
    promissoryNote: "Parasitic Oblation — At the start of your turn: Return this card to purge 1 of the Cabal player's captured units. Then gain command tokens equal to that unit's cost.",
    startingUnits: "1 Carrier, 1 Dreadnought, 3 Infantry, 2 Fighters, 1 Space Dock",
    startingTech: ["Self Assembly Routines"],
    commodities: 2,
    strategyTip: "Capture enemy units instead of destroying them—then purge them for command tokens. The Rift means your ships are never truly lost. Fight often to fuel your war machine.",
  },
];
