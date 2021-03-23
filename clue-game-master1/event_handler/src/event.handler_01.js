const pubsub = require('../common/redis/pubsub');
const logger = require('../common/logging/logger');
const cache = require('../common/redis/cache');
const gameboard = require('./gameboard') //to be moved?
const inboundQueue = 'events:inbound';
const outboundQueue = 'events:outbound';

var clientPlacement = {}

// create new player when create game and join game is clicked
const newPlayer = (message) => {
    var ev = {
        "playerConnection": "", // string
        "location": "", // string
        "cards": [], // string array
        "readyToPlay": false,
        "accusationFailure": false, // boolean
        "canSuggest" : false
    }
    return ev;
};
// create game
const newGame = (message) => {
    var ev = {
        "gameSessionID": "",         //string
        "gameState": "",             // enum - 'Setup","Ready", "In-Progress", or "Complete"
        "activePlayer": {            // Player who is disproving suggestion will be considered active player
            "character": "",         //string - playerOrderIncrement will be tracked on server side
            "playerTurnDetails": {
                "possibleMoves": [],       // boolean
                "canSuggest": false,    // boolean
                "accusation": {
                    "success": false        //boolean
                }
            }
        },
        "suggestion" : {
        },        
        "disproval": {
        },
        "murderingDetails": {
        },
        "party": {
            "characters" : {
                "Miss Scarlet" : "",
                "Col. Mustard" : "",
                "Mrs. White" : "",
                "Mr. Green" : "",
                "Mrs. Peacock" : "",
                "Prof. Plum" : ""
            },
            "players": {
            }
        }
    };

    var tmp = JSON.parse(message);
    ev.gameSessionID = tmp.gameSessionID;
    const fakeMsg = {"playerId" : tmp.playerId};
    ev.party.players[tmp.playerId] = newPlayer(fakeMsg);
    ev.gameState = "Setup";

    cache.setKey("games",tmp.gameSessionID,JSON.stringify(ev)).then((setSuccess) => {logger.info("Set Success: " + setSuccess)});
    
    return ev;
};

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

const dealCards = (session) => {
    var rooms = ["study","hall", "lounge","library", "billiard room", "dining room", "conservatory","ballroom", "kitchen"];
    var weapons = ["candlestick", "dagger", "lead pipe", "revolver", "rope", "wrench"];
    var characters =['Miss Scarlet', 'Mr. Green', 'Col. Mustard', 'Prof. Plum', 'Mrs. Peacock', 'Mrs. White'];
    
    
    session.murderingDetails = {
        "room" : rooms.splice(getRandomInt(rooms.length), 1)[0],
        "weapon" : weapons.splice(getRandomInt(weapons.length), 1)[0],
        "character" : characters.splice(getRandomInt(characters.length), 1)[0]
    }

    var deck = rooms.concat(weapons, characters);
    const playersArr = Object.keys(session.party.players);
    var increment = 0
    while (deck.length>0) {
        session.party.players[(playersArr[increment])].cards.push(deck.splice(getRandomInt(deck.length),1)[0]);
        increment = (increment + 1) % playersArr.length;      
    }
    return session;
}

const createDummyPlayers = (session) => {
    const numPlayers = Object.keys(session.party.players).length
    for (i = 0; i < (6-numPlayers); i++) {
        const dummyId = "dummy" + i;
        const newPlayer = {
            "playerConnection": "", // string
            "location": "", // string
            "cards": [], // string array
            "readyToPlay": true,
            "accusationFailure": false // boolean
        }
        session.party.players[dummyId] = newPlayer;
        const charactersArr = Object.keys(session.party.characters);
        var firstEmpty = 0;
        while (session.party.characters[(charactersArr[firstEmpty])] != "") {
            firstEmpty++;
        }
        session.party.characters[charactersArr[firstEmpty]] = dummyId;
        session.party.players[dummyId].location = (charactersArr[firstEmpty]) + " Home";
        };
    return session
};

const joinGame = (message) => {
    return new Promise((resolve, reject) => { 
        var tmp = JSON.parse(message);
        logger.info('gamesessionID'+tmp.gameSessionID);
        
        cache.getKey("games",tmp.gameSessionID).then((gameState) => {
            gameState = JSON.parse(gameState);
            // const newId = createNewId(gameState);
            // logger.info("Join Game: " + newId)
            gameState.party.players[tmp.playerId] = newPlayer(message);
            logger.info("Gamestate inside joinGame: " + JSON.stringify(gameState));
            cache.setKey("games",tmp.gameSessionID,JSON.stringify(gameState)).then(() => {resolve(gameState)});
        });
    });
};

const setCharacter = (gameState,params) => {
    if (gameState.party.characters[params.character] == "") {
        const prevCharacter = getCharacterWithPlayer(gameState,params.playerId);
        if (prevCharacter != "" && prevCharacter != null) {
            gameState.party.characters[prevCharacter] = "";
        }
        gameState.party.characters[params.character] = params.playerId; //CHANGE ME FOR IMPROVEMENT
        gameState.party.players[params.playerId].location = (params.character + " Home");
    }
    return gameState;
}

const getCharacterWithPlayer = (gameState,playerId) => {
    for (character in gameState.party.characters) {
        if (gameState.party.characters[character] == playerId) { // CHANGEME - for improvement
            return character;
        };
    }
}
// return player corresponding with character
const  getPlayerWithCharacter = (gameState,character) => {
    const player = gameState.party.characters[character]; //CHANGE ME -- for improvement
    return player;
}

const getNextCharacter = (character) => {
    order = ["Miss Scarlet","Col. Mustard","Mrs. White", "Mr. Green", "Mrs. Peacock", "Prof. Plum"];
    const currCharacterIndex = order.indexOf(character);
    nextCharacterIndex = (currCharacterIndex + 1) % 6;
    return order[nextCharacterIndex]
}

const validTurn = (gameState, character) => {
    // make sure that the next character is a player
    // make sure that the next player hasn't accused unless it's suggest mode
    // const nextCharacter = getNextCharacter(character);
    const playerId = getPlayerWithCharacter(gameState,character);
    var validTurn = false;
    if (!playerId.includes("dummy")) {
        if (!gameState.party.players[playerId].accusationFailure || (Object.keys(gameState.suggestion).length != 0)) {
            validTurn = true;
        };
    };
    return validTurn;
}

//THIS FUNCTION NEEDS FIXING
const getNextPlayer = (session) => {
    var nextCharacter = "";
    if (session.activePlayer.character == "") {
        nextCharacter = "Miss Scarlet";
    } else {
        const currentCharacter = session.activePlayer.character;
        nextCharacter = getNextCharacter(currentCharacter);
    }    
    while (!validTurn(session, nextCharacter)) {
        nextCharacter = getNextCharacter(nextCharacter);
    };
    nextPlayerId = getPlayerWithCharacter(session,nextCharacter);
    return nextPlayerId;
};

const arePlayersReady = (gameState) => {
    if (Object.keys(gameState.party.players).length < 2) {
        logger.info("returning false for arePlayersReady, not enough players");
        return false;
    }
    for (player in gameState.party.players) {
        if (!gameState.party.players[player].readyToPlay) {
            logger.info("returning false for arePlayersReady, one or more players not ready");
            return false;
        }
    }
    return true;
}

const isHallway = (location) => {
    return (location.includes("hallway") ? true:false);
}

const isHallwayOccupied = (gameState, location) => {
    const playersIdArray = Object.keys(gameState.party.players);
    var isOccupied = false;
    // logger.info("isHallwayOccupied: playersIDArray = " + JSON.stringify(playersIdArray))
    for (const playerId of playersIdArray) {
        // logger.info("isHallwayOccupied: playersID = " + playerId + " string version: " + JSON.stringify(playerId))
        if (gameState.party.players[playerId].location == location){
            isOccupied = true;
        }
    }
    return isOccupied;
}

const getMoveableLocations = (gameState, playerId) => {     //FIXME
    const playerObj = gameState.party.players[playerId];
    const currLocation = playerObj.location;
    const adjLocations = gameboard.get(currLocation);
    logger.info("In getMoveableLocations: adj locations are ... " + JSON.stringify(adjLocations))
    var moveableLocations = [];
    for (const location of adjLocations) {
        if (isHallway(location)){
            logger.info("In getMoveableLocations: adj locations does include 'hallway'")
            if (!isHallwayOccupied(gameState, location)) {
                logger.info("In getMoveableLocations: includes hallway and hallway is not occupied'")
                moveableLocations.push(location);
            } else {
                logger.info("In getMoveableLocations: includes hallway and hallway is occupied'")
            };
        } else {
            logger.info("In getMoveableLocations: adj locations does not include 'hallway'")
            moveableLocations.push(location);
        }
    };
    return moveableLocations
}

const moveCharacter = (gameState,suggestionParams) => { //CHANGE ME -- for improvement
    const newLocation = suggestionParams.room; 
    const character2move = suggestionParams.character;
    const playerId = getPlayerWithCharacter(gameState,character2move);
    logger.info("move character ID: " + playerId)
    logger.info("move character location:  " + newLocation)
    const moveParams = {
        "location":newLocation,
        "playerId":playerId
    };
    gameState = movePlayer(gameState,moveParams);
    logger.info("move character gameState: " + JSON.stringify(gameState))
    return gameState; //maybe should set directly 
}

const isActivePlayer = (gameState, playerId) => {
    return ((gameState.party.characters[gameState.activePlayer.character] == playerId) ? true:false);
}

const movePlayer = (gameState,moveParams) => {
    if (moveParams.location != gameState.party.players[moveParams.playerId].location) {
        gameState.party.players[moveParams.playerId].location = moveParams.location; // CHANGE ME FOR IMPROVEMENT
        if (!isHallway(gameState.party.players[moveParams.playerId].location)) {
            gameState.party.players[moveParams.playerId].canSuggest = true;
            if (isActivePlayer(gameState, moveParams.playerId)) {
                gameState.activePlayer.playerTurnDetails.canSuggest = true;
            }
        } else {
            gameState.party.players[moveParams.playerId].canSuggest = false;
            if (isActivePlayer(gameState, moveParams.playerId)) {
                gameState.activePlayer.playerTurnDetails.canSuggest = false;
            }
        }
    }
    return gameState;
}

// FIX ME -- should have a check if moved by another player to the room, 
//           can suggest in that room, otherwise cannot suggest until after move 
const updateActivePlayer = (gameState, playerId) => {
    const playerCharacter = getCharacterWithPlayer(gameState,playerId);
    gameState.activePlayer.character = playerCharacter; 
    var {possibleMoves, canSuggest, accusation} = gameState.activePlayer.playerTurnDetails;
    possibleMoves = [];
    canSuggest = gameState.party.players[playerId].canSuggest;
    // logger.info("Gamestate suggestion in updateActivePlayer: " + JSON.stringify(gameState.suggestion));
    logger.info("Gamestate suggestion playerId: " + gameState.suggestion.playerId)
    logger.info("playerId passed in: " + playerId)
    if (Object.keys(gameState.suggestion).length == 0) {
        logger.info("no suggestion updating of active player, before a suggestion is made")
        possibleMoves = getMoveableLocations(gameState, playerId);
        // canSuggest = ((isHallway(gameState.party.players[playerId].location) || gameState.party.players[playerId].location.includes("Home") ) ? false : true);
        gameState.disproval = {}; // reset any disproval params after suggester reviews and next player's turn.
    } else if (gameState.suggestion.playerId == playerId) {
        logger.info("updating to go back to suggester when disproved or cycled around all players");
        gameState.suggestion = {};
        if (JSON.stringify(gameState.disproval) == "{}") {
            gameState.disproval.card = "";
        }
    } else {
        logger.info("update active player when suggestion exists and not yet disproved")
        gameState.disproval = {};
    }
    gameState.activePlayer.playerTurnDetails = {possibleMoves, canSuggest, accusation};
    return gameState;
}

const getNumberofPlayers = (gameState) => {
    const nPlayers = Object.keys(gameState.party.players).length;
    return nPlayers;
}

const createNewId = (gameState) => {
    var nPlayers = getNumberofPlayers(gameState);
    logger.info('number of players: '+nPlayers);
    const nextId = "Player" + nPlayers;
    logger.info('Next Id: ' + nextId);
    return nextId
}

const addSuggestion = (message) => {
    return new Promise((resolve, reject) => {       
        var JSONmsg = JSON.parse(message);
        cache.getKey("games",JSONmsg.gameSessionID).then((gameState) => {
            gameState = JSON.parse(gameState);
            gameState.suggestion = {
                "playerId" : JSONmsg.playerId,
                "params" : JSONmsg.action.params
            }
            gameState.party.players[JSONmsg.playerId].canSuggest = false;
            logger.info('Can Suggest set to false for playerId: ' + JSONmsg.playerId)
            var nextPlayer = getNextPlayer(gameState);
            gameState = updateActivePlayer(gameState,nextPlayer);
            gameState = moveCharacter(gameState,JSONmsg.action.params);
            // logger.info("Gamestate inside addSuggestion: " + JSON.stringify(gameState));
            cache.setKey("games",JSONmsg.gameSessionID,JSON.stringify(gameState)).then(() => {resolve(gameState)});
        });
    });
};

// used for event -- choosing a character
const updateCharacter = (message) => {
    return new Promise((resolve,reject) => {
        var JSONmsg = JSON.parse(message);
        cache.getKey("games",JSONmsg.gameSessionID).then((gameState) => {
            session = JSON.parse(gameState);
            var params = {
                "playerId" : JSONmsg.playerId,   
                "character" : JSONmsg.action.params.character       
            }
            session = setCharacter(session,params);
            cache.setKey("games",JSONmsg.gameSessionID,JSON.stringify(session)).then(() => {resolve(session)});
         });
     });
}


const updateReadyState = (message) => {
    return new Promise((resolve,reject) => {
       var JSONmsg = JSON.parse(message);
       cache.getKey("games",JSONmsg.gameSessionID).then((session) => {
           session = JSON.parse(session);
           var player = JSONmsg.playerId;
           logger.info("updateReadyState: " + JSONmsg.action.params.ready);  
           
           //ADD FUNCTIONALITY TO PROTECT FROM PREMATURE READIES WITHOUT A CHARACTER
           session.party.players[player].readyToPlay = JSONmsg.action.params.ready;
           
           logger.info("updateReadyState: " + JSON.stringify(session));  
           if (arePlayersReady(session)) {
               session.gameState ="In-Progress"
               // do we want to wrap this 
               session = dealCards(session);
               session = createDummyPlayers(session);
               var firstPlayer = getNextPlayer(session);
               session = updateActivePlayer(session,firstPlayer);
           }
            cache.setKey("games",JSONmsg.gameSessionID,JSON.stringify(session)).then(() => {resolve(session)});
        });
    });
};

//end current player's turn
const endTurn = (message) => {
    return new Promise((resolve, reject) => { 
        var JSONmsg = JSON.parse(message);
        cache.getKey("games", JSONmsg.gameSessionID).then((session) => {
            session = JSON.parse(session);
            var nextPlayer = getNextPlayer(session);
            session = updateActivePlayer(session,nextPlayer);
            logger.info("current increment and active player: " + nextPlayer);
            cache.setKey("games", JSONmsg.gameSessionID, JSON.stringify(session)).then(() => {resolve(session)});
        });
    });
};
// move player's character
const playerMoves = (message) => {
    return new Promise((resolve, reject) => { 
        var JSONmsg = JSON.parse(message);
        cache.getKey("games", JSONmsg.gameSessionID).then((session) => {
            session = JSON.parse(session);
            const moveParams = {
                "playerId" : JSONmsg.playerId,
                "location" : JSONmsg.action.params.targetLoc
            }
            session = movePlayer(session, moveParams);
            // if now moved to a room, change can suggest to true
            session.activePlayer.playerTurnDetails.canSuggest = (!isHallway(session.party.players[JSONmsg.playerId].location));
            // do not permit another move in 1 turn.
            session.activePlayer.playerTurnDetails.possibleMoves = [];
            cache.setKey("games", JSONmsg.gameSessionID, JSON.stringify(session)).then(() => {resolve(session)});
        });
    });
};

const checkDisprove = (suggestion,disprovalCard) => {
    if (suggestion.params.room == disprovalCard || 
        suggestion.params.weapon == disprovalCard ||
        suggestion.params.character == disprovalCard) {
            return true
    } else if (disprovalCard == "") {
        return true
    } return false
}

const playerDisproves = (message) => {
    return new Promise((resolve, reject) => { 
        var JSONmsg = JSON.parse(message);
        cache.getKey("games", JSONmsg.gameSessionID).then((session) => {
            session = JSON.parse(session);
            //IF SUCCESSFUL DISPROVAL SET ACTIVE PLAYER AS SUGGESTOR
            if (checkDisprove(session.suggestion,JSONmsg.action.params.card)) {
                session.disproval = {
                    "playerId": JSONmsg.playerId,
                    "card" : JSONmsg.action.params.card
                }
                // logger.info("in player disprove: " + JSON.stringify(session.activePlayer));
                session = updateActivePlayer(session,session.suggestion.playerId);
                logger.info("in player disprove: " + JSON.stringify(session.activePlayer));
            } else { //IF UNSUCCESFUL SET ACTIVE PLAYER TO NEXT PLAYER
                const nextPlayer = getNextPlayer(session);
                session = updateActivePlayer(session,nextPlayer)
            }
            cache.setKey("games", JSONmsg.gameSessionID, JSON.stringify(session)).then(() => {resolve(session)});
        });
    });
};

const accusationIsCorrect = (murkDetails, accusation) => {
    const {room: actRoom, weapon: actWeap, character: actChar} = murkDetails
    const {room: accuseRoom, weapon: accuseWeap, character: accuseChar} = accusation
    logger.info("accused:" + accuseRoom + accuseWeap + accuseChar + "actual: " + actRoom + actWeap + actChar)
    if (actRoom == accuseRoom && actWeap == accuseWeap && actChar == accuseChar) {
        logger.info("accusation is correct")
        return true
    }
    logger.info("accusation incorrect")
    return false
}

const playerAccuses = (message) => {
    return new Promise((resolve, reject) => {
        var JSONmsg = JSON.parse(message);
        cache.getKey("games", JSONmsg.gameSessionID).then((session) => {
            session = JSON.parse(session);
            if (accusationIsCorrect(session.murderingDetails, JSONmsg.action.params)) {
                // SET GAMESTATE TO COMPLETED AND END
                session.gameState = "Completed"
                session.activePlayer.playerTurnDetails.accusation.success = true
            } else {
                // SET PLAYER ACCUSATION FAILURE TO TRUE AND GET NEXT PLAYER
                session.party.players[(session.party.characters[session.activePlayer.character])].accusationFailure = true;
                const nextPlayer = getNextPlayer(session);
                session = updateActivePlayer(session,nextPlayer)
            }
            cache.setKey("games", JSONmsg.gameSessionID, JSON.stringify(session)).then(() => {resolve(session)});
        });
    })
}


var handleAllocation = (message) => {
    var JSONmsg = JSON.parse(message);
    // var userId = msg.playerId;
    logger.info("Processing the event : " + JSON.stringify(JSONmsg));

    // roomsAllocation[msg.room] = userId;
    if (JSONmsg.action.type == "createGame") {
        const gameState = newGame(message);
        logger.info("Publishing message to " + outboundQueue + " : " + JSON.stringify(gameState));
        pubsub.pub(outboundQueue, JSON.stringify(gameState));
    } else if (JSONmsg.action.type == "joinGame") {
        joinGame(message).then((gameState) => {
            cache.getKey("games",JSONmsg.gameSessionID).then((tmpgameState) => {
                logger.info("Up to date gamestate: " + tmpgameState)
                pubsub.pub(outboundQueue, JSON.stringify(gameState));
            })
        });
    } else if (JSONmsg.action.type == "suggestion") {
        logger.info("Suggestion made: " + JSON.stringify(JSONmsg))
        addSuggestion(message).then(()=> {
            cache.getKey("games", JSONmsg.gameSessionID).then(gameState=> {
                pubsub.pub(outboundQueue, gameState)
            })
        })
    } else if (JSONmsg.action.type == "readyToPlay") {
        updateReadyState(message).then(() => {
            cache.getKey("games", JSONmsg.gameSessionID).then(gameState=> {
                pubsub.pub(outboundQueue, gameState)
            })
        })
    } else if (JSONmsg.action.type == "chooseCharacter") {
        updateCharacter(message).then(() => {
            cache.getKey("games", JSONmsg.gameSessionID).then(gameState=> {
                pubsub.pub(outboundQueue, gameState)
            })
        })
    } else if (JSONmsg.action.type == "endTurn") {
        endTurn(message).then(() => { 
            cache.getKey("games", JSONmsg.gameSessionID).then((gameState) => {
                pubsub.pub(outboundQueue, gameState);
            })
        })
    } else if (JSONmsg.action.type == "move") {
        playerMoves(message).then(() => {
            cache.getKey("games", JSONmsg.gameSessionID).then((gameState) => {
                pubsub.pub(outboundQueue, gameState);
            })
        })
    } else if (JSONmsg.action.type == "disproveSuggestion") {
        playerDisproves(message).then(() => {
            cache.getKey("games", JSONmsg.gameSessionID).then((gameState) => {
                pubsub.pub(outboundQueue, gameState);
            })
        })
    } else if (JSONmsg.action.type == "accusation") {
        logger.info("Suggestion made: " + JSON.stringify(JSONmsg))
        playerAccuses(message).then(()=> {
            cache.getKey("games", JSONmsg.gameSessionID).then(gameState=> {
                pubsub.pub(outboundQueue, gameState)
            })
        })
    }
};

pubsub.subscribeAndProcess(inboundQueue, function (channel, message) {
    logger.info("Inbound message received : " + message);
    handleAllocation(message);
});





























