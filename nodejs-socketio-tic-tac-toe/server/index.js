const http = require("http"),
express = require("express"),
app = express(),
socketIo = require("socket.io");
const fs = require("fs");
var mysql = require('mysql');
const server = http.Server(app).listen(process.env.PORT || 8080);
const io = socketIo(server);
const clients = {};

var socketList = {};
var onlineUser = {};
var roomName = [];
var connnection = null;

console.log("Server - start");

//0 - configurazione app
appAndFileSetting()

//1 - connessione al db
dbConnection();

//2 - esecuzione del Server
executeServer();



function dbConnection() {
      connection = mysql.createConnection({
      host: 'mysql-trisonline.alwaysdata.net',
      user: '258797_gg',
      password: 'GabrieleGiovanni!1',
      database: 'trisonline_esame'
  });
  connection.connect(function (error) {
      if (!!error) {
          console.log('Server - Error connession to db');
      } else {
          console.log('Server - Connected to db');
      }
  });
}

function appAndFileSetting()
{
  console.log("Server - setting app and files...");
  app.use(express.static(__dirname + "/../client/"));
  app.use(express.static(__dirname + "/../node_modules/"));
  app.get("/", (req, res) => {
    const stream = fs.createReadStream(__dirname + "/../client/index.html");
    stream.pipe(res);
  });
}

function executeServer()
{

  console.log("Server - execute server...");

  io.on("connection", function(socket) {
            //disconnessione del socket ed eliminazione dalla lista di socket
        socket.on('disconnect', function() {
          if (socket.id in socketList) {
              delete socketList[socket.id];
              console.log("Server - Utente Disconnesso");
          }

          //elimino l'utente dalla lista degli utenti online
          for (var key in onlineUser) {
              if (onlineUser[key].userSocket.id == socket.id) {
                  console.log("Server - Utente: " + key + " ora offline");
                  delete onlineUser[key];
                  getList();
              }
          }
        });

        //login : ricevo richiesta dal client di login, faccio una query e se esiste l'utente nel db rispondo al socket con un messaggio positivo facendolo loggare altrimenti nego l'accesso
        socket.on('login', function(data) {
          console.log('Server - new login request ');
          var query = "SELECT * FROM user WHERE name = '" + data.logUsername + "' AND password = '" + data.logPwd + "'";

          //eseguo la query
          connection.query(query, function(error, rows, field) {
              if (error) {
                  console.log('Server - login : Query error ' + error);
              } else {
                  //utente loggato
                  if (rows.length == 1) {
                      console.log("Server - login : user " + data.logUsername + " logged !!");
                      io.to(socket.id).emit('login', {
                          status: true,
                          username: rows[0].name,
                      });
                      addUserOnline(rows[0].name, socket);
                      getUserStatistics(rows[0].name);
                  } else {
                      console.log("Server - login : user " + data.logUsername + " not exist !!")
                      //utente non loggato
                      io.to(socket.id).emit('login', {
                          status: false,
                          reason: "USERNAME O PASSWORD ERRATI",
                      });

                  }
              }
          });

        });

        //registrazione : ricevo la richiesta dal client , provo a fare la query se riesco ad aggiungere l'utente rispondo al client con un messaggio positivo e lo faccio loggare altrimenti nego l'accesso
        socket.on('signup', function(data) {
          console.log("Server - signup request...");
          var query = "INSERT INTO user (name, password,registration_date) VALUES ('" + data.signUsername + "','" + data.signPwd + "' , 'curdate()')";
          connection.query(query, function(err, rows, field) {
              if (err) {
                  error = err;
                  console.log("Server - signup error : " + err);
                  io.to(socket.id).emit('signup', {
                      status: false,
                  });
              } else {

                  var queryScore = "INSERT INTO score VALUES ('0','0','0','" + data.signUsername + "','')";
                  console.log(queryScore);
                  connection.query(queryScore, function(err, rows, field) {
                      //se c'è un errore
                      if (err) {
                          error = err;
                          console.log("Server - signup error during create new score user : " + err);
                          io.to(socket.id).emit('signup', {
                              status: false,
                          });
                      } else {
                          io.to(socket.id).emit('signup', {
                              status: true,
                              username: data.signUsername,
                          });
                          console.log("Server - signup : new user : " + data.signUsername);
                          addUserOnline(data.signUsername, socket);
                          getUserStatistics(data.signUsername);
                      }

                  });
              }
          });


        });

        //il server riceve una richiesta di sfida che parte da pippo ed è indirizzata a topolino
        socket.on('reqSfida', function(data) {
          //mi prendo l'utente che ha come chiave il nome di chi invia e di chi riceve
          for (var key in onlineUser) {
              if (key == data.reciverName) { //invio richiesta a specifico client
                  setUserStatus(data.reciverName);
                  setUserStatus(data.senderName);
                  //aggiorno la lista degli utenti online
                  getList();
                  console.log("SFIDANTI: " + data.reciverName + data.senderName)
                  //l'utente specifico tramite il proprio socket invia la richiesta all'altro utente
                  onlineUser[key].userSocket.emit('reqSfida', {
                      senderName: data.senderName,
                      reciverName: data.reciverName,
                  });
              }
          }
        });

        //ho la risposta del destinatario se ha accettato entriamo in una room per giocare
        socket.on('respSfida', function(data) {
          if (data.esito == true) {
              var nameRoom = getNameRoom();
              for (var key in onlineUser) {
                  if (key == data.senderName || key == data.reciverName) {
                      onlineUser[key].userSocket.join(nameRoom);
                  }
              }
              io.to(nameRoom).emit('inizialize', {
                  roomName: nameRoom,
                  esito: true,
                  reciverName: data.reciverName,
                  senderName: data.senderName, //chi richiede la sfida avrà come simbolo la X
              });
          } else {
              onlineUser[data.senderName].userSocket.emit('inizialize', {
                  esito: false,
              });
              setUserStatus(data.reciverName);
              setUserStatus(data.senderName);
              getList();
          }
        });


        //gestione della mosssa da inviare in una room specifica
        socket.on('mossa', function(data) {
          io.to(data.roomName).emit('mossa', data);
        });

        //gestione del messaggio da inviare in una room specifica
        socket.on('chat message', function(data) {
          console.log("messaggio da inviare a un client");
          io.to(data.roomName).emit('chat message', data.message);
        });


        //assegnazione vincitore
        socket.on('winner', function(data) {
          console.log("partita finita");
          setUserStatus(data.player1);
          setUserStatus(data.player2);

          getList();
          console.log(data.winner + data.esito);
          if (data.esito == "draw")
          {
              updateUserScore(data.player1, 3);
              updateUserScore(data.player2, 3);
              updateHistory(data.player1, data.player2, 3, 3);
          } else {
              if (data.winner == data.player1) {
                  updateUserScore(data.player1, 1);
                  updateUserScore(data.player2, 2);
                  updateHistory(data.player1, data.player2, 1, 2);
              } else {
                  updateUserScore(data.player1, 2);
                  updateUserScore(data.player2, 1);
                  updateHistory(data.player1, data.player2, 2, 1);
              }
          }
          console.log("storico su db aggiornato");

          updateLastMatch(data.player1);
          updateLastMatch(data.player2);

          console.log("socket per aggiornamento storico inviate");
        });


        //in base all'id che identifica vittoria/sconfitta/pareggio aggiorno le statistiche dell'utente
        //1 : vittoria
        //2 : sconfitta
        //3 : pareggio

        function updateUserScore(username, idResult) {
          var typeResult = "";

          if (idResult == 1) {
              typeResult = "win";
          } else if (idResult == 2) {
              typeResult = "defeat";
          } else {
              typeResult = "tie";
          }

          var query = "UPDATE score SET " + typeResult + " = " + typeResult + "+1  WHERE user = '" + username + "'";

          connection.query(query, function(err) {
              if (err) {
                  console.log("Server updateUserScore error : " + err);
              } else {
                  console.log("Server updateUserScore : punteggio aggiornato ");
              }
          });
        }

        function updateLastMatch(player) {
          console.log(onlineUser[player].userSocket);
          var socket = onlineUser[player].userSocket;
          var username = player;
          var query = "SELECT id , first_user, second_user, result_first_user,  DATE_FORMAT(date, '%M %d %Y') AS date, result_second_user FROM history WHERE history.first_user = '" + username + "' OR history.second_user = '" + username + "' ORDER BY id DESC LIMIT 10";
          console.log(query);
          connection.query(query, function(error, rows, field) {
              if (error) {
                  console.log('Server - get search Error in the Query ' + error);
                  io.to(socket.id).emit('storico', {
                      status: false,
                  });

              } else {
                  console.log(rows);
                  io.to(socket.id).emit('storico', {
                      status: true,
                      rows: rows,
                      username: username,
                  });
              }
          });
        }

        function updateHistory(username1, username2, result1, result2) {
          var today = new Date();
          var dd = String(today.getDate()).padStart(2, '0');
          var mm = String(today.getMonth() + 1).padStart(2, '0');
          var yyyy = today.getFullYear();

          today = yyyy + '-' + mm + '-' + dd;
          var queryHistory = "INSERT into history VALUES('', '" + username1 + "', '" + username2 + "' , '" + today + "' , '" + result1 + "' , '" + result2 + "')";
          console.log(queryHistory);

          connection.query(queryHistory, function(err) {
              if (err) {
                  console.log("Server updateHistory error : " + err);
              } else {
                  console.log("Server updateHistory : storico partite aggiornato ! ");
              }
          });
        }


        //mostro l'utente online e disponibile per iniziare una partita
        function addUserOnline(username, userSocket) {
          onlineUser[username] = {
              userSocket: userSocket,
              status: false, //utente non impegnato
          };
          console.log("UTENTI ONLINE: " + Object.keys(onlineUser).length);
          getList(); // Invia Lista Utenti
        }
        //aggiorno i client su chi è disponibile
        function getList() {
          var list = [];
          for (var key in onlineUser) {
              if (onlineUser.hasOwnProperty(key) && onlineUser[key].status == false) { //Se status==false allora non � impegnato;
                  list.push(key);
              }
          }
          io.sockets.emit('updateList', {
              userList: JSON.stringify(list),
          });
        }
        //aggiorno lo storico dell'utente
        function getUserStatistics(username) {
          var query = "SELECT id , first_user, second_user, result_first_user, DATE_FORMAT(date, '%M %d %Y') AS date, result_second_user FROM history WHERE history.first_user = '" + username + "' OR history.second_user = '" + username + "' ORDER BY id DESC LIMIT 10";
          console.log(query);
          var socketUser = onlineUser[username].userSocket;
          connection.query(query, function(error, rows, field) {
              if (error) {
                  io.to(socketUser.id).emit('storico', {
                      status: false,
                  });
                  console.log('Server - get storico Error in the Query ' + error);
              } else {
                  console.log(rows);
                  io.to(socketUser.id).emit('storico', {
                      status: true,
                      rows: rows,
                      username: username,
                  });
              }
          });
        }
        //modifico lo stato dell'utenza (se è dispobibile in non disponibile e viceversa)
        function setUserStatus(nameuser) {
          for (var key in onlineUser) {
              if (key == nameuser) {
                  onlineUser[key].status = !onlineUser[key].status;
              }
          }
          //aggiorno la lista di utenti online
          getList();
        }
        //genero una room name non esistente : nella room giocaranno i due giocatori e si potranno scambiare socket di room
        function getNameRoom() {
          if (roomName.length > 0) {
              var newRoom = "" + (parseInt(roomName[roomName.length - 1], 10) + 1);
              roomName.push(newRoom);
          } else {
              newRoom = "1";
              roomName.push(newRoom);
          }
          return newRoom;
        }


        //funzione di ricerca di un utente specifico in un range di date
        socket.on('search', function(data) {
          var username = data.username;
          var fromDate = data.fromDate;
          var toDate = data.toDate;
          var query = "SELECT id , first_user, second_user, result_first_user,  DATE_FORMAT(date, '%M %d %Y') AS date, result_second_user FROM trisonline_esame.history WHERE (date BETWEEN '" + fromDate + "' AND '" + toDate + "') AND (first_user = '" + username + "' OR second_user = '" + username + "')";
          console.log(query);
          connection.query(query, function(error, rows, field) {
              if (error) {
                  console.log('Server - get search Error in the Query ' + error);
                  io.to(socket.id).emit('search', {
                      status: false,
                  });

              } else {
                  io.to(socket.id).emit('search', {
                      status: true,
                      rows: rows,
                      username: username,
                  });
              }
          });
        });

        //ritorno lo storico dell'utente in base all'username
        socket.on('storico', function(data) {
          var username = data.username;
          var query = "SELECT id , first_user, second_user, result_first_user,  DATE_FORMAT(date, '%M %d %Y') AS date, result_second_user FROM history WHERE history.first_user = '" + username + "' OR history.second_user = '" + username + "' ORDER BY date DESC LIMIT 10";
          console.log(query);
          connection.query(query, function(error, rows, field) {
              if (error) {
                  console.log('Server - get search Error in the Query ' + error);
                  io.to(socket.id).emit('storico', {
                      status: false,
                  });

              } else {
                  io.to(socket.id).emit('storico', {
                      status: true,
                      rows: rows,
                      username: username,
                  });
              }
          });
        });

        //aggiornamento della classifica utenti
        socket.on('classifica', function(data) {

          var query = "SELECT * FROM trisonline_esame.score order by win asc";
          console.log(query);
          connection.query(query, function(error, rows, field) {
              if (error) {
                  console.log('Server - get search Error in the Query ' + error);
                  io.sockets.emit('classifica', {
                      status: false,
                  });

              } else {
                  io.sockets.emit('classifica', {
                      status: true,
                      rows: rows,
                  });
              }
          });
        });

   });

}
