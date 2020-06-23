export const MasterSkillsList = () => {
    return game.system.template.Actor.templates.common.skills;
}

export const SafeNum = (val) => {
    if(!val) return 0;
    let number = parseInt(val);
    return isNaN(number) ? 0 : number;
}