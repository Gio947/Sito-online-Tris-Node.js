//Make connection
//var socket = io.connect('http://localhost:8080');//IN LOCALE
var socket = io.connect('https://trisonline.herokuapp.com'); //SU EROKU
//var username = document.getElementById('username');


//scambio di messaggi
var messages = document.getElementById('messages');
var form = document.getElementById('form');
var input = document.getElementById('input');

var statistic = document.getElementById('rowStats');


//LOGIN REGISTRAZIONE DIV ELEMENT
var btnSign = document.getElementById('btnSign');
var btnLogin = document.getElementById('btnLogin');
var loginDiv = document.getElementById('loginDiv');
var lobbyDiv = document.getElementById('lobbyDiv');
var messageDiv = document.getElementById('gameMessage');
var dati = document.getElementById('dati');
var classifica = document.getElementById('classifica');
//LOBBY DIV ELEMENT
var select = document.getElementById("slct");
var tableRanking = document.getElementById("ranking");
var btnSfida = document.getElementById('btnSfida');
var btnCerca = document.getElementById('btnSignSearch');

var btnStats = document.getElementById('btnStatsSearch');
var btnClassifica = document.getElementById('vediClassifica');
//GAME DIV ELEMENT
var gameDiv = document.getElementById("gameDiv");
var simbolo = "";
var roomName;
var turno;
var opponent;

var table = document.getElementById("statsTable");
var tableClassifica = document.getElementById("tableClassifica");
var tableHistory = document.getElementById("tableHistory");

//window.onbeforeunload = onbeforeunload_handler;
//window.onunload = onunload_handler;


function mostraStatistiche() {

    lobbyDiv.style.display = "none";
    dati.style.display = "block";

}

function mostraLobby() {

    lobbyDiv.style.display = "inline";
    dati.style.display = "none";
    classifica.style.display = "none";

}

function mostraClassifica()
{
  lobbyDiv.style.display = "none";
  classifica.style.display = "block";
}


//EVENTI EMESSI AGLI ELEMENTI
btnLogin.addEventListener('click', function () { //assegno evento al bottone
    console.log("btn login");
    var logUsername = document.getElementById('logUsername');
    var logPwd = document.getElementById('logPwd');
    if(logUsername.value.trim() !== "" && logPwd.value.trim() !== "") {
        socket.emit('login', { //passo nome dell'evento 'login' e parametri da inviare
            logUsername: logUsername.value.trim(),
            logPwd: logPwd.value.trim(),
        });
        document.getElementById("username").innerHTML=logUsername.value;
    }
    else
        alert("RIEMPIERE I CAMPI CORRETTAMENTE !!!")
});

btnSign.addEventListener('click',function(){ //assegno evento al bottone
    var signUsername = document.getElementById('signUsername');
    var signPwd = document.getElementById('signPwd');
    if(signUsername.value.trim() !== "" && signPwd.value.trim() !== ""){
        socket.emit('signup', { //passo nome dell'evento 'signup' e parametri da inviare
            signUsername: signUsername.value.trim(),
            signPwd: signPwd.value.trim(),
        });
          document.getElementById("username").innerHTML=signUsername.value;
    }else
    alert("RIEMPIERE I CAMPI CORRETTAMENTE !!!")
});

//quando clicco su sfida prendo l'utente selezionato e inizializzo una socket di tipo reqSfida disablitado il pulsante di sfida per non creare problemi di sessioni doppie
btnSfida.addEventListener('click',function(){
    if(select.selectedIndex >= 0){
        btnSfida.disabled = true;
        var strUser = select.options[select.selectedIndex].value;
        socket.emit('reqSfida', { //come parametro invio al server il nome di chi ha richiesto la sfida e il nome dell'invitato
            reciverName: strUser,
            senderName: username,
        });
        alert('Il messaggio di sfida è stato inviato. Attendi la risposta.');
    }
    else
        alert("Per poter inviare un messaggio di sfida bisogna selezionare un utente.");
});




//LISTA EVENTI IN ASCOLTO

//EVENTO LOGIN
socket.on('login', function(data){ //dalle socket prendo quella con evento 'login' e prendo i dati ricevuti
    if(data.status) {
        username = data.username;
        loginDiv.style.display = 'none';
        lobbyDiv.style.display = 'inline';

        socket.emit('classifica', {
            blank: "",
        });

    } else {
        alert(data.reason);
    };
});

//EVENTI REGISTRAZIONE
socket.on('signup', function(data){ //dalle socket prendo quella con evento 'signup' e prendo i dati ricevuti
   console.log("risposta");
   console.log(data.status);
    if(data.status) {
        username = data.username;
        alert("REGISTRAZIONE EFFETTUATA CON SUCCESSO");
        loginDiv.style.display = 'none';
        lobbyDiv.style.display = 'inline';

        socket.emit('classifica', {
            blank: "",
        });

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
socket.on('storico', function(data){ //dalle socket prendo quella con evento 'login' e prendo i dati ricevuti
     console.log('ho ricevuto lo storico aggiornato');
     var tbody = document.getElementById('tBodyHistoryId');
     tbody.innerHTML = "";
     var rowHead = tableHistory.insertRow(0);
     rowHead.setAttribute("id","resultHeadHistory");
     var cell1 = rowHead.insertCell(0);
     var cell2 = rowHead.insertCell(1);
     var cell3 = rowHead.insertCell(2);
     cell1.innerHTML = "IL TUO PROFILO";
     cell2.innerHTML = "AVVERSARIO";
     cell3.innerHTML = "RISULTATO";

    var rows = data.rows;
    var currentUser = data.username;
    var numberRow =  -1;


    if(data.status) {

        for (i = 0; i < rows.length; i++) {
            var row = tbody.insertRow(numberRow);
            var profile = row.insertCell(numberRow);
            var opponent =  row.insertCell(numberRow);
          //  var data =  row.insertCell(numberRow);
            var risultato =  row.insertCell(numberRow);
            //avversario
            var result = "";
            var opponent_string = "";

            console.log(rows[i].first_user);
            console.log(rows[i].second_user);
            console.log(username);

            if(username == rows[i].first_user)
            {
               result = rows[i].result_first_user;
               opponent_string = rows[i].second_user;
            }

            if(username == rows[i].second_user)
            {
              result = rows[i].result_second_user;
              opponent_string = rows[i].first_user;
            }

            profile.innerHTML = username;
            opponent.innerHTML = opponent_string;
            var dateToSubString = rows[i].date;
            //data.innerHTML = dateToSubString.substring(0, 10);

            if(result == 1)
            {
              result = "Vittoria";
            }
            if(result == 2)
            {
              result = "Sconfitta";
            }

            if(result == 3)
            {
              result = "Pareggio";
            }

            risultato.innerHTML = result;
        }

    } else {
        alert("Errore nel caricamento della classifica e statistiche");
    }
});

//RICEZIONE SFIDA
//mi arriva la richiesta di sfida
socket.on('reqSfida', function(data){
    var sfida =  window.confirm('Hai ricevuto un messaggio di sfida da '+ data.senderName + ', accetti ?');
    var esito;
    if (sfida == true) {
        esito = true;
    } else {
        esito = false;
    }
    //esito = false;

    //rispondo alla sfida
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
        alert("Messaggio di sfida accettato , la partita si giocherà nella stanza : "+ data.roomName);
        lobbyDiv.style.display = 'none';
        gameDiv.style.display = 'inline';
        gameMessage.style.display = 'inline';
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
        alert("Messaggio di sfida rifiutata. Sfida un altro utente");
});

//client che invia un messaggio
form.addEventListener('submit', function(e) {
     console.log("richiesta messaggio lato client");
     var sender = document.getElementById("username").innerHTML;
     e.preventDefault();
     if (input.value) {

       socket.emit('chat message', {
           roomName: roomName,
           message: sender + ": "+input.value,
       });
         input.value = "";

     }
   });


//statistiche
btnStats.addEventListener('click', function () {
    var tbody = document.getElementById('tBodyId').innerHTML = "";

    var username = document.getElementById('usernamePlayer');
    var fromDate = document.getElementById('fromDate');
    var toDate = document.getElementById('toDate');
    if (username.value.trim() !== "" && fromDate.value.trim() !== "" && toDate.value.trim() !== "") {
        socket.emit('search', {
            username: username.value.trim(),
            fromDate: fromDate.value.trim(),
            toDate: toDate.value.trim(),
        });

    }
    else
        alert("RIEMPIERE I CAMPI CORRETTAMENTE !!!")
});

socket.on('search', function(data){
  console.log("ho ricevuto una statistica");

  var rowHead = table.insertRow(0);
  rowHead.setAttribute("id","resultHead");
//  rowHead.className = 'tr#resultHead';
  var cell1 = rowHead.insertCell(0);
  var cell2 = rowHead.insertCell(1);
  var cell3 = rowHead.insertCell(2);
  cell1.innerHTML = "AVVERSARIO";
  cell2.innerHTML = "RISULTATO";
  cell3.innerHTML = "DATA";

  if(data.status){
  var username = data.username;
  var rows = data.rows;
 //stats
  var win = 0;
  var lose = 0;
  var draw = 0;
  var perWin = 0;
  var perLose = 0;
  var perDraw = 0;
  var match = rows.length;

  for (i = 0; i < rows.length; i++) {
    var opponent = "";
    var result = "";
    var date = rows[i].date;
    var player1 = rows[i].first_user;
    var player2 = rows[i].second_user;
    var result1 = rows[i].result_first_user;
    var result2 = rows[i].result_second_user;

    if(username == player2)
    {
      opponent = player2;
      result = result1;

    }
    else
    {
      opponent = player1;
      result = result2;
    }

    if(result == 1)
    {
      result = "Vittoria";
      win = win + 1;
    }
    if(result == 2)
    {
      result = "Sconfitta";
      lose = lose + 1;
    }

    if(result == 3)
    {
      result = "Pareggio";
      draw = draw + 1;
    }

    var row = table.insertRow(1);
    var cell1 = row.insertCell(0);
    var cell2 = row.insertCell(1);
    var cell3 = row.insertCell(2);
    cell1.innerHTML = opponent;
    cell2.innerHTML = result;
    cell3.innerHTML = date.substring(0, 10);
  }

 }

});



socket.on('classifica', function(data){
  console.log("ho ricevuto la classifica");
  var tbody = document.getElementById('tBodyClassificaId').innerHTML = "";
  var rowHead = tableClassifica.insertRow(0);
  rowHead.setAttribute("id","resultHeadClassifica");
//  rowHead.className = 'tr#resultHead';
  var cell1 = rowHead.insertCell(0);
  var cell2 = rowHead.insertCell(1);
  var cell3 = rowHead.insertCell(2);
  var cell4 = rowHead.insertCell(3);
  var cell5 = rowHead.insertCell(4);
  cell1.innerHTML = "Posizione";
  cell2.innerHTML = "Utente";
  cell3.innerHTML = "Vittorie";
  cell4.innerHTML = "Pareggi";
  cell5.innerHTML = "Sconfitte";

  if(data.status){
  var position = data.rows.length;
  for (i = 0; i < data.rows.length; i++) {
    console.log(data.rows);
    var row = tableClassifica.insertRow(1);
    var cell5 = row.insertCell(0);
    var cell1 = row.insertCell(1);
    var cell2 = row.insertCell(2);
    var cell3 = row.insertCell(3);
    var cell4 = row.insertCell(4);

    cell1.innerHTML = data.rows[i].user;
    cell2.innerHTML = data.rows[i].win;
    cell3.innerHTML = data.rows[i].tie;
    cell4.innerHTML = data.rows[i].defeat;
    cell5.innerHTML = position;
    position = position - 1;
  }
}


});
