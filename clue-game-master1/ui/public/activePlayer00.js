// TODOS:
// display who is active player
// display any accusations
// display notifications
// stop actions after someone won -- hide buttons, show cards

// Nice to have: message of which player is currently attempting to disprove

var socket = io('http://localhost:13000/', {
    transports: ['websocket']
});
var IDincr = 0;
var gameStateObj = {};
var moveParams = {
    "currentLoc": "",
    "targetLoc" : ""
};
var suggestionParams = {}

const getMyId = () => {
    return socket.id;
}

const getMyGame = () => {
    return "B1";
}

const joinGame = () => {
    message = {
        "gameSessionID": getMyGame(),
        "playerId": getMyId(),
        "action": {
        "type": "joinGame",
        "params": {}
        }
    }
    return message;
};

const createGame = () => {
    message = {
        "gameSessionID" : getMyGame(),
        "playerId" : getMyId(),
        "action" : {
            "type" : "createGame"
        }
    };
    return message;
};

const makeMurderDetails = (type, room, weap, susp) => {
    message = {
        "gameSessionID": getMyGame(),
        "playerId": getMyId(),
        "action": {
            "type": type,
            "params" : {
                "room" : room,
                "weapon" : weap,
                "character" : susp
            }
        }
    }
    return message
}

let selectedMoveLocationElement = document.querySelector('#selectedMoveLocation')

const setMoveSelectionElement = (locationText) => {
    selectedMoveLocationElement.textContent = locationText;
}

let confirmMoveButton = document.querySelector('#confirmMove');

const setMoveParams = (target) => {
    if (gameStateObj.activePlayer.playerTurnDetails.possibleMoves.includes(target)) {
        moveParams.currentLoc = gameStateObj.party.players[(gameStateObj.party.characters[gameStateObj.activePlayer.character])].location;
        moveParams.targetLoc = target;
        confirmMoveButton.disabled = false;
        setMoveSelectionElement(target); 
    }   
}

const readyToPlay = () => {
    message = {
        "gameSessionID" : getMyGame(),
        "playerId" : getMyId(),
        "action" : {
            "type" : "readyToPlay",
            "params" : {
                "ready" : true
            }
        }
    };
    return message;
};

const chooseCharacter= (character) => {
    message = {
        "gameSessionID": getMyGame(),
        "playerId": getMyId(),
        "action": {
            "type": "chooseCharacter",
            "params": {
                "character" : character
            }
         }
    }
    return message;
};

// ADD CHECK FOR WHETHER A PLAYER CAN DISPROVE
const disproveSuggestionMessage = (disprovalCard) => {
    disproval = {
        "gameSessionID" : getMyGame(),
        "playerId" : getMyId(),
        "action" : {
            "type" : "disproveSuggestion",
            "params" : {
                "card" : disprovalCard
            }
        }
    }
    return disproval
}

const playerMove = () => {
    message = {
        "gameSessionID": getMyGame(),  //dummy ID
        "playerId": getMyId(),  // replace with player session id
        "action": {
            "type": "move",
            "params": moveParams
        }
    }
    return message;
};

const endTurn = () => {
    message = {
        "gameSessionID": getMyGame(),  //dummy ID
        "playerId": getMyId(),  // replace with player session id
        "action": {
            "type": "endTurn",
            "params": {}
        }
    }
    return message;
};

const displayCards = () => {
    if (JSON.stringify(gameStateObj) != "{}") {
        const myCards = gameStateObj.party.players[getMyId()].cards; 
        var cardList = document.getElementById('card-select');
        cardList.options.length = 1;
        for (i = 0; i < myCards.length; i++) {
            cardList.insertAdjacentHTML('beforeend', '<option value="' + myCards[i] + '">' + myCards[i] + '</option>');
        }
        cardList.setAttribute("size",myCards.length)

        // temp = gameStateObj.party.players[(gameStateObj.party.characters[gameStateObj.activePlayer.character])].location;
        var cardOptions = cardList.getElementsByTagName("option");
        if (isSuggestion(JSON.stringify(gameStateObj.suggestion))) {
            const suggestionArr = Object.values(gameStateObj.suggestion.params)
            for (var i = 0; i < cardOptions.length; i++) {
                if (isActivePlayer()) {
                    console.log("made it into card disabler")
                    console.log("cardOptions.value: " + cardOptions[i].value)
                    console.log("includes out: " + suggestionArr.includes(cardOptions[i].value))
                    if (!suggestionArr.includes(cardOptions[i].value)) {
                        console.log("found card")
                        cardOptions[i].disabled = true;
                    } else {
                        console.log("couldn't find card")
                        cardOptions[i].disabled = false;
                    }
                } else {
                    console.log("cards enabled")
                    cardOptions[i].disabled = false;
                }
            }
        }
    }
}
const isActivePlayer = () => {
    return (getMyId() == gameStateObj.party.characters[gameStateObj.activePlayer.character] ? true : false)
}

const canMove = () => {
    return (gameStateObj.activePlayer.playerTurnDetails.possibleMoves.length == 0 ? false : true)
}

const canSuggest = () => {
    return (gameStateObj.activePlayer.playerTurnDetails.canSuggest ? true : false)
}

const canDisprove = () => {
    const {room, weapon, character} = gameStateObj.suggestion.params;
    const availableCards = gameStateObj.party.players[getMyId()].cards;
    return ((availableCards.includes(room) || availableCards.includes(weapon) || availableCards.includes(character)) ? true : false)
}

const getGameStateObj = () => {
    return gameStateObj;
}

let suggestionPaneElement = document.querySelector('#SuggestionPane')

const hideSuggestionPane = () => {
    suggestionPaneElement.style.display = "none";
}

const showSuggestionPane = (suggestionType) => {
    const roomSelector = document.getElementById("room-select");
    temp = gameStateObj.party.players[(gameStateObj.party.characters[gameStateObj.activePlayer.character])].location;
    var roomOptions = document.getElementById("room-select").getElementsByTagName("option");
    for (var i = 0; i < roomOptions.length; i++) {
        if (suggestionType == "suggest") {
            if (roomOptions[i].value != temp) {
                roomOptions[i].disabled = true;
            } else {
                roomOptions[i].disabled = false;
                roomSelector.selectedIndex = i;
            }
            showSuggestionButton();
        } else {
            roomOptions[i].disabled = false;
            showAccusationButton();
        }
    }
    suggestionPaneElement.style.display = "block";
    hidePlayerTurnButtons();
}

let suggestionButtonElement = document.querySelector('#sendSuggestion')
let accusationButtonElement = document.querySelector('#sendAccusation')

let movePaneElement = document.querySelector('#MovePane')
let moveTurnButton = document.querySelector('#MoveTurn')

let bMakeSuggestion = document.querySelector('#makeSuggestion');
let bMakeAccusation = document.querySelector('#makeAccusation');
let bSendSuggestion = document.querySelector('#sendSuggestion');
let bSendAccusation = document.querySelector('#sendAccusation');
let disproveButtonsPane = document.querySelector('#disproveButtons')

const showSuggestionButton = () => { 
    bSendSuggestion.style.visibility  = "visible";
    bSendAccusation.style.visibility = "hidden";
}

const showDisproveButtons = () => {
    disproveButtonsPane.style.display = "block";
    if (canDisprove()) {
        cantDisprove.disabled = true;
        disproveSuggestion.disabled = false;
    } else {
        cantDisprove.disabled = false;
        disproveSuggestion.disabled = true;
    }  
}

const hideDisproveButtons = () => {
    disproveButtonsPane.style.display = "none"
}

const showAccusationButton = () => {
    // if (suggestionPaneElement.style.display == "block") {   
        bSendSuggestion.style.visibility  = "hidden";
        bSendAccusation.style.visibility = "visible";
    // }
}

// const hidePlayerTurnElement = () => {
//     playerTurnPaneElement.style.display = "none";
// }

const displayMovableLocations = () => {
    const moveableLocationElement = document.querySelector("#movableLocations");
    moveableLocationElement.textContent = gameStateObj.activePlayer.playerTurnDetails.possibleMoves;
}

const showMovePane = () => {
    movePaneElement.style.display = "block";
    confirmMoveButton.disabled = true;
    displayMovableLocations();
    hidePlayerTurnButtons();
}

const hideMovePane = () => {
    movePaneElement.style.display = "none";
}

// let playerTurnPaneElement = document.querySelector("#PlayerTurnPane");
let playerTurnButtons = document.querySelector('#PlayerTurnButtons');
let lobbyPane = document.querySelector('#LobbyFunctionality');
let reviewDisprovePaneElement = document.querySelector("#ReviewDisprovePane");
let confirmDisprovalRecieptButton = document.querySelector('#confirmDisprovalReciept')
let disproveSuggestion = document.querySelector('#disproveSuggestion');
let cantDisprove = document.querySelector('#cantDisprove');
let wonMessageHeader = document.querySelector('#wonMessage');

const hideWinMessage = () => {
    console.log("hiding win message")
    wonMessageHeader.textContent = "";
    wonMessageHeader.style.display = "none";
}

const showWinMessage = (winningPlayer) => {
    console.log("showing win message")
    wonMessageHeader.textContent = "Player: " + winningPlayer + " won the game!";
    wonMessageHeader.style.display = "block";
}

const showReviewDisprovalPane = () => {
    reviewDisprovePaneElement.style.display = "block";
}

const hideReviewDisprovalPane = () => {
    reviewDisprovePaneElement.style.display = "none";
}

const showPlayerTurnButtons = () => {
    playerTurnButtons.style.display = "block";
    bMakeSuggestion.disabled = false;
    moveTurnButton.disabled = false;
    end.disabled = false;
    if (canSuggest() || canMove()) {
        end.disabled = true;
    }
    if (!canSuggest()) {
        bMakeSuggestion.disabled = true;
    } 
    if (!canMove()) {
        moveTurnButton.disabled = true;
    }
}

const displayDisproval = () => {
    const disprovalText = document.querySelector('#ReviewDisprovalText');
    var disprovalTextContent;
    if (isActivePlayer()) {
        if (gameStateObj.disproval.card == "") {
            disprovalTextContent = "No One Could Disprove Your Suggestion!";
        } else {            
            disprovalTextContent = gameStateObj.disproval.playerId + " disproved your suggestion with: " + gameStateObj.disproval.card;
        }
        confirmDisprovalRecieptButton.style.display = "block";  
    } else {
        if (gameStateObj.disproval.playerId) {
            disprovalTextContent = gameStateObj.disproval.playerId + " has disproved the suggestion";
        }
        else {
            disprovalTextContent = "No One Could Disprove the Suggestion!"
        }
        confirmDisprovalRecieptButton.style.display = "none";
    }
    disprovalText.textContent = disprovalTextContent;
    hidePlayerTurnButtons();
}

const hidePlayerTurnButtons = () => {
    playerTurnButtons.style.display = "none";
}
const hideLobbyPane = () => {
    lobbyPane.style.display = "none"
}

const isSuggestion = (suggestionText) => {
    // console.log("testing isSuggestion")
    return ((suggestionText == "{}" || suggestionText == null || suggestionText == "") ? false : true)
}

const suggestionText = (suggestionJSON) => {
    const {room, weapon, character} = suggestionJSON.params;
    const textstr = "Player: " + suggestionJSON.playerId + " suggested " + character + " in the " + room + " with the " + weapon;
    return textstr
}

const showPlayerTurnElement = () => {
    // check if game is in progress
    // console.log("rendering player turn elements")
    hideSuggestionPane();
    hideMovePane();
    hideLobbyPane();    
    displayCards();
    const suggestionContent = document.querySelector('#SuggestionResults') 
    suggestionJSONstr = JSON.stringify(gameStateObj.suggestion)

    // playerTurnPaneElement.style.display = "block";
    if (isActivePlayer()) {
        console.log("rendering active player turn elements")
        // playerTurnPaneElement.style.display = "block";
        hideReviewDisprovalPane();
        if (isSuggestion(suggestionJSONstr)) {
            console.log(" suggestion")
            suggestionContent.style.display = "block";
            suggestionContent.textContent = suggestionText(gameStateObj.suggestion);
            showDisproveButtons();
        } else {
            console.log("no suggestion")
            suggestionContent.style.display = "none";
            hideDisproveButtons();
            showPlayerTurnButtons();
        }
    } else {
        console.log("rendering non-active player turn elements")
        hidePlayerTurnButtons();
        hideReviewDisprovalPane();
        hideDisproveButtons();
        if (isSuggestion(suggestionJSONstr)) {
            console.log("suggestion")
            suggestionContent.style.display = "block";
            suggestionContent.textContent = suggestionText(gameStateObj.suggestion);
        } else {
            console.log("no suggestion")
            suggestionContent.style.display = "none";
        }
    }
    if (JSON.stringify(gameStateObj.disproval) != "{}") {
        console.log("rendering any disprovals")
        showReviewDisprovalPane();
        displayDisproval();
    }
}

const getMyCharacter = () => {
    var characters = Object.keys(gameStateObj.party.characters)
    for (const character of characters) {
        // console.log(character)
        if (gameStateObj.party.characters[character] == getMyId()) {
            return character
        }
    }
    return "No Character Chosen"
}

const getPlayersCharacter = (playerId) => {
    var characters = Object.keys(gameStateObj.party.characters)
    for (const character of characters) {
        // console.log(character)
        if (gameStateObj.party.characters[character] == playerId) {
            return character
        }
    }
    return "No Character Chosen"
}

let playerLocationList = document.querySelector('#playerLocations')
const listPlayerLocations = () => {
    if (JSON.stringify(gameStateObj) != "{}") {
        var playersList = Object.keys(gameStateObj.party.players);
        playerLocationList.innerHTML = "";
        for (i = 0; i < playersList.length; i++) {
            playerLocationList.insertAdjacentHTML('beforeend', '<p>' + "Character: " + getPlayersCharacter(playersList[i]) + ". Player ID: " + playersList[i] + ". Player Location: " +  gameStateObj.party.players[playersList[i]].location + '</p>');
        }
    }
}

const renderViews = () => {
    if (JSON.stringify(gameStateObj) != "{}") {
        listPlayerLocations();
        if (gameStateObj.gameState == "Completed") {
            console.log("Player won: " + gameStateObj.activePlayer.playerId);
            showWinMessage(gameStateObj.party.characters[gameStateObj.activePlayer.character]);
            showPlayerTurnElement(); // show winning accusation
        }
        else if (gameStateObj.gameState == "In-Progress") {
            hideWinMessage();
            showPlayerTurnElement();
        } 
        else {
            // do nothing
        }
    }
}
// let oldPlayerPaneElement = document.querySelector('#oldPlayerPane');
// oldPlayerPaneElement.style.display = "none";

socket.on('roomPlacement', (gameState) => {
    console.log("Latest client placement ", gameState)
    const messageOne = document.querySelector('#GameStateObject')
    const playerIdElement = document.querySelector('#pId')
    const playerLocationElement = document.querySelector('#pLocation')
    const playerCharacterElement = document.querySelector('#pCharacter')
    
    // if (JSON.stringify(gameStateObj) != "{}") {
    //     if (gameStateObj.gameState == "Completed") {
    //         alert(gameStateObj.party.characters[gameStateObj.activePlayer.character] + " WON THE GAME")
    //     }
    // }

    
    gameStateObj = JSON.parse(gameState);
    const gamePlayers = document.querySelector('#PlayerObject')
    messageOne.textContent = JSON.stringify(JSON.parse(gameState), "<br>", 2);
    playerIdElement.textContent = getMyId();
    
    if (getMyId() in gameStateObj.party.players ) {
        playerLocationElement.textContent = gameStateObj.party.players[getMyId()].location;
    }    

    playerCharacterElement.textContent = getMyCharacter();
    
    gamePlayers.textContent = JSON.stringify(JSON.parse(gameState).party);

    // showPlayerTurnElement();
    renderViews();
});

socket.on('joinStatus', (status) => {
    console.log(status);
})

let b1 = document.querySelector('#r1');
let b2 = document.querySelector('#r2');
let b3 = document.querySelector('#r3');

let c1 = document.querySelector('#scarlet');
let c2 = document.querySelector('#mustard');
let c3 = document.querySelector('#white');
let c4 = document.querySelector('#green');
let c5 = document.querySelector('#peacock');
let c6 = document.querySelector('#plum');

let studyRoom = document.querySelector('#rm1');
let hallway1 = document.querySelector('#rm2');
let hallRoom = document.querySelector('#rm3');
let hallway2 = document.querySelector('#rm4');
let loungeRoom = document.querySelector('#rm5');
let hallway3 = document.querySelector('#rm6');
let hallway4 = document.querySelector('#rm7');
let hallway5 = document.querySelector('#rm8');
let libraryRoom = document.querySelector('#rm9');
let hallway6 = document.querySelector('#rm10');
let billardRoomRoom = document.querySelector('#rm11');
let hallway7 = document.querySelector('#rm12');
let diningRoomRoom = document.querySelector('#rm13');
let hallway8 = document.querySelector('#rm14');
let hallway9 = document.querySelector('#rm15');
let hallway10 = document.querySelector('#rm16');
let conservatoryRoom = document.querySelector('#rm17');
let hallway11 = document.querySelector('#rm18');
let ballroomRoom = document.querySelector('#rm19');
let hallway12 = document.querySelector('#rm20');
let kitchenRoom = document.querySelector('#rm21');

let end = document.querySelector('#end')

confirmDisprovalRecieptButton.addEventListener('click', () => {
    // this should just reveal the player turn buttons again...
    // showPlayerTurnButtons();
    // hide review suggestion
    // show player turn buttons
    showPlayerTurnButtons();
    hideReviewDisprovalPane();
    // socket.emit('endTurn', endTurn());
})

b1.addEventListener('click', () => {
    console.log('Create Game By', getMyId());
    message = createGame();
    console.log(message)
    socket.emit(message.action.type, message)
});

b2.addEventListener('click', () => {
    console.log('Join Game by', getMyId());
    message = joinGame();
    socket.emit(message.action.type, message)
});

b3.addEventListener('click', () => {
    console.log('Ready to play', getMyId());
    message = readyToPlay();
    socket.emit(message.action.type, message)
});
// 'Miss Scarlet','Col. Mustard','Mrs. White', 'Mr. Green', 'Mrs. Peacock', 'Prof. Plum'
c1.addEventListener('click', () => {
    console.log('Character Chosen: Miss Scarlet', getMyId());
    message = chooseCharacter('Miss Scarlet');
    socket.emit(message.action.type, message)
});

c2.addEventListener('click', () => {
    console.log('Character Chosen: Col. Mustard', getMyId());
    message = chooseCharacter('Col. Mustard');
    socket.emit(message.action.type, message)
});

c3.addEventListener('click', () => {
    console.log('Character Chosen: Mrs. White', getMyId());
    message = chooseCharacter('Mrs. White');
    socket.emit(message.action.type, message)
});

c4.addEventListener('click', () => {
    console.log('Character Chosen: Mr. Green', getMyId());
    message = chooseCharacter('Mr. Green');
    socket.emit(message.action.type, message)
});

c5.addEventListener('click', () => {
    console.log('Character Chosen: Mrs. Peacock', getMyId());
    message = chooseCharacter('Mrs. Peacock');
    socket.emit(message.action.type, message)
});

c6.addEventListener('click', () => {
    console.log('Character Chosen: Prof. Plum', getMyId());
    message = chooseCharacter('Prof. Plum');
    socket.emit(message.action.type, message)
});

bMakeSuggestion.addEventListener('click', ()=> {
    console.log('Selected: Make Suggestion');
    if (canSuggest()) {
        showSuggestionPane("suggest");
    };
});

bMakeAccusation.addEventListener('click', ()=> {
    console.log('Selected: Make Suggestion');
    showSuggestionPane("accuse");
});

moveTurnButton.addEventListener('click', ()=> {
    if (canMove()) {
        showMovePane();
    }
})

const isAccusationValid = (room, weap, susp) => {
    if (room && weap && susp) {
        return true
    }
    return false
}

const isSuggestionValid = (room, weap, susp) => {
    if (canSuggest()) {
    console.log("player can suggest");
        if (room && weap && susp) {
            console.log("suggest has valid fields");
            if (room == gameStateObj.party.players[(gameStateObj.party.characters[gameStateObj.activePlayer.character])].location) {
                console.log("player is in the suggested room");
                return true
            }
        }
    }
    return false;
}

bSendSuggestion.addEventListener('click', () => {
    const suggestedRoom = document.getElementById("room-select").value;
    const suggestedWeap = document.getElementById("weapon-select").value;
    const suggestedSusp = document.getElementById("suspect-select").value;
    if (isSuggestionValid(suggestedRoom, suggestedWeap, suggestedSusp)) {
        console.log("making suggestion");
        message = makeMurderDetails("suggestion", suggestedRoom, suggestedWeap, suggestedSusp);
        console.log(JSON.stringify(message));
        socket.emit(message.action.type, message);
    }
});

disproveSuggestion.addEventListener('click', () => {
    const disprovalCard = document.getElementById("card-select").value;
    // should check this conditionon front-end but is already implemented in the backend - James
    if (Object.values(gameStateObj.suggestion.params).includes(disprovalCard)) {
        message = disproveSuggestionMessage(disprovalCard);
        socket.emit(message.action.type, message);
    };
});
cantDisprove.addEventListener('click', () => {
    if (!canDisprove()) {
        message = endTurn();
        socket.emit(message.action.type, message);
    };
});

bSendAccusation.addEventListener('click', () => {
    const accusedRoom = document.getElementById("room-select").value;
    const accusedWeap = document.getElementById("weapon-select").value;
    const accusedSusp = document.getElementById("suspect-select").value;
    if (isAccusationValid(accusedRoom,accusedWeap,accusedSusp)) {
        message = makeMurderDetails("accusation", accusedRoom, accusedWeap, accusedSusp);
        socket.emit(message.action.type, message);
    }
});

// moving event listeners
studyRoom.addEventListener('click', () => {
    setMoveParams("study");
});
hallway1.addEventListener('click', () => {
    setMoveParams("hallway1");
});
hallRoom.addEventListener('click', () => {
    setMoveParams("hall");
});
hallway2.addEventListener('click', () => {
    setMoveParams("hallway2");
});
loungeRoom.addEventListener('click', () => {
    setMoveParams("lounge");
});
hallway3.addEventListener('click', () => {
    setMoveParams("hallway3");
});
hallway4.addEventListener('click', () => {
    setMoveParams("hallway4");
});
hallway5.addEventListener('click', () => {
    setMoveParams("hallway5");
});
libraryRoom.addEventListener('click', () => {
    setMoveParams("library");
});
hallway6.addEventListener('click', () => {
    setMoveParams("hallway6");
});
billardRoomRoom.addEventListener('click', () => {
    setMoveParams("billard room");
});
hallway7.addEventListener('click', () => {
    setMoveParams("hallway7");
});
diningRoomRoom.addEventListener('click', () => {
    setMoveParams("dining room");
});
hallway8.addEventListener('click', () => {
    setMoveParams("hallway8");
});
hallway9.addEventListener('click', () => {
    setMoveParams("hallway9");
});
hallway10.addEventListener('click', () => {
    setMoveParams("hallway10");
});
conservatoryRoom.addEventListener('click', () => {
    setMoveParams("conservatory");
});
hallway11.addEventListener('click', () => {
    setMoveParams("hallway11");
});
ballroomRoom.addEventListener('click', () => {
    setMoveParams("ballroom");
});
hallway12.addEventListener('click', () => {
    setMoveParams("hallway12");
});
kitchenRoom.addEventListener('click', () => {
    setMoveParams("kitchen");
});

confirmMoveButton.addEventListener('click', () => {
    console.log('Move Submitted');
    if (moveParams.targetLoc != "") {
        message = playerMove();
        socket.emit(message.action.type, message);
        setMoveSelectionElement('');
        moveParams.targetLoc = "";
    }
});

end.addEventListener('click', () => {
    console.log('Ending turn of', getMyId());
    socket.emit('endTurn', endTurn());
});


hidePlayerTurnElement()

 
