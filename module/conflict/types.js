export const CONFLICT_TYPES = [
    {
        name: 'Negotiate',
        disposition: ['Haggler'],
        attack: ['Haggler'],
        defend: ['Manipulator'],
        feint: ['Manipulator'],
        maneuver: ['Haggler'],
        ability: 'Will'
    },
    {
        name: 'Abjure',
        disposition: ['Lore Master'],
        attack: ['Lore Master'],
        defend: ['Arcanist'],
        feint: ['Lore Master'],
        maneuver: ['Arcanist'],
        ability: 'Will'
    },
    {
        name: 'Banish',
        disposition: ['Theologian'],
        attack: ['Theologian'],
        defend: ['Ritualist'],
        feint: ['Theologian'],
        maneuver: ['Ritualist'],
        ability: 'Will'
    },
    {
        name: 'Bind',
        disposition: ['Theologian'],
        attack: ['Theologian'],
        defend: ['Theologian'],
        feint: ['Lore Master'],
        maneuver: ['Lore Master'],
        ability: 'Health'
    },
    {
        name: 'Ambush',
        disposition: ['Scout'],
        attack: ['Fighter'],
        defend: ['Rider', 'Scout'],
        feint: ['Fighter'],
        maneuver: ['Rider', 'Scout'],
        ability: 'Might'
    },
    {
        name: 'Battle',
        disposition: ['Strategist'],
        attack: ['Commander'],
        defend: ['Strategist'],
        feint: ['Commander'],
        maneuver: ['Strategist'],
        ability: 'Might'
    },
    {
        name: 'Siege',
        disposition: ['Strategist'],
        attack: ['Sapper'],
        defend: ['Strategist'],
        feint: ['Sapper'],
        maneuver: ['Strategist'],
        ability: 'Will'
    },
    {
        name: 'Skirmish',
        disposition: ['Commander'],
        attack: ['Fighter'],
        defend: ['Commander'],
        feint: ['Fighter'],
        maneuver: ['Commander'],
        ability: 'Might'
    },
    {
        name: 'Capture',
        disposition: ['Fighter', 'Hunter'],
        attack: [],
        defend: [],
        feint: [],
        maneuver: [],
        ability: 'Will'
    },
    {
        name: 'Convince',
        disposition: ['Persuader'],
        attack: [],
        defend: [],
        feint: [],
        maneuver: [],
        ability: 'Will'
    },
    {
        name: 'Convince Crowd',
        disposition: ['Orator'],
        attack: [],
        defend: [],
        feint: [],
        maneuver: [],
        ability: 'Will'
    },
    {
        name: 'Drive Off',
        disposition: ['Fighter'],
        attack: [],
        defend: [],
        feint: [],
        maneuver: [],
        ability: 'Health'
    },
    {
        name: 'Kill',
        disposition: ['Fighter'],
        attack: [],
        defend: [],
        feint: [],
        maneuver: [],
        ability: 'Health'
    },
    {
        name: 'Pursue/Flee',
        disposition: ['Scout', 'Rider'],
        attack: [],
        defend: [],
        feint: [],
        maneuver: [],
        ability: 'Health'
    },
    {
        name: 'Trick/Riddle',
        disposition: ['Manipulator'],
        attack: [],
        defend: [],
        feint: [],
        maneuver: [],
        ability: 'Will'
    },
    {
        name: 'Other',
        attack: [],
        defend: [],
        feint: [],
        maneuver: [],
        skill: [],
    }
];

export const ByName = (conflictTypeName) => {
    for(let i = 0; i < CONFLICT_TYPES.length; i++) {
        if(CONFLICT_TYPES[i].name.toLowerCase() === conflictTypeName.toLowerCase()) {
            return CONFLICT_TYPES[i];
        }
    }
    console.log("Couldn't find Conflict Type " + conflictTypeName + ", returning Other");
    return CONFLICT_TYPES[CONFLICT_TYPES.length - 1];
}
