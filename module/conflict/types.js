export const CONFLICT_TYPES = [
    {
        name: 'Banish/Abjure',
        skill: ['Arcanist', 'Ritualist', 'Nature'],
        ability: 'Will'
    },
    {
        name: 'Capture',
        skill: ['Fighter', 'Hunter', 'Nature'],
        ability: 'Will'
    },
    {
        name: 'Convince',
        skill: ['Persuader', 'Nature'],
        ability: 'Will'
    },
    {
        name: 'Convince Crowd',
        skill: ['Orator', 'Nature'],
        ability: 'Will'
    },
    {
        name: 'Drive Off',
        skill: ['Fighter', 'Nature'],
        ability: 'Health'
    },
    {
        name: 'Kill',
        skill: ['Fighter', 'Nature'],
        ability: 'Health'
    },
    {
        name: 'Pursue/Flee',
        skill: ['Scout', 'Rider', 'Nature'],
        ability: 'Health'
    },
    {
        name: 'Trick/Riddle',
        skill: ['Manipulator', 'Nature'],
        ability: 'Will'
    },
    {
        name: 'Other',
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
