const http = require("http"),
  express = require("express"),
  app = express(),
  socketIo = require("socket.io");
const fs = require("fs");
var mysql = require('mysql');

const server = http.Server(app).listen(8080);
const io = socketIo(server);
const clients = {};

var socketList = {}; //LISTA DELLE SOCKET
var onlineUser = {}; //LISTA UTENTI ONLINE
var roomName = []; //LISTA NOMI DELLE ROOM

var connection = mysql.createConnection({
    host: 'mysql-trisonline.alwaysdata.net',
    user: '258797_gg',
    password: 'GabrieleGiovanni!1',
    database: 'trisonline_esame'
});

connection.connect(function (error) {
    if (!!error) {
        console.log('Error connession to db');
    } else {
        console.log('Connected to db');
    }
});

app.use(express.static(__dirname + "/../client/"));
app.use(express.static(__dirname + "/../node_modules/"));

app.get("/", (req, res) => {
  // res.sendFile("index.html", { root: __dirname + "/../client" });
  const stream = fs.createReadStream(__dirname + "/../client/login.html");
  stream.pipe(res);
});


//mettiamo qui dentro tutto
io.on("connection", function(socket) {

    console.log('entra');
    //Disconessione
    socket.on('disconnect', function () {
        if (socket.id in socketList) {
            delete socketList[socket.id];
            console.log("Guest Disconnesso");
        }
        for (var key in onlineUser) { //TOLGO L'UTENTE DALLA LISTA ONLINE
            if (onlineUser[key].userSocket.id == socket.id) {
                console.log("Utene: " + key + " Disconnesso");
                delete onlineUser[key];
                getList();
            }
        }
    });

    //RICHIESTA Login
    socket.on('login', function (data) {
        console.log('fatto il login');
        var online = false;
        for (var key in onlineUser) {
            if (data.logUsername == key) { //CONTROLLO CHE L'USERNAME NON SIA GIA' LOGGATO
                online = true;
            }
        }
        if (!online) {
            connection.query("SELECT * FROM user WHERE name like '" + data.logUsername + "' AND password like '" + data.logPwd + "'", function (error, rows, field) {
                if (error) {
                    console.log('Error in the Query');
                } else {
                    console.log('Success Query');
                    //console.log(rows);
                    if (rows.length > 0) { //Controllo che non sia gi� loggato
                        io.to(socket.id).emit('login', { //Rispondo a quella socket con evento login
                            status: true,
                            username: rows[0].name,
                        });
                        addUserOnline(rows[0].name, socket);
                        getRanking();
                    } else {
                        io.to(socket.id).emit('login', { //rispondo allo specifico client
                            status: false,
                            reason: "USERNAME O PASSWORD ERRATI",
                        });
                    }
                }
            });
        } else {
            io.to(socket.id).emit('login', { //rispondo allo specifico client
                status: false,
                reason: "UTENTE GIA ONLINE",
            });
        }
    });

        //RICHIESTA REGISTRAZIONE
        socket.on('signup', function (data) {
            connection.query("INSERT INTO UTENTE (name, pwd) VALUES ('" + data.signUsername + "','" + data.signPwd + "')", function (err, rows, field) {
                if (err) {
                    console.log(err);
                    io.to(socket.id).emit('signup', { //rispondo allo specifico client
                        status: false,
                    });
                }
            });
            connection.query(`INSERT INTO SCORE (userName, win, draw, defeat) VALUES ('${data.signUsername}',0,0,0);`, function (err, rows, field) {
                if (err) {
                    console.log(err);
                } else {
                    console.log(data.signUsername);
                    io.to(socket.id).emit('signup', { //Rispondo a quella socket con evento login
                        status: true,
                        username: data.signUsername,
                    });
                    addUserOnline(data.signUsername, socket);
                    getRanking();
                }
            });
        });
        //RICHIESTA SFIDA UN UTENTE
        socket.on('reqSfida', function (data) {
            for (var key in onlineUser) {
                if (key == data.reciverName) { //invio richiesta a specifico client
                    setUserStatus(data.reciverName); //UTENTE IMPEGNATO
                    setUserStatus(data.senderName); //UTENTE IMPEGNATO
                    getList();
                    console.log("SFIDANTI: " + data.reciverName + data.senderName)
                    onlineUser[key].userSocket.emit('reqSfida', {
                        senderName: data.senderName,
                        reciverName: data.reciverName,
                    });
                }
            }
        });
        //SE SI ACCETTA LA SFIDA SI ENTRA NELLA STESSA ROOM
        socket.on('respSfida', function (data) {
            if (data.esito == true) {
                var nameRoom = getNameRoom();
                for (var key in onlineUser) {
                    if (key == data.senderName || key == data.reciverName) {
                        onlineUser[key].userSocket.join(nameRoom);
                    }
                }
                io.to(nameRoom).emit('inizialize', {
                    roomName: nameRoom,
                    esito: true, //Nel client controller� che la sfida � stata accettata
                    reciverName: data.reciverName,
                    senderName: data.senderName, // COLUI CHE HA INIZIATO LA SFIDA AVRA' X
                });
            }
            else {//SFIDA NON ACCETTATA
                onlineUser[data.senderName].userSocket.emit('inizialize', {
                    esito: false, //Nel client controller� che la sfida � stata accettata
                });
                //RIMETTERE UTENTI DISPONIBILI
                setUserStatus(data.reciverName); //UTENTE NON IMPEGNATO
                setUserStatus(data.senderName); //UTENTE NON IMPEGNATO
                getList();
            }
        });
        //MOSSA EFFETTUATA
        socket.on('mossa', function (data) {
            io.to(data.roomName).emit('mossa', data);
        });
        //ASSEGNAMO PUNTEGGIO
        socket.on('winner', function (data) {
            setUserStatus(data.player1);
            setUserStatus(data.player2);
            getList();
            console.log(data.winner + data.esito);
            if (data.esito == "draw")//ASSEGNARE PAREGGIO AD ENTRAMBI
            {
                updatePoints(data.player1, "draw");
                updatePoints(data.player2, "draw");
            } else {
                if (data.winner == data.player1) {
                    updatePoints(data.player1, "win");
                    updatePoints(data.player2, "defeat");
                }
                else {
                    updatePoints(data.player1, "defeat");
                    updatePoints(data.player2, "win");
                }
            }
            //getRanking();
        });
        //AGGIORNARE PUNTEGGIO IN BASE AL RISULTATO DELLA PARTITA
        function updatePoints(username, result) {
            connection.query("UPDATE SCORE SET " + result + " = " + result + "+1  WHERE userName = '" + username + "'", function (err) {
                if (err) {
                    console.log(err);
                }
                else {
                    console.log('Punteggio Aggiornato');
                }
            });
        }
        //AGGIUNGERE UTENTE ALLA LISTA UTENTI ONLINE DEL SEVER
        function addUserOnline(username, userSocket) {
            onlineUser[username] = {
                userSocket: userSocket,
                status: false, //Utilizzato per controllare se utente non impegnato
            };
            console.log("UTENTI ONLINE: " + Object.keys(onlineUser).length);
            getList(); // Invia Lista Utenti
        }
        //COMUNICA AI CLIENT LA NUOVA LISTA DI UTENTI ONLINE NON IMPEGNATI
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
        //COMUNICA CLASSIFICA
        /*function getRanking() {
            connection.query("SELECT * FROM SCORE WHERE win != 0 OR draw != 0 OR defeat != 0" +
                " ORDER BY SCORE.win DESC, SCORE.draw DESC, SCORE.defeat ASC", function (error, rows, field) {
                    if (error) {
                        console.log('Error in the Query');
                    } else {
                        if (rows.length > 0) {
                            io.sockets.emit('ranking', {
                                status: true,
                                rows: rows,
                            });
                        } else {
                            io.sockets.emit(socket.id).emit('ranking', {
                                status: false,
                            });
                        }
                    }
                });
        }*/
        //SETTARE STATUS DELL' UTENTE SE IMPEGNATO O NO
        function setUserStatus(nameuser) {
            for (var key in onlineUser) {
                if (key == nameuser) { //CERCO L'UTENTE
                    onlineUser[key].status = !onlineUser[key].status; //UTENTE IMPEGNATO
                }
            }
            //getList();
        }
        //SI OTTIENE IL NOME DELLA ROOM DIFFERENTE DALLE ALTRE
        function getNameRoom() {
            if (roomName.length > 0) {
                var newRoom = "" + (parseInt(roomName[roomName.length - 1], 10) + 1); //Aumento di 1 la stanza
                roomName.push(newRoom);
            }
            else {
                newRoom = "1";
                roomName.push(newRoom);
            }
            return newRoom;
        }
});
