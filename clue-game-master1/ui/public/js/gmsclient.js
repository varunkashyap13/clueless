// Generate unique userId per a new browser session
sessionStorage.userId=uuid();

const gmsEndpoint = "http://localhost:12000";

function fetchSession(sessionId) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', gmsEndpoint + '/v1/game/instance/' + sessionId, false);
    try {
        xhr.send();
        if (xhr.status != 200) {
            console.log(`Error ${xhr.status}: ${xhr.statusText}`);
            return null;
        } else {
            sessionStorage.resp = xhr.response;
            return xhr.response;
        }
    } catch (err) {
        console.log(xhr.response);
        return null;
    }

}

function createSession() {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", gmsEndpoint + '/v1/game/instance', false)
    xhr.setRequestHeader('Content-type', 'application/json');
    try {
        xhr.send();
        if (xhr.status != 200) {
            console.log(`Error ${xhr.status}: ${xhr.statusText}`);
            return null;
        } else {
            return xhr.response;
        }
    } catch (err) {
        console.log(xhr.response);
        return null;
    }
}

function newSessionHandler() {

    let session = createSession();

    if (session != null) {
        const response = JSON.parse(session);
        sessionStorage.gsi = response._id;
        sessionStorage.token = response.token;
        // redirect to next page
        window.location.assign('gp.html?ns=true');
    } else {
        alert("Unable to create a new game session, please try again!");
    }
}


function sessionValidationHandler() {

    let inpSessionId = document.getElementById('gsi').value;
    let inpToken = document.getElementById('psw').value;
    let session = fetchSession(inpSessionId);
    if (session != null) {
        const response = JSON.parse(session);
        console.debug(response);
        if (response.token == inpToken && response._id == inpSessionId) {
            sessionStorage.gsi = response._id;
            sessionStorage.token = response.token;

            // redirect to next page
            window.location.assign('gp.html?ns=false');
        }
    } else {
        alert("Unable to validate the credentials submitted, please try again!");
        document.getElementById("modal2-content").reset();
    }
}

function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}