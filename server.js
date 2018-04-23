const WebSocket = require('ws');
const express = require('express');
const http = require('http');

const app = express();
const port = process.env.PORT || 8080;
const httpServer = http.createServer(app)
const wss = new WebSocket.Server({ 'server': httpServer });

const playerList = [];
const gameList = [];

function player (data, ws) {
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

function game(player1, player2) {
  this.gameEnd = false,
  this.player1 = player1,
  this.player2 = player2,
  this.player1move = "";
  this.player2move = "";
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
      var p = new player(json, ws);
      confirmSignIn(json, ws);
      gamefind(p);
      playerList.push(p);
    } else if (json.action == "action") {
      compareActions(ws, json.move, json.gameId)
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
    if (pp.playing == false) {
      person.playing = true;
      pp.playing = true;
      var newGame = new game(pp, person);
      gameList.push(newGame);
      newGame.player1.ws.send(JSON.stringify( {action: "newGame", gameID: newGame.gameID, playerAmmo: 0, opponentName: person.name} ));
      newGame.player2.ws.send(JSON.stringify( {action: "newGame", gameID: newGame.gameID, playerAmmo: 0, opponentName: pp.name} ));
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
          gameList[game].player1.ws.send(JSON.stringify( {action: "result", gameEnd: true, draw: true} ));
          gameList[game].player2.ws.send(JSON.stringify( {action: "result", gameEnd: true, draw: true} ));
          gameList[game].player1move = "";
          gameList[game].player2move = "";
          gameList[game].gameEnd = true;
          return
        } else if (gameList[game].player1move == "shoot" && gameList[game].player2move == "block") {
          gameList[game].player1.ws.send(JSON.stringify( {predicate: "shoot", opponentMove:gameList[game].player2move, action: "play", playerAmmo: 1} ));
          gameList[game].player2.ws.send(JSON.stringify( {predicate: "block", opponentMove:gameList[game].player1move, action: "play"} ));
          gameList[game].player1move = "";
          gameList[game].player2move = "";
          return
        } else if (gameList[game].player1move == "shoot" && gameList[game].player2move == "reload") {
          gameList[game].player1.ws.send(JSON.stringify( { action: "result", gameEnd: true, winner: true} ));
          gameList[game].player2.ws.send(JSON.stringify( { action: "result", gameEnd: true, loser: true} ));
          gameList[game].gameEnd = true;
          return
        } else if (gameList[game].player2move == "shoot" && gameList[game].player1move == "block") {
          gameList[game].player1.ws.send(JSON.stringify( {predicate: "block", opponentMove:gameList[game].player2move, action: "play"} ));
          gameList[game].player2.ws.send(JSON.stringify( {predicate: "shoot", opponentMove:gameList[game].player1move, action: "play", playerAmmo: 1} ));
          gameList[game].player1move = "";
          gameList[game].player2move = "";
          return
        } else if (gameList[game].player2move == "shoot" && gameList[game].player1move == "reload") {
          gameList[game].player1.ws.send(JSON.stringify( { action: "result", gameEnd: true, loser: true } ));
          gameList[game].player2.ws.send(JSON.stringify( { action: "result", gameEnd: true, winner: true } ));
          gameList[game].gameEnd = true;
          return
        } else if (gameList[game].player2move == "reload" && gameList[game].player1move == "reload") {
          gameList[game].player1.ws.send(JSON.stringify( {predicate: "reload", opponentMove:gameList[game].player2move, action: "play", playerAmmo: 1} ));
          gameList[game].player2.ws.send(JSON.stringify( {predicate: "reload", opponentMove:gameList[game].player1move, action: "play", playerAmmo: 1} ));
          gameList[game].player1move = "";
          gameList[game].player2move = "";
          return
        } else if (gameList[game].player2move == "block" && gameList[game].player1move == "block") {
          gameList[game].player1.ws.send(JSON.stringify( {predicate: "block", opponentMove:gameList[game].player2move, action: "play"} ));
          gameList[game].player2.ws.send(JSON.stringify( {predicate: "block", opponentMove:gameList[game].player1move, action: "play"} ));
          gameList[game].player1move = "";
          gameList[game].player2move = "";
          return
        } else if (gameList[game].player2move == "reload" && gameList[game].player1move == "block") {
          gameList[game].player1.ws.send(JSON.stringify( {predicate: "block", opponentMove:gameList[game].player2move, action: "play"} ));
          gameList[game].player2.ws.send(JSON.stringify( {predicate: "reload", opponentMove:gameList[game].player1move, action: "play", playerAmmo: 1} ));
          gameList[game].player1move = "";
          gameList[game].player2move = "";
          return
        } else if (gameList[game].player1move == "reload" && gameList[game].player2move == "block") {
          gameList[game].player1.ws.send(JSON.stringify( {predicate: "reload", opponentMove:gameList[game].player2move, action: "play", playerAmmo: 1} ));
          gameList[game].player2.ws.send(JSON.stringify( {predicate: "block", opponentMove:gameList[game].player1move, action: "play"} ));
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
    console.log(playerList)
    for (var i = 0; i < playerList.length; i++) {
      if (playerList[i].ws.readyState === WebSocket.CLOSED) {
        playerList.splice(playerList[i],1)
        console.log("removed")
      }
    }
  }, 3000);
};

check();

httpServer.listen(port)
