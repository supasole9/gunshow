const express = require('express');

const app = express();
app.use(express.static("front"));
var server = app.listen(process.env.PORT || 8080, function () {
  console.log("server started");
});

const WebSocket = require('ws');
const wss = new WebSocket.Server({ 'server': server });

const playerList = [];
const gameList = [];

function Player (data, ws) {
  this.name = data.name,
  this.playing = false,
  this.ws = ws,
  this.playerAmmo = 0;
}

var gameid = function () {
  var string = "";
  var alphabets = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (var i = 0; i < 6; i++) {
    string += alphabets.charAt(Math.floor(Math.random() * alphabets.length ));
  }
  return string
}

function Game(player1, player2) {
  this.gameEnd = false,
  this.player1 = player1,
  this.player2 = player2,
  this.player1move = "";
  this.player2move = "";
  this.player1shield = 5;
  this.player2shield = 5;
  this.gameID = gameid();
};

wss.broadcast = function broadcast(data) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
};

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(data) {
    var json = JSON.parse(data);
    if (json.action == "newUser") {
      var p = new Player(json, ws);
      confirmSignIn(json, ws);
      gamefind(p);
      playerList.push(p);
    } else if (json.action == "action") {
      compareActions(ws, json.move, json.gameId)
    } else if (json.action == "newGame") {
      for (var nuts in playerList) {
        if (ws == playerList[nuts].ws) {
          playerList[nuts].playing = false;
          gamefind(playerList[nuts])
        } else {
          console.log("player not in playerlist")
        }
      }
    } else {
      console.log(json);
    }
  });
});

var confirmSignIn = function (playerData, websocket) {
  websocket.send(JSON.stringify({
    action: "signupSuccess"
  }))
}

var gamefind = function (person) {
  for (var aa in playerList) {
    var pp = playerList[aa];
    if (pp.playing == false && person.ws != pp.ws) {
      person.playing = true;
      pp.playing = true;
      var newGame = new Game(pp, person);
      gameList.push(newGame);
      newGame.player1.ws.send(JSON.stringify( {action: "newGame", gameID: newGame.gameID, playerAmmo: 0, opponentName: person.name, gameshield: newGame.player1shield} ));
      newGame.player2.ws.send(JSON.stringify( {action: "newGame", gameID: newGame.gameID, playerAmmo: 0, opponentName: pp.name, gameshield: newGame.player2shield} ));
    }
  } return
};

var compareActions = function (ws, move, gameId) {
  for (game in gameList) {
    if (gameList[game].gameID == gameId) {
      if (gameList[game].player1.ws == ws) {
        gameList[game].player1move = move;
      } else {
        gameList[game].player2move = move;
      }

      while (gameList[game].player1move && gameList[game].player2move) {
        if (gameList[game].player1move == "shoot" && gameList[game].player2move == "shoot") {
          gameList[game].player1.ws.send(JSON.stringify( {action: "result", gameEnd: true, draw: true, opponentMove:gameList[game].player2move} ));
          gameList[game].player2.ws.send(JSON.stringify( {action: "result", gameEnd: true, draw: true, opponentMove:gameList[game].player1move} ));
          gameList[game].player1move = "";
          gameList[game].player2move = "";
          gameList[game].gameEnd = true;
          return
        } else if (gameList[game].player1move == "shoot" && gameList[game].player2move == "block") {
          gameList[game].player2shield -= 1;
          console.log(gameList[game].player2shield);
          if (gameList[game].player2shield == -1) {
            gameList[game].player1.ws.send(JSON.stringify( { action: "result", gameEnd: true, winner: true, opponentMove:gameList[game].player2move} ));
            gameList[game].player2.ws.send(JSON.stringify( { action: "result", gameEnd: true, loser: true,opponentMove:gameList[game].player1move} ));
            return
          } else {
            gameList[game].player1.ws.send(JSON.stringify( {predicate: "shoot", opponentMove:gameList[game].player2move, action: "play", playerAmmo: 1} ));
            gameList[game].player2.ws.send(JSON.stringify( {predicate: "block", opponentMove:gameList[game].player1move, action: "play", gameshield: 1} ));
            gameList[game].player1move = "";
            gameList[game].player2move = "";
            return
          }
        } else if (gameList[game].player1move == "shoot" && gameList[game].player2move == "reload") {
          gameList[game].player1.ws.send(JSON.stringify( { action: "result", gameEnd: true, winner: true, opponentMove:gameList[game].player2move} ));
          gameList[game].player2.ws.send(JSON.stringify( { action: "result", gameEnd: true, loser: true,opponentMove:gameList[game].player1move} ));
          gameList[game].gameEnd = true;
          return
        } else if (gameList[game].player2move == "shoot" && gameList[game].player1move == "block") {
          gameList[game].player1shield -= 1;
          console.log(gameList[game].player1shield);
          if (gameList[game].player1shield == -1) {
            gameList[game].player2.ws.send(JSON.stringify( { action: "result", gameEnd: true, winner: true, opponentMove:gameList[game].player1move} ));
            gameList[game].player1.ws.send(JSON.stringify( { action: "result", gameEnd: true, loser: true,opponentMove:gameList[game].player2move} ));
            return
          } else {
            gameList[game].player1.ws.send(JSON.stringify( {predicate: "block", opponentMove:gameList[game].player2move, action: "play", gameshield: 1} ));
            gameList[game].player2.ws.send(JSON.stringify( {predicate: "shoot", opponentMove:gameList[game].player1move, action: "play", playerAmmo: 1} ));
            gameList[game].player1move = "";
            gameList[game].player2move = "";
            return
          }
        } else if (gameList[game].player2move == "shoot" && gameList[game].player1move == "reload") {
          gameList[game].player1.ws.send(JSON.stringify( { action: "result", gameEnd: true, loser: true , opponentMove:gameList[game].player2move} ));
          gameList[game].player2.ws.send(JSON.stringify( { action: "result", gameEnd: true, winner: true, opponentMove:gameList[game].player1move } ));
          gameList[game].gameEnd = true;
          return
        } else if (gameList[game].player2move == "reload" && gameList[game].player1move == "reload") {
          gameList[game].player1.ws.send(JSON.stringify( {predicate: "reload", opponentMove:gameList[game].player2move, action: "play", playerAmmo: 1} ));
          gameList[game].player2.ws.send(JSON.stringify( {predicate: "reload", opponentMove:gameList[game].player1move, action: "play", playerAmmo: 1} ));
          gameList[game].player1move = "";
          gameList[game].player2move = "";
          return
        } else if (gameList[game].player2move == "block" && gameList[game].player1move == "block") {
          gameList[game].player1.ws.send(JSON.stringify( {predicate: "block", opponentMove:gameList[game].player2move, action: "play", gameshield: 0} ));
          gameList[game].player2.ws.send(JSON.stringify( {predicate: "block", opponentMove:gameList[game].player1move, action: "play", gameshield: 0} ));
          gameList[game].player1move = "";
          gameList[game].player2move = "";
          return
        } else if (gameList[game].player2move == "reload" && gameList[game].player1move == "block") {
          gameList[game].player1.ws.send(JSON.stringify( {predicate: "block", opponentMove:gameList[game].player2move, action: "play", gameshield: 0} ));
          gameList[game].player2.ws.send(JSON.stringify( {predicate: "reload", opponentMove:gameList[game].player1move, action: "play", playerAmmo: 1} ));
          gameList[game].player1move = "";
          gameList[game].player2move = "";
          return
        } else if (gameList[game].player1move == "reload" && gameList[game].player2move == "block") {
          gameList[game].player1.ws.send(JSON.stringify( {predicate: "reload", opponentMove:gameList[game].player2move, action: "play", playerAmmo: 1} ));
          gameList[game].player2.ws.send(JSON.stringify( {predicate: "block", opponentMove:gameList[game].player1move, action: "play", gameshield: 0} ));
          gameList[game].player1move = "";
          gameList[game].player2move = "";
          return
        }
      }
    }
  }
};

var check = function () {
  setInterval(function () {
    for (var i = 0; i < playerList.length; i++) {
      if (playerList[i].ws.readyState === WebSocket.CLOSED) {
        playerList.splice(playerList[i],1)
        console.log("removed")
      }
    }
  }, 1000);
};

check();
