//Make connection
var socket = io.connect('http://localhost:3000');//192.168.1.93:3000
var username ="" ;

//LOGIN REGISTRAZIONE DIV ELEMENT
var btnSign = document.getElementById('btnSign');
var btnLogin = document.getElementById('btnLogin');
var loginDiv = document.getElementById('loginDiv');
var lobbyDiv = document.getElementById('lobbyDiv');

//LOBBY DIV ELEMENT
var select = document.getElementById("slct");
var tableRanking = document.getElementById("ranking");
var btnSfida = document.getElementById('btnSfida');

//GAME DIV ELEMENT
var gameDiv = document.getElementById("gameDiv");
var simbolo = "";
var roomName;
var turno;
var opponent;

//EVENTI EMESSI AGLI ELEMENTI
btnLogin.addEventListener('click',function(){ //assegno evento al bottone
    var logUsername = document.getElementById('logUsername');
    var logPwd = document.getElementById('logPwd');
    if(logUsername.value.trim() !== "" && logPwd.value.trim() !== "") {
        socket.emit('login', { //passo nome dell'evento 'login' e parametri da inviare
            logUsername: logUsername.value.trim(),
            logPwd: logPwd.value.trim(),
        });
    }
});

btnSign.addEventListener('click',function(){ //assegno evento al bottone
    var signUsername = document.getElementById('signUsername');
    var signPwd = document.getElementById('signPwd');
    if(signUsername.value.trim() !== "" && signPwd.value.trim() !== ""){
        socket.emit('signup', { //passo nome dell'evento 'signup' e parametri da inviare
            signUsername: signUsername.value.trim(),
            signPwd: signPwd.value.trim(),
        });
    }else
        alert("RIEMPIERE I CAMPI CORRETTAMENTE !!!")
});

btnSfida.addEventListener('click',function(){
    if(select.selectedIndex >= 0){
        btnSfida.disabled = true;
        var strUser = select.options[select.selectedIndex].value;
        socket.emit('reqSfida', { //passo nome dell'evento 'signup' e parametri da inviare
            reciverName: strUser,
            senderName: username,
        });
        alert('RICHIESTA INVIATA ATTENDERE RISPOSTA');
    }
    else
        alert("SELEZIONARE UTENTE");
});

//LISTA EVENTI IN ASCOLTO

//EVENTO LOGIN
socket.on('login', function(data){ //dalle socket prendo quella con evento 'login' e prendo i dati ricevuti
    if(data.status) {
        username = data.username;
        loginDiv.style.display = 'none';
        lobbyDiv.style.display = 'inline';
    } else {
        alert(data.reason);
    };
});

//EVENTI REGISTRAZIONE
socket.on('signup', function(data){ //dalle socket prendo quella con evento 'signup' e prendo i dati ricevuti
    if(data.status) {
        username = data.username;
        alert("REGISTRAZIONE EFFETTUATA CON SUCCESSO");
        loginDiv.style.display = 'none';
        lobbyDiv.style.display = 'inline';
    } else {
        alert("USERNAME GIA' ESISTENTE");
    }
});

//UPDATE LISTA USER ONLINE
socket.on('updateList', function(data){ //dalle socket prendo quella con evento 'signup' e prendo i dati ricevuti
    var list = JSON.parse(data.userList);
    select.innerHTML = "";// pulisco select

    for (i = 0; i < list.length; i++) {
        if(list[i] !== username) { //Controllo di non aggiungere il nome del seguente utente
            var option = document.createElement("option");
            option.text = list[i];
            option.value = list[i];
            select.add(option);
        }
    }
});

//RICEZIONE RANKING
socket.on('ranking', function(data){ //dalle socket prendo quella con evento 'login' e prendo i dati ricevuti
    var rows = data.rows;
    var numberRow =  - 1;
    var tbody = document.getElementById("tableBody");
    tbody.innerHTML = "";// pulisco tbody
    if(data.status) {

        for (i = 0; i < rows.length; i++) {
            var row = tbody.insertRow(numberRow);
            var rank = row.insertCell(numberRow);
            var name =  row.insertCell(numberRow);
            var win =  row.insertCell(numberRow);
            var draw =  row.insertCell(numberRow);
            var lose =  row.insertCell(numberRow);
            rank.innerHTML = i+1;
            name.innerHTML = rows[i].userName;
            win.innerHTML = rows[i].win;
            draw.innerHTML = rows[i].draw;
            lose.innerHTML = rows[i].defeat;
        }

    } else {
        alert("Errore Caricamento Classifica");
    }
});

//RICEZIONE SFIDA
socket.on('reqSfida', function(data){
    var sfida =  window.confirm('TI SFIDA : '+ data.senderName + ', ACCETTI ?');
    var esito;
    if (sfida == true) {
        esito = true;
    } else {
        esito = false;
    }
    //esito = false;

    socket.emit('respSfida', { //Rispondo alla sfida
        reciverName: data.reciverName,
        senderName: data.senderName,
        esito: esito,
    });
});

//INIZIALIZZAZIONE GIOCO
socket.on('inizialize', function(data){
    btnSfida.disabled = false;
    if(data.esito)
    {
        alert("Sfida Accettata Nella stanza : "+ data.roomName);
        lobbyDiv.style.display = 'none';
        gameDiv.style.display = 'inline';
        if(data.senderName == username){ //SCELTA DEL SIMBOLO E PRIMO TURNO
            simbolo = "X";
            turno = true;
            opponent = data.reciverName;
        }
        else{
            simbolo = "O";
            turno = false;
            opponent = data.senderName;
        }
        roomName = data.roomName;
        document.getElementById("avversario").innerHTML = "Avversario : " + opponent ;
    }
    else
        alert("Sfida non Accettata");
});