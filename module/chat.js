import { TorchbearerActor } from "./actor/actor.js";

export const fateForLuck = function(ev) {
  // Determine how many 6's were rolled
  let rollsObj = ev.currentTarget.parentElement.parentElement.children[0].children[2].firstElementChild.firstElementChild.firstElementChild.children[0].children;
  let rollsArray = Object.keys(rollsObj);
  let rerolls = 0;
  rollsArray.forEach(element => {
    if (rollsObj[element].innerText === '6') {
      rerolls++;
    }
  });
  
  
}