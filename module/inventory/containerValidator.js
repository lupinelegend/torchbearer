function Dag() {
    if (!(this instanceof Dag)) {
        return new Dag();
    }
    this._rEdges = {};
}

Dag.prototype.findCycle = function findCycle(verticle) {
    var self = this;
    function find(start) {
        if (!self._rEdges[start]) { return false; }
        for (var i = 0; i < self._rEdges[start].length; i++) {
            var parent = self._rEdges[start][i];
            if (parent === verticle || find(parent)) {
                return true;
            }
        }
        return false;
    }

    return find(verticle);
};

Dag.prototype.addEdge = function addEdge(from, to) {
    if (!this._rEdges[to]) {
        this._rEdges[to] = [];
    }

    this._rEdges[to].push(from);

    if (this.findCycle(from)) {
        throw new Error('Cycle found: ' + from + ' -> ' + to);
    }
};

const validateOnce = (inventory) => {
    const dag = new Dag();
    for(const area in inventory) {
        if(inventory.hasOwnProperty(area)) {
            for(let i = 0; i < inventory[area].slots.length; i++) {
                const item = inventory[area].slots[i];
                try {
                    dag.addEdge(item._id, area);
                } catch (containerError) {
                    console.log(containerError);
                    inventory["On Ground"].slots.push(item);
                    inventory[area].slots.splice(i, 1);
                    return false;
                }
            }
        }
    }
    return true;
};

export function validateContainers(inventory) {
    let validated = false;
    let attempts = 0;
    while(!validated && attempts < 100) {
        validated = validateOnce(inventory);
        attempts += 1;
    }
    if(!validated) {
        console.error(`Couldn't validate containers after ${attempts} tries`);
    }
}