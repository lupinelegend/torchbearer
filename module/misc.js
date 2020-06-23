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