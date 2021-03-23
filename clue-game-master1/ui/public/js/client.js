// Validate whether the required session info is set
if (typeof(Storage) !== undefined) {
 if (sessionStorage.getItem('userId') == undefined || sessionStorage.getItem('gsi') == undefined || sessionStorage.getItem('token') == undefined ) {
     alert("Session info not found - please create a new session or join the an existing session")
 }
    console.log('userId ' + sessionStorage.getItem('userId') );
    console.log('gameSessionId ' + sessionStorage.getItem('gsi') );
    console.log('token ' + sessionStorage.getItem('token') );
} else {
    alert("Unsupported browser - please use the app using the latest version of Chrome/Safari")
}

console.log(window.location.search)
//window.location.search.search("ns=true")

// TODOS:
// stop actions after someone won -- hide buttons, show cards
// disable character buttons after done with setup/lobby
// protect multiple suggestions!!!

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

const getMyId = () => {
    return sessionStorage.getItem('userId');
}

const getMyGame = () => {
    return sessionStorage.getItem('gsi');
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

function printCreds() {
    document.getElementById("sessionId").innerHTML = "Game Session ID :  " + sessionStorage.gsi;
    document.getElementById("token").innerHTML = "Game Session Token :  " + sessionStorage.token;
}
// new session
if (window.location.search.search("ns=true") == 1) {
    console.log('Create Game By', getMyId());
    message = createGame();
    console.log(message)
    socket.emit(message.action.type, message)
    printCreds();
}

//existing session
else if (window.location.search.search("ns=true") != 1) {
    console.log('Join Game by', getMyId());
    message = joinGame();
    socket.emit(message.action.type, message)
    printCreds();
}


let confirmMoveButton = document.querySelector('#confirmMove');

const setMoveParams = (target) => {
    if (gameStateObj.activePlayer.playerTurnDetails.possibleMoves.includes(target)) {
        moveParams.currentLoc = gameStateObj.party.players[(gameStateObj.party.characters[gameStateObj.activePlayer.character])].location;
        moveParams.targetLoc = target;
        confirmMoveButton.disabled = false;
       
        // var newLocationName = gameStateObj.party.players[getMyId()].location + "Dots";
        var newLocationName = target + "Dots";
        newLocationName = newLocationName.replace(/\s+/g, "");
        newLocationName = newLocationName.replace(/\./g,"");
        console.log(newLocationName)
        var characterName = getPlayersCharacter(getMyId());
        console.log(characterName)
        var newLocation = document.getElementById(newLocationName);
        var dotId = characterName + " Dot";
        var charDot = document.getElementById(dotId);
        newLocation.appendChild(charDot);

        // setMoveSelectionElement(target); 
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
        cardList.options.length = 0;
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

const hidePlayerTurnElement = () => {
    playerTurnPaneElement.style.display = "none";
}


//     let studyRoom = document.querySelector('#rm1');
// let hallway1 = document.querySelector('#rm2');
// let hallRoom = document.querySelector('#rm3');
// let hallway2 = document.querySelector('#rm4');
// let loungeRoom = document.querySelector('#rm5');
// let hallway3 = document.querySelector('#rm6');
// let hallway4 = document.querySelector('#rm7');
// let hallway5 = document.querySelector('#rm8');
// let libraryRoom = document.querySelector('#rm9');
// let hallway6 = document.querySelector('#rm10');
// let billiardRoomRoom = document.querySelector('#rm11');
// let hallway7 = document.querySelector('#rm12');
// let diningRoomRoom = document.querySelector('#rm13');
// let hallway8 = document.querySelector('#rm14');
// let hallway9 = document.querySelector('#rm15');
// let hallway10 = document.querySelector('#rm16');
// let conservatoryRoom = document.querySelector('#rm17');
// let hallway11 = document.querySelector('#rm18');
// let ballroomRoom = document.querySelector('#rm19');
// let hallway12 = document.querySelector('#rm20');
// let kitchenRoom = document.querySelector('#rm21');


const disableLocation = (locationName,displayBool) => {
    // ["study","hall", "lounge","library", "billiard room", "dining room", "conservatory","ballroom", "kitchen"];
    switch(locationName) {
        case "study":
            studyRoom.disabled = displayBool;
            break;
        case "hall":
            hallRoom.disabled = displayBool;
            break;
        case "lounge":
            loungeRoom.disabled = displayBool;
            break;
        case "library":
            libraryRoom.disabled = displayBool;
            break;
        case "billiard room":
            billiardRoom.disabled = displayBool;
            break;
        case "dining room":
            diningRoomRoom.disabled = displayBool;
            break;
        case "conservatory":
            conservatoryRoom.disabled = displayBool;
            break;
        case "ballroom":
            ballroomRoom.disabled = displayBool;
            break;
        case "kitchen":
            kitchenRoom.disabled = displayBool;
            break;
        case "hallway1":
            hallway1.disabled = displayBool;
            break;
        case "hallway2":
            hallway2.disabled = displayBool;
            break;
        case "hallway3":
            hallway3.disabled = displayBool;
            break;
        case "hallway4":
            hallway4.disabled = displayBool;
            break;
        case "hallway5":
            hallway5.disabled = displayBool;
            break;
        case "hallway6":
            hallway6.disabled = displayBool;
            break;
        case "hallway7":
            hallway7.disabled = displayBool;
            break;
        case "hallway8":
            hallway8.disabled = displayBool;
            break;
        case "hallway9":
            hallway9.disabled = displayBool;
            break;
        case "hallway10":
            hallway10.disabled = displayBool;
            break;
        case "hallway11":
            hallway11.disabled = displayBool;
            break;
        case "hallway12":
            hallway12.disabled = displayBool;
            break;
        default:
          // code block
    }
}

const displayMovableLocations = () => {
    moveableLocations = gameStateObj.activePlayer.playerTurnDetails.possibleMoves;
    for (var i = 0; i<moveableLocations.length; i++) {
        disableLocation(moveableLocations[i],false);
    }
}

const disableAllLocations = () => {
    studyRoom.disabled = true;
    hallway1.disabled = true;
    hallRoom.disabled = true;
    hallway2.disabled = true;
    loungeRoom.disabled = true;
    hallway3.disabled = true;
    hallway4.disabled = true;
    hallway5.disabled = true;
    libraryRoom.disabled = true;
    hallway6.disabled = true;
    billiardRoomRoom.disabled = true;
    hallway7.disabled = true;
    diningRoomRoom.disabled = true;
    hallway8.disabled = true;
    hallway9.disabled = true;
    hallway10.disabled = true;
    conservatoryRoom.disabled = true;
    hallway11.disabled = true;
    ballroomRoom.disabled = true;
    hallway12.disabled = true;
    kitchenRoom.disabled =true; 
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

let playerTurnPaneElement = document.querySelector("#PlayerTurnPane");
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
    var text2show = "Player: " + winningPlayer + " won the game!";
    if (isActivePlayer()) {
        text2show = "You won the Game!"
    }
    wonMessageHeader.textContent = text2show;
    wonMessageHeader.style.display = "block";
    hideReviewDisprovalPane();
    hideSuggestionPane();
    hidePlayerTurnButtons();
    hideDisproveButtons();
    hideMovePane();
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
    // const disprovalText = document.querySelector('#ReviewDisprovalText');
    // var disprovalTextContent;
    // if (isActivePlayer()) {
    //     confirmDisprovalRecieptButton.style.display = "block";  
    // } else {
    //     confirmDisprovalRecieptButton.style.display = "none";
    // }
    // // disprovalText.textContent = disprovalTextContent;
    // notificationText = gameStateObj.disproval.playerId + ' cannot disprove the suggestion.'
    // if (gameStateObj.disproval.card == "") {
    //     notificationText = notificationText + String.fromCharCode(13, 10) + "No One Could Disprove the Suggestion!"
    //     notificationsDiv.textContent = notificationText;
    // }
    // hidePlayerTurnButtons();
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
    notificationsDiv.textContent = disprovalTextContent;
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
    if (gameStateObj.gameState != "Completed") {
        hideSuggestionPane();
        hideMovePane();
        hideLobbyPane();    
        displayCards();
        // const suggestionContent = document.querySelector('#SuggestionResults') 
        suggestionJSONstr = JSON.stringify(gameStateObj.suggestion)
        
        playerTurnPaneElement.style.display = "block";
        if (isActivePlayer()) {
            console.log("rendering active player turn elements")
            // playerTurnPaneElement.style.display = "block";
            hideReviewDisprovalPane();
            if (isSuggestion(suggestionJSONstr)) {
                console.log(" suggestion")
                // suggestionContent.style.display = "block";
                // suggestionContent.textContent = suggestionText(gameStateObj.suggestion);
                showDisproveButtons();
            } else {
                console.log("no suggestion")
                // suggestionContent.style.display = "none";
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
                // suggestionContent.style.display = "block";
                // suggestionContent.textContent = suggestionText(gameStateObj.suggestion);
            } else {
                console.log("no suggestion")
                // suggestionContent.style.display = "none";
            }
        }
        if (JSON.stringify(gameStateObj.disproval) != "{}") {
            console.log("rendering any disprovals")
            showReviewDisprovalPane();
            displayDisproval();
        }
    }
}

// const getMyCharacter = () => {
//     var characters = Object.keys(gameStateObj.party.characters)
//     for (const character of characters) {
//         // console.log(character)
//         if (gameStateObj.party.characters[character] == getMyId()) {
//             return character
//         }
//     }
//     return "None Selected"
// }

const getPlayersCharacter = (playerId) => {
    var characters = Object.keys(gameStateObj.party.characters)
    for (const character of characters) {
        // console.log(character)
        if (gameStateObj.party.characters[character] == playerId) {
            return character
        }
    }
    return "None Selected"
}

const renderReadyBtn = () => {
    if (getPlayersCharacter(getMyId()) == "None Selected") {
        b3.disabled = true;
    } else {
        b3.disabled = false;
    }
}

// let c1 = document.querySelector('#scarlet');
// let c2 = document.querySelector('#mustard');
// let c3 = document.querySelector('#white');
// let c4 = document.querySelector('#green');
// let c5 = document.querySelector('#peacock');
// let c6 = document.querySelector('#plum');

const disableCharacterBtns = () => {
    const charBtns = [c1,c2,c3,c4,c5,c6];
    // const charArray = ["Miss Scarlet", "Col. Mustard", "Mrs. White"
    for (i = 0; i < charBtns.length; i++) {
        charBtns[i].disabled = true;
    }
    const charArr = Object.keys(gameStateObj.party.characters)
    const playerArr = Object.values(gameStateObj.party.characters)
    for (var i = 0; i < 6; i++){
        const charPlayer = gameStateObj.party.characters[charArr[i]]
        if (!charPlayer.includes('dummy')) {
            charBtns[i].textContent = playerArr[i].slice(0,5);
        }
    }
}

const renderViews = () => {
    disableAllLocations();
    if (JSON.stringify(gameStateObj) != "{}") {
        if (gameStateObj.gameState == "Completed") {
            console.log("Player won: " + gameStateObj.activePlayer.playerId);
            showWinMessage(gameStateObj.party.characters[gameStateObj.activePlayer.character]);
            showPlayerTurnElement(); // show winning accusation
            setLocations();            
            disableCharacterBtns();
        }
        else if (gameStateObj.gameState == "In-Progress") {
            hideWinMessage();
            showPlayerTurnElement();
            setLocations();            
            disableCharacterBtns();
        } 
        else {
            setLobbyTable();
            renderReadyBtn();
        }
    }
}
// let oldPlayerPaneElement = document.querySelector('#oldPlayerPane');
// oldPlayerPaneElement.style.display = "none";

const notificationsDiv = document.getElementById('notifications');
socket.on('message', (message) => {
    console.log("last notification: ", message);
    const msg = JSON.parse(message);
    const {playerId, action} = msg;
    const actionType = action.type;

    var notificationText;

    switch(actionType) {
        case 'move':
            notificationText = playerId + ' has moved.'
            if (isActivePlayer()) {
                notificationText = "You have moved."
            }
            // code block
            break;
        case 'suggestion':
            var {room, weapon, character} = action.params;
            notificationText = playerId + ' has suggested ' + character + ' in the ' + room + ' with the ' + weapon +'.';
            if (isActivePlayer()) {
                notificationText = 'You suggested ' + character + ' in the ' + room + ' with the ' + weapon +'.';
            }
            break;
        case 'disproveSuggestion':
            // code block
            // do nothing. wait for gamestate
            // const card = action.params.card;            
            // if (isActivePlayer()) {      
            //     notificationText = playerId + " disproved your suggestion with: " + card;
            // } else {
            //     notificationText = playerId + " has disproved the suggestion";
            // }
            break;
        case 'accusation':
            var {room, weapon, character} = action.params;
            notificationText = playerId + ' has accused ' + character + ' in the ' + room + ' with the ' + weapon + '.';
            if (isActivePlayer()) {
                notificationText = "You accused " + character + ' in the ' + room + ' with the ' + weapon + '.';
            }
            const murderingDetails = gameStateObj.murderingDetails;
            if (murderingDetails.room != room || murderingDetails.weapon != weapon || murderingDetails.character != character) {
                if (isActivePlayer()) {
                    notificationText = notificationText + String.fromCharCode(13, 10) + ' Your Accusation Was Incorrect!'
                } else { 
                    notificationText = notificationText + String.fromCharCode(13, 10) + ' Their Accusation was incorrect!';
                }
            }
            break;
        case 'endTurn':
            if (Object.keys(gameStateObj.suggestion).length < 1) {
                notificationText = playerId + ' has ended their turn.'
                if (isActivePlayer()) {
                    notificationText = "You ended your turn."
                }
            }
            else {
                // do nothing. Will be updated once gamestateobj comes back
                // notificationText = playerId + ' cannot disprove the suggestion.'
                // if (gameStateObj.disproval.card == "") {
                //     notificationText = notificationText + String.fromCharCode(13, 10) + "No One Could Disprove the Suggestion!"
                // }
            }
            break;
        default:
            // code block 
    }
    notificationsDiv.textContent = notificationText;
})

socket.on('roomPlacement', (gameState) => {
    // console.log("Latest client placement ", gameState)
    const playerIdElement = document.querySelector('#pId')
    const playerCharacterElement = document.querySelector('#pCharacter')

    gameStateObj = JSON.parse(gameState);
    playerIdElement.textContent = getMyId();
    playerCharacterElement.textContent = getPlayersCharacter(getMyId());

    
    // const messageOne = document.querySelector('#GameStateObject')
    // messageOne.textContent = JSON.stringify(JSON.parse(gameState), "<br>", 2);

    renderViews();
});

socket.on('joinStatus', (status) => {
    console.log(status);
})

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
let billiardRoomRoom = document.querySelector('#rm11');
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
billiardRoomRoom.addEventListener('click', () => {
    setMoveParams("billiard room");
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
        // setMoveSelectionElement('');
        moveParams.targetLoc = "";
    }
});

end.addEventListener('click', () => {
    console.log('Ending turn of', getMyId());
    socket.emit('endTurn', endTurn());
});

const setLocations = () => {
    // NEEDS SPRUCING UP TO LOOP THROUGH ALL CHARACTERS
    // loop through characters
    var charDot;
    var newLocation;
    for (const [key, value] of Object.entries(gameStateObj.party.characters)) {
        newLocationName = gameStateObj.party.players[`${value}`].location + "Dots";
        newLocationName = newLocationName.replace(/\s+/g, "");
        newLocationName = newLocationName.replace(/\./g,"");
        var characterName = `${key}`;
        newLocation = document.getElementById(newLocationName);
        dotId = characterName + " Dot";
        charDot = document.getElementById(dotId);
        newLocation.appendChild(charDot);
    }
}

const setLobbyTable = () =>{
    //get players' id. socket id for nowf
    var playersId;
    var playersCharacter;
    // var i=1;
    playersArr = Object.keys(gameStateObj.party.players)
    for (var i = 0; i < playersArr.length; i++) {
        playersId = playersArr[i]
        playersCharacter = getPlayersCharacter(playersArr[i]);
        const playerIdText = document.querySelector('#Player'+(i+1)+'Name');
        const playerCharacterText = document.querySelector('#Player'+(i+1)+'Character');
        const playerReadyStatusText = document.querySelector('#Player'+(i+1)+'ReadyStatus');
        const playerBox = document.querySelector('#Player'+(i+1)+'Box');
        playerIdText.textContent = playersId.slice(0,5);
        playerCharacterText.textContent = playersCharacter;
        playerReadyStatusText.textContent = (gameStateObj.party.players[(playersArr[i])].readyToPlay) ? "Ready":"Not Ready";
        playerBox.className = "PlayerStatusBoxEnabled";
        // 'Miss Scarlet','Col. Mustard','Mrs. White', 'Mr. Green', 'Mrs. Peacock', 'Prof. Plum'
        switch(playersCharacter) {
            case "Miss Scarlet":
                playerBox.style.backgroundColor = "red";
                break;
            case "Col. Mustard":
                playerBox.style.backgroundColor = "yellow";
                break;
            case "Mrs. White":
                playerBox.style.backgroundColor = "white";
                break;
            case "Mr. Green":
                playerBox.style.backgroundColor = "green";
                break;
            case "Mrs. Peacock":
                playerBox.style.backgroundColor = "turqouise";
                break;
            case "Plum":
                playerBox.style.backgroundColor = "purple";
                break;
            default:
              // code block
          }
        //get players' ready status
    }
}   

const peekBtn = document.getElementById('peekbtn');
var murderingDetailsContent = document.getElementById('murderingDetails');

peekBtn.addEventListener('click', () => {
    var {room, weapon, character} = gameStateObj.murderingDetails;
    murderingDetailsContent.textContent = "Room: " + room + String.fromCharCode(13, 10) +  " Weapon: " + weapon + String.fromCharCode(13, 10) + "Suspect: " + character;
})


    

hidePlayerTurnElement()

 