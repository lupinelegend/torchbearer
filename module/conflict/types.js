export const CONFLICT_TYPES = [
    {
        name: 'Negotiate',
        disposition: ['Haggler', 'Nature'],
        attack: ['Haggler'],
        defend: ['Manipulator'],
        feint: ['Manipulator'],
        maneuver: ['Haggler'],
        ability: 'Will'
    },
    {
        name: 'Abjure',
        disposition: ['Lore Master', 'Nature'],
        attack: ['Lore Master'],
        defend: ['Arcanist'],
        feint: ['Lore Master'],
        maneuver: ['Arcanist'],
        ability: 'Will'
    },
    {
        name: 'Banish',
        disposition: ['Theologian', 'Nature'],
        attack: ['Theologian'],
        defend: ['Ritualist'],
        feint: ['Theologian'],
        maneuver: ['Ritualist'],
        ability: 'Will'
    },
    {
        name: 'Bind',
        disposition: ['Theologian', 'Nature'],
        attack: ['Theologian'],
        defend: ['Theologian'],
        feint: ['Lore Master'],
        maneuver: ['Lore Master'],
        ability: 'Health'
    },
    {
        name: 'Ambush',
        disposition: ['Scout', 'Nature'],
        attack: ['Fighter'],
        defend: ['Rider', 'Scout'],
        feint: ['Fighter'],
        maneuver: ['Rider', 'Scout'],
        ability: 'Might'
    },
    {
        name: 'Battle',
        disposition: ['Strategist', 'Nature'],
        attack: ['Commander'],
        defend: ['Strategist'],
        feint: ['Commander'],
        maneuver: ['Strategist'],
        ability: 'Might'
    },
    {
        name: 'Siege',
        disposition: ['Strategist', 'Nature'],
        attack: ['Sapper'],
        defend: ['Strategist'],
        feint: ['Sapper'],
        maneuver: ['Strategist'],
        ability: 'Will'
    },
    {
        name: 'Skirmish',
        disposition: ['Commander', 'Nature'],
        attack: ['Fighter'],
        defend: ['Commander'],
        feint: ['Fighter'],
        maneuver: ['Commander'],
        ability: 'Might'
    },
    {
        name: 'Capture',
        disposition: ['Fighter', 'Hunter', 'Nature'],
        attack: ['Fighter'],
        defend: ['Hunter'],
        feint: ['Hunter'],
        maneuver: ['Fighter'],
        ability: 'Will'
    },
    {
        name: 'Convince',
        disposition: ['Persuader', 'Nature'],
        attack: ['Persuader'],
        defend: ['Persuader'],
        feint: ['Manipulator'],
        maneuver: ['Manipulator'],
        ability: 'Will'
    },
    {
        name: 'Convince Crowd',
        disposition: ['Orator', 'Nature'],
        attack: ['Orator'],
        defend: ['Orator'],
        feint: ['Manipulator'],
        maneuver: ['Manipulator'],
        ability: 'Will'
    },
    {
        name: 'Drive Off',
        disposition: ['Fighter', 'Nature'],
        attack: ['Fighter'],
        defend: ['Will'],
        feint: ['Fighter'],
        maneuver: ['Will'],
        ability: 'Health'
    },
    {
        name: 'Kill',
        disposition: ['Fighter', 'Nature'],
        attack: ['Fighter'],
        defend: ['Health'],
        feint: ['Fighter'],
        maneuver: ['Health'],
        ability: 'Health'
    },
    {
        name: 'Pursue/Flee',
        disposition: ['Scout', 'Rider', 'Nature'],
        attack: ['Scout', 'Rider'],
        defend: ['Health'],
        feint: ['Scout', 'Rider'],
        maneuver: ['Health'],
        ability: 'Health'
    },
    {
        name: 'Trick/Riddle',
        disposition: ['Manipulator', 'Nature'],
        attack: ['Manipulator'],
        defend: ['Lore Master'],
        feint: ['Manipulator'],
        maneuver: ['Lore Master'],
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
