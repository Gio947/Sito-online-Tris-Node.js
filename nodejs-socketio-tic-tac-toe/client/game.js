//variabili per il controllo del tris
var resultGame = "";
var checkResult = "";

//elementi del campo da gioco
var cell0 = document.getElementById('cell0');
var cell1 = document.getElementById('cell1');
var cell2 = document.getElementById('cell2');
var cell3 = document.getElementById('cell3');
var cell4 = document.getElementById('cell4');
var cell5 = document.getElementById('cell5');
var cell6 = document.getElementById('cell6');
var cell7 = document.getElementById('cell7');
var cell8 = document.getElementById('cell8');

//elementi per la chat
var gameMessage = document.getElementById('gameMessage');

//socket in ascolto per ricevere la mossa del giocatore
socket.on('mossa', function (data) {
    myCella = document.getElementById(data.idCella);
    myCella.innerHTML = data.simbolo;

    if (data.simbolo !== symbol) {
        round = true;
    }
    checkEndGame();
});

//client che riceve un messaggio dal server
socket.on('chat message', function(message) {
      console.log("ho ricevuto un messaggio :" + message)
      var item = document.createElement('li');
      item.textContent = message;
      messages.appendChild(item);
      window.scrollTo(0, document.body.scrollHeight);
});


//controllo se un utente ha fatto tris
function checkTris(){
    if(cell0.textContent !== "" && cell0.textContent == cell1.textContent && cell1.textContent == cell2.textContent){
        checkResult = cell0.textContent;
    }else if(cell3.textContent !== "" && cell3.textContent == cell4.textContent && cell4.textContent == cell5.textContent) {
        checkResult = cell3.textContent;
    }else if(cell6.textContent !== "" && cell6.textContent == cell7.textContent && cell7.textContent == cell8.textContent){
        checkResult = cell6.textContent;
    }else if(cell0.textContent !== "" && cell0.textContent == cell3.textContent && cell3.textContent == cell6.textContent){
        checkResult = cell0.textContent;
    }else if(cell1.textContent !== "" && cell1.textContent == cell4.textContent && cell4.textContent == cell7.textContent){
        checkResult = cell1.textContent;
    }else if(cell2.textContent !== "" && cell2.textContent == cell5.textContent && cell5.textContent == cell8.textContent){
        checkResult = cell2.textContent;
    }else if(cell0.textContent !== "" && cell0.textContent == cell4.textContent && cell4.textContent == cell8.textContent){
        checkResult = cell0.textContent;
    }else if(cell2.textContent !== "" && cell2.textContent == cell4.textContent && cell4.textContent == cell6.textContent){
        checkResult = cell2.textContent;
    }
}

//controllo della parità
function tieCheck() {
    if (checkResult == "" && cell0.textContent !== "" && cell1.textContent !== "" && cell2.textContent !== "" &&
        cell3.textContent !== "" && cell4.textContent !== "" && cell5.textContent !== "" && cell6.textContent !== "" &&
        cell7.textContent !== "" && cell8.textContent !== "") {
        checkResult = "draw";
    }
}

//controllo il risultato finale della partita
function checkEndGame(){
    checkTris();
    tieCheck();
    if(checkResult !== ""){
        if(checkResult == symbol){
            checkResult = username;
            resultGame = "win";
            alert("Hai vinto!!!!");
        }
        else if(checkResult == "draw"){
            checkResult = opponent;
            resultGame = "draw";
            alert("La partita e' finita in pareggio");
        }
        else if(checkResult !== symbol){
            checkResult = opponent;
            resultGame = "lose";
            alert("Sei stato sconfitto");
        }
        
        if (round == true) {
            //emetto l'evento per il vincitore
            socket.emit('winner', {
                esito: resultGame,
                winner: checkResult,
                roomName: roomName,
                player1: opponent,
                player2: username,
            });
            aggiornaClassifica();
        }
        //svuoto il campo da gioco
        clearCell(cell0);
        clearCell(cell1);
        clearCell(cell2);
        clearCell(cell3);
        clearCell(cell4);
        clearCell(cell5);
        clearCell(cell6);
        clearCell(cell7);
        clearCell(cell8);

        //si ritorna nella lobby
        resultGame = "";
        checkResult = "";
        round = false;
        symbol = "";
        roomName = "";
        opponent = "";
        lobbyDiv.style.display = 'block';
        gameDiv.style.display = 'none';
        gameMessage.style.display = 'none';
        
        let messageList = document.getElementById('messages');
        while (messageList.firstChild) {
            messageList.removeChild(messageList.firstChild);
        }
    }
}

//svuoto la cella del campo
function clearCell(cell) {
    cell.innerHTML = "";
    cell.style.backgroundColor = "#007BFF";
}

//aggiungo l'evento alla cella del campo
function addEventCell(cell) {
    cell.addEventListener('click', function (event) {
        if (cell.textContent == "") {
            if (round == true && checkResult == "") {
                round = false;
                socket.emit('mossa', {
                    roomName: roomName,
                    idCella: cell.id,
                    simbolo: symbol,
                });
            } else {
                alert("Attendi il tuo round per poter fare la tua mossa.");
            }
        }
    });
}

//aggiungo evento alle celle del campo
addEventCell(cell0);
addEventCell(cell1);
addEventCell(cell2);
addEventCell(cell3);
addEventCell(cell4);
addEventCell(cell5);
addEventCell(cell6);
addEventCell(cell7);
addEventCell(cell8);

//funzione per aggiornare la classifica
function aggiornaClassifica(){
    socket.emit('classifica', {
        blank: "",
    });
}
