export const MasterSkillsList = () => {
    //Extract the list from the first character we see
    const list = [];
    for(let i = 0; i < game.actors._source.length; i++) {
        let char = game.actors._source[i];
        if(char.type === 'Character') {
            if(char.data.skills) {
                for(let skill in char.data.skills) {
                    if(char.data.skills.hasOwnProperty(skill)) {
                        list.push(skill);
                    }
                }
                return list;
            }
        }
    }
    return list;
}