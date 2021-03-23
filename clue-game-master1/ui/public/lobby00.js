var socket = io('http://localhost:13000/', {
    transports: ['websocket']
});
var IDincr = 0;
var gameStateObj = {};

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

const getGameStateObj = () => {
    return gameStateObj;
}

const hidePlayerTurnElement = () => {
    playerTurnPaneElement.style.display = "none";
}

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

charactersColors = {
    "Miss Scarlet" : "Miss_Scarlet",
    "Col. Mustard" : "pieceMustard",
    "Mrs. White" : "pieceWhite",
    "Mr. Green" : "pieceGreen",
    "Mrs. Peacock" : "piecePeacock",
    "Prof. Plum" : "piecePlum"
}

const renderReadyToPlay = () => {
    let gameObj = getGameStateObj();
    if (gameObj.party.players[getMyId()].location) {
        console.log("has location")
        document.getElementById("readyToPlayButton").style.opacity = "1.0"
        document.getElementById("readyToPlayButton").style.pointerEvents = "auto"
    } else { console.log("does not have a location")}
}


const renderPlayers = () => {
    // change color and text to indicate what characters players have chosen
    
    const gameObj = getGameStateObj();
    const playersArr = Object.keys(gameObj.party.players)
    if (playersArr.length > 0) {
        for (var i = 0;  i < playersArr.length; i++) {
            const playersChar = getPlayersCharacter(playersArr[i]);
            playerId = "namePlayer" + (i+1);
            statusElementId = "statusPlayer" + (i+1);
            let playersStatus = document.getElementById(statusElementId);
            let playerElement = document.getElementById(playerId);
            playersStatus.innerText = playersChar;
            playerElement.style.backgroundColor = 'green';
        } 
    };
}
const renderNotifications = () => {

}

const renderLobby = () => {
    renderPlayers();
    renderNotifications();
    renderReadyToPlay();
}

socket.on('joinStatus', (status) => {
    console.log(status);
});
socket.on('roomPlacement', (gameState) => {

    gameStateObj = JSON.parse(gameState);

    if (gameState != "{}") {
        if (gameStateObj.gameState == "In-Progress") {
            window.location.replace("activePlayer.html")
        } else if (gameStateObj.gameState == "Setup") {
            renderLobby();
            console.log("setting up")
        }
    } 

});



let b1 = document.getElementById('r1');
let b2 = document.getElementById('r2');
let readyToPlayButtonDiv = document.getElementById('readyToPlayButton');

let c1 = document.getElementById('startLabelScarlet');
let c2 = document.getElementById('startLabelMustard');
let c3 = document.getElementById('startLabelWhite');
let c4 = document.getElementById('startLabelGreen');
let c5 = document.getElementById('startLabelPeacock');
let c6 = document.getElementById('startLabelPlum');




document.getElementById('r1').addEventListener('click', () => {
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

readyToPlayButtonDiv.addEventListener('click', () => {
    console.log('Ready to play', getMyId());
    message = readyToPlay();
    socket.emit(message.action.type, message)
});
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
