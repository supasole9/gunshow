const app = new Vue ({
  el: '#app',
  data: {
    Username:"",
    signup: true,
    playing: false,
    waiting: false,
    gameEnd: false,
    gameID: "",
    socket: null,
    playerAmmo: 0,
    winner: false,
    loser: false,
    opponentName: "",
    opponentMove: "",
    yourmove: "",
  },
  methods: {
    shoot: function () {
      this.yourmove = "shoot";
      this.socket.send(JSON.stringify( {action: "action", move: "shoot", gameId: this.gameID} ));
    },
    block: function () {
      this.yourmove = "block";
      this.socket.send(JSON.stringify( {action: "action", move: "block", gameId: this.gameID} ));
    },
    reload: function () {
      this.yourmove = "reload";
      this.socket.send(JSON.stringify( {action: "action", move: "reload", gameId: this.gameID} ));
    },
    sendUsername: function () {
      this.socket.send(JSON.stringify({action: "newUser", name: this.Username}));
    }
  },
  created: function () {
    var HOST = location.origin.replace(/^http/, 'ws');
    this.socket = new WebSocket(HOST);

    this.socket.onopen = function () {
        console.log("connecte3d to server...");
    };
    this.socket.onmessage = function (event) {
        console.log("Message Recived", event)
        logMessage(event.data);
    }
  }
});

var logMessage = function (message) {
  console.log()
  var data = JSON.parse(message);
  if (data.action == "signupSuccess") {
    app.signup = false;
    app.waiting = true;
  } else if (data.action == "newGame") {
    app.waiting = false;
    app.playing = true;
    app.playerAmmo = data.playerAmmo;
    app.gameID = data.gameID;
    app.opponentName = data.opponentName;
  } else if (data.action == "result") {
    app.gameEnd = data.gamePlay;
    app.winner = data.winner;
    app.loser = data.loser;
  } else if (data.action == "play") {
    if (data.predicate == "reload") {
      app.playerAmmo += data.playerAmmo;
      app.opponentMove = data.opponentMove;
    } else if (data.predicate == "shoot") {
      app.playerAmmo -= data.playerAmmo;
      app.opponentMove = data.opponentMove;
    } else if (data.predicate == "block") {
      app.opponentMove = data.opponentMove;
    }
  }
};
