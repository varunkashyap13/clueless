const adjacencyList = new Map();
// regular board locations
adjacencyList.set('study', new Set(['hallway1','hallway3','kitchen']));
adjacencyList.set('hallway1', new Set(['study','hall']));
adjacencyList.set('hall', new Set(['hallway1','hallway2','hallway4']));
adjacencyList.set('hallway2', new Set(['hall','lounge']));
adjacencyList.set('lounge', new Set(['hallway2','hallway5','conservatory']));
adjacencyList.set('hallway3', new Set(['study','library']));
adjacencyList.set('hallway4', new Set(['hall','billard room']));
adjacencyList.set('hallway5', new Set(['lounge','dining room']));
adjacencyList.set('library', new Set(['hallway3','hallway6','hallway8']));
adjacencyList.set('hallway6', new Set(['library','billard room']));
adjacencyList.set('billard room', new Set(['hallway4','hallway6','hallway7','hallway9']));
adjacencyList.set('hallway7', new Set(['billard room','dining room']));
adjacencyList.set('dining room', new Set(['hallway5','hallway7','hallway10']));
adjacencyList.set('hallway8', new Set(['library','conservatory']));
adjacencyList.set('hallway9', new Set(['billard room','ballroom']));
adjacencyList.set('hallway10', new Set(['dining room','kitchen']));
adjacencyList.set('conservatory', new Set(['lounge','hallway8','hallway11']));
adjacencyList.set('hallway11', new Set(['conservatory','ballroom']));
adjacencyList.set('ballroom', new Set(['hallway9','hallway11','hallway12']));
adjacencyList.set('hallway12', new Set(['ballroom','kitchen']));
adjacencyList.set('kitchen', new Set(['study','hallway10','hallway12']));

// home square/starting locations
adjacencyList.set('Miss Scarlet Home', new Set(['hallway2']));
adjacencyList.set('Col. Mustard Home', new Set(['hallway5']));
adjacencyList.set('Mrs. White Home', new Set(['hallway12']));
adjacencyList.set('Mr. Green Home', new Set(['hallway11']));
adjacencyList.set('Mrs. Peacock Home', new Set(['hallway8']));
adjacencyList.set('Prof. Plum Home', new Set(['hallway3']));


module.exports = adjacencyList
