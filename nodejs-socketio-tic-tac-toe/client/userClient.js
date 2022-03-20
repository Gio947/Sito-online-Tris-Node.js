//var socket = io.connect('http://localhost:8080'); //IN LOCALE
var socket = io.connect('https://trisonline.herokuapp.com'); //SU HEROKU

//elementi della login/signup
var btnSign = document.getElementById('btnSign');
var btnLogin = document.getElementById('btnLogin');
var loginDiv = document.getElementById('loginDiv');

//elementi della lobby
var lobbyDiv = document.getElementById('lobbyDiv');
var messageDiv = document.getElementById('gameMessage');
var datas = document.getElementById('dati');
var ranking = document.getElementById('classifica');
var select = document.getElementById("slct");
var tableRanking = document.getElementById("ranking");
var btnChallenge = document.getElementById('btnSfida');
var btnSearch = document.getElementById('btnSignSearch');

//elementi del game div
var gameDiv = document.getElementById("gameDiv");

//variabili per la partita
var symbol = "";
var roomName;
var round;
var opponent;

//elementi per le statistiche
var btnStats = document.getElementById('btnStatsSearch');
var btnClassifica = document.getElementById('vediClassifica');
var table = document.getElementById("statsTable");
var tableClassifica = document.getElementById("tableClassifica");
var tableHistory = document.getElementById("tableHistory");
var statistic = document.getElementById('rowStats');

//elementi per la chat di gioco
var messages = document.getElementById('messages');
var form = document.getElementById('form');
var input = document.getElementById('input');

function mostraStatistiche() {
    lobbyDiv.style.display = "none";
    datas.style.display = "block";
}

function mostraLobby() {
    lobbyDiv.style.display = "inline";
    datas.style.display = "none";
    ranking.style.display = "none";
}

function mostraClassifica() {
    lobbyDiv.style.display = "none";
    ranking.style.display = "block";
}

//assegno evento al bottone per il login
btnLogin.addEventListener('click', function () {
    console.log("btn login");
    var logUsername = document.getElementById('logUsername');
    var logPwd = document.getElementById('logPwd');
    if (logUsername.value.trim() !== "" && logPwd.value.trim() !== "") {
        socket.emit('login', {
            logUsername: logUsername.value.trim(),
            logPwd: logPwd.value.trim(),
        });
        document.getElementById("username").innerHTML = logUsername.value;
    }
    else {
        alert("Riempire tutti i campi");
    }
});

//assegno evento al bottone per la registrazione
btnSign.addEventListener('click',function(){
    var signUsername = document.getElementById('signUsername');
    var signPwd = document.getElementById('signPwd');
    if (signUsername.value.trim() !== "" && signPwd.value.trim() !== "") {
        socket.emit('signup', {
            signUsername: signUsername.value.trim(),
            signPwd: signPwd.value.trim(),
        });
        document.getElementById("username").innerHTML = signUsername.value;
    } else {
        alert("Riempire tutti i campi");
    }
});

//aggiungo l'evento per la richiesta di sfida
btnChallenge.addEventListener('click',function(){
    if (select.selectedIndex >= 0) {
        //il bottone viene poi disabilitato
        btnChallenge.disabled = true;
        var strUser = select.options[select.selectedIndex].value;
        socket.emit('reqSfida', {
            reciverName: strUser,
            senderName: username,
        });
        alert('Il messaggio di sfida è stato inviato. Attendi la risposta.');
    }
    else {
        alert("Per poter inviare un messaggio di sfida bisogna selezionare un utente.");
    }
});

//socket in ascolto per il login
socket.on('login', function(data){
    if(data.status) {
        username = data.username;
        loginDiv.style.display = 'none';
        lobbyDiv.style.display = 'block';

        socket.emit('classifica', {
            blank: "",
        });
    } else {
        alert(data.reason);
    }
});

//socket in ascolto per la registrazione
socket.on('signup', function(data){
    console.log("ricevuto signup");

    if(data.status) {
        username = data.username;
        alert("Registrazione eseguita con successo");
        loginDiv.style.display = 'none';
        lobbyDiv.style.display = 'block';

        socket.emit('classifica', {
            blank: "",
        });

    } else {
        alert("Questo username è già esistente. Riprova cambiando username");
    }
});

//aggiorno la lista di utenti online
socket.on('updateList', function(data){
    var list = JSON.parse(data.userList);
    select.innerHTML = "";

    for (i = 0; i < list.length; i++) {
        //Controllo di non aggiungere il nome del seguente utente
        if(list[i] !== username) { 
            var option = document.createElement("option");
            option.text = list[i];
            option.value = list[i];
            select.add(option);
        }
    }
});

//socket in ascolto per ricevere lo storico
socket.on('storico', function(data){
     console.log('ho ricevuto lo storico aggiornato');
     var tbody = document.getElementById('tBodyHistoryId');
     tbody.innerHTML = "";
     var rowHead = tableHistory.insertRow(0);
     rowHead.setAttribute("id","resultHeadHistory");
     var cell1 = rowHead.insertCell(0);
     var cell2 = rowHead.insertCell(1);
     var cell3 = rowHead.insertCell(2);
     var cell4 = rowHead.insertCell(3);
     cell1.innerHTML = "IL TUO PROFILO";
     cell2.innerHTML = "AVVERSARIO";
     cell3.innerHTML = "RISULTATO";
     cell4.innerHTML = "DATA PARTITA";

    var rows = data.rows;
    var currentUser = data.username;
    var numberRow =  -1;

    if(data.status) {
        for (i = 0; i < rows.length; i++) {
            var row = tbody.insertRow(numberRow);
            var profile = row.insertCell(numberRow);
            var opponent =  row.insertCell(numberRow);
            var risultato =  row.insertCell(numberRow);
            var data =  row.insertCell(numberRow);
            //avversario
            var result = "";
            var opponent_string = "";

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
            data.innerHTML = rows[i].date;

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
    }else {
        alert("Errore nel caricamento della classifica e statistiche");
    }
});

//socket in ascolto per ricevere la richiesta si sfida
socket.on('reqSfida', function(data){
    var sfida =  window.confirm('Hai ricevuto un messaggio di sfida da '+ data.senderName + ', accetti?');
    var esito;
    if (sfida == true) {
        esito = true;
    } else {
        esito = false;
    }
    
    //socket risponde alla richiesta di sfida
    socket.emit('respSfida', {
        reciverName: data.reciverName,
        senderName: data.senderName,
        esito: esito,
    });
});

//inizializzazione del game div e quindi della partita
socket.on('inizialize', function(data){
    btnChallenge.disabled = false;
    if (data.esito) {
        alert("Messaggio di sfida accettato. La partita iniziera' adesso");
        lobbyDiv.style.display = 'none';
        datas.style.display = 'none';
        ranking.style.display = 'none';
        gameDiv.style.display = 'block';
        gameMessage.style.display = 'inline';

        if (data.senderName == username) {
            symbol = "X";
            round = true;
            opponent = data.reciverName;
        }
        else {
            symbol = "O";
            round = false;
            opponent = data.senderName;
        }
        roomName = data.roomName;
        document.getElementById("avversario").innerHTML = "Avversario : " + opponent;
    }
    else {
        alert("Messaggio di sfida rifiutata. Sfida un altro utente");
    }
});

//aggiungo l'evento per inviare messaggi nella chat
form.addEventListener('submit', function(e) {
     console.log("richiesta messaggio lato client");
     var sender = document.getElementById("username").innerHTML;
     e.preventDefault();
     if (input.value) {
           socket.emit('chat message', {
               roomName: roomName,
               message: sender + " : " + input.value,
           });
           input.value = "";
     }
});


//aggiungo l'evento per le statistiche
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
    else {
        alert("Riempire tutti i campi");
    }
});

//socket in ascolto per ricevere la ricerca di un utente
socket.on('search', function(data){
      console.log("ho ricevuto una statistica");
      var rowHead = table.insertRow(0);
      rowHead.setAttribute("id","resultHead");
      var cell1 = rowHead.insertCell(0);
      var cell2 = rowHead.insertCell(1);
      var cell3 = rowHead.insertCell(2);
      cell1.innerHTML = "AVVERSARIO";
      cell2.innerHTML = "RISULTATO";
      cell3.innerHTML = "DATA";

      if(data.status){
          var username = data.username;
          var rows = data.rows;
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
            cell3.innerHTML = date;
          }
     }
});

//socket in ascolto per ricevere la classifica
socket.on('classifica', function(data){
      console.log("ho ricevuto la classifica");
      var tbody = document.getElementById('tBodyClassificaId').innerHTML = "";
      var rowHead = tableClassifica.insertRow(0);
      rowHead.setAttribute("id","resultHeadClassifica");

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
