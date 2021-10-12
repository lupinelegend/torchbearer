export const MasterSkillsList = () => {
    return game.system.template.Actor.templates.common.skills;
}

export const SafeNum = (val) => {
    if(!val) return 0;
    let number = parseInt(val);
    return isNaN(number) ? 0 : number;
}

export const Capitalize = (val) => {
    if(!val) return '';
    return val.slice(0, 1).toUpperCase() + val.slice(1);
}

export const CurrentCharacterActorIds = async () => {
    let actorIds = (await game.grind.currentGrind()).actors;
    if (actorIds.length === 0) {
        actorIds = [];
        for (let i = 0; i < game.actors.entities.length; i++) {
            let actor = game.actors.entities[i];
            if (actor.data.type === 'Character') {
                actorIds.push(actor.data._id);
            }
        }
    }
    return actorIds;
};
