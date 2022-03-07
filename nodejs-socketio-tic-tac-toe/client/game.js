var c0 = document.getElementById("c0");
var c1 = document.getElementById("c1");
var c2 = document.getElementById("c2");
var c3 = document.getElementById("c3");
var c4 = document.getElementById("c4");
var c5 = document.getElementById("c5");
var c6 = document.getElementById("c6");
var c7 = document.getElementById("c7");
var c8 = document.getElementById("c8");
var form = document.getElementById('form');
var check = ""; //Per il tris
var result="";







function addRed(cell){
    cell.addEventListener('mouseover', function(event) {
        if(cell.textContent !== "X" && cell.textContent !== "O"){
            cell.style.opacity = 0.8;
        }
    });
}

function addBlue(cell){
    cell.addEventListener('mouseout', function(event) {
        if(cell.textContent !== "X" && cell.textContent !== "O"){
            cell.style.opacity = 1.0;
        }
    });
}

function addClick(cell){
    cell.addEventListener('click', function(event) {
        if(cell.textContent == "") {//SE CELLA VUOTA
            if (turno == true && check =="") {//SE TURNO E NESSUNO HA FATTO TRIS
                turno = false;
                socket.emit('mossa', {
                    roomName: roomName,
                    idCella: cell.id,
                    simbolo: simbolo,
                });
                /*cell.style.backgroundColor = "#268";
                cell.innerHTML = simbolo;
                clearAll();*/
            } else
                alert("NON E' IL TUO TURNO");
        }
    });
}

//client che riceve un messaggio dal server
socket.on('chat message', function(message) {
  console.log("ho ricevuto un messaggio :" + message)
  var item = document.createElement('li');
  item.textContent = message;
  messages.appendChild(item);
  window.scrollTo(0, document.body.scrollHeight);
});


socket.on('mossa', function(data){
    myCella = document.getElementById(data.idCella);
    myCella.style.backgroundColor = "#007BFF";
    myCella.innerHTML = data.simbolo;

    if(data.simbolo !== simbolo){
        turno = true;
    }
    checkWinner();
});

function checkDraw() {
    //CONTROLLO PAREGGIO
    if(check == "" && c0.textContent !== "" && c1.textContent !== "" && c2.textContent !== "" && c3.textContent !== "" && c4.textContent !== "" && c5.textContent !== "" && c6.textContent !== "" && c7.textContent !== "" && c8.textContent !== "" ){
        check = "draw";
    }
}

function checkTris(){
    //CONTROLLO TRIS
    if(c0.textContent !== "" && c0.textContent == c1.textContent && c1.textContent == c2.textContent){
        check = c0.textContent;
    }else if(c3.textContent !== "" && c3.textContent == c4.textContent && c4.textContent == c5.textContent) {
        check = c3.textContent;
    }else if(c6.textContent !== "" && c6.textContent == c7.textContent && c7.textContent == c8.textContent){
        check = c6.textContent;
    }else if(c0.textContent !== "" && c0.textContent == c3.textContent && c3.textContent == c6.textContent){
        check = c0.textContent;
    }else if(c1.textContent !== "" && c1.textContent == c4.textContent && c4.textContent == c7.textContent){
        check = c1.textContent;
    }else if(c2.textContent !== "" && c2.textContent == c5.textContent && c5.textContent == c8.textContent){
        check = c2.textContent;
    }else if(c0.textContent !== "" && c0.textContent == c4.textContent && c4.textContent == c8.textContent){
        check = c0.textContent;
    }else if(c2.textContent !== "" && c2.textContent == c4.textContent && c4.textContent == c6.textContent){
        check = c2.textContent;
    }
}

function checkWinner(){
    checkTris();
    checkDraw();
    if(check !== ""){
        if(check == simbolo){
            check = username;
            result = "win";
            alert("COMPLIMENTI HA VINTO !!! ");
        }
        else if(check == "draw"){
            check = opponent;
            result = "draw";
            alert("PAREGGIO !!! ");
        }
        else if(check !== simbolo){
            check=opponent;
            result = "lose";
            alert("PECCATO HAI PERSO !!! ");
        }
        clearAll();
        if(turno == true){ //SE QUALCUNO HA FATTO TRIS INVIO UNA SOCKET
            socket.emit('winner', {
                esito: result,
                winner: check,
                roomName: roomName,
                player1: opponent,
                player2: username,
            });


        }
        //RESET VARIABILI
        check="";
        opponent="";
        turno = false;
        roomName="";
        simbolo="";
        lobbyDiv.style.display = 'inline';
        gameDiv.style.display = 'none';
        gameMessage.style.display = 'none';
        result="";
    }
}

//PULISCE LA CELLA
function clear(cell){
    cell.style.backgroundColor = "#007BFF"
cell.innerHTML = "";
}

//PULISCE LA TABELLA ALLA FINE DELLA PARTITA
function clearAll(){
    //TODO: RIMETTERE DIV LOBBY, SOCKET PER CLASSIFICA VEDERE CHI LA INVIA E NEL SERVER LASCIARE LA ROOM
    clear(c0);
    clear(c1);
    clear(c2);
    clear(c3);
    clear(c4);
    clear(c5);
    clear(c6);
    clear(c7);
    clear(c8);
}


//AGGIUNGO EVENTO CLICK
addClick(c0);
addClick(c1);
addClick(c2);
addClick(c3);
addClick(c4);
addClick(c5);
addClick(c6);
addClick(c7);
addClick(c8);
//AGGIUNGO EVENTO MOUSEOVER RED
addRed(c0);
addRed(c1);
addRed(c2);
addRed(c3);
addRed(c4);
addRed(c5);
addRed(c6);
addRed(c7);
addRed(c8);
//AGGIUNGO EVENTO MOUSEOUT BLU
addBlue(c0);
addBlue(c1);
addBlue(c2);
addBlue(c3);
addBlue(c4);
addBlue(c5);
addBlue(c6);
addBlue(c7);
addBlue(c8);
