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
    confirmGame: false,
    gameshield: 0,
    playerwaiting: false,
    reloadActive: false,
    shootActive: false,
    blockActive: false
  },
  methods: {
    shoot: function () {
      this.opponentMove = "",
      this.yourmove = "shoot";
      this.shootActive = true;
      this.reloadActive = false;
      this.blockActive = false;
      this.socket.send(JSON.stringify( {action: "action", move: "shoot", gameId: this.gameID} ));
    },
    block: function () {
      this.opponentMove = "",
      this.yourmove = "block";
      this.shootActive = false;
      this.reloadActive = false;
      this.blockActive = true;
      this.socket.send(JSON.stringify( {action: "action", move: "block", gameId: this.gameID} ));
    },
    reload: function () {
      this.opponentMove = "",
      this.yourmove = "reload";
      this.shootActive = false;
      this.blockActive = false;
      this.reloadActive = true;
      this.socket.send(JSON.stringify( {action: "action", move: "reload", gameId: this.gameID} ));
    },
    sendUsername: function () {
      this.socket.send(JSON.stringify({action: "newUser", name: this.Username}));
    },
    sendNewGame: function () {
      this.playing = false;
      this.waiting = true;
      this.confirmGame = false;
      this.socket.send(JSON.stringify({action: "newGame"}));
    },
    confirmGameEntry: function () {
      this.waiting = false;
      this.playing = true;
    }
  },
  created: function () {
    var HOST = location.origin.replace(/^http/, 'ws');
    this.socket = new WebSocket(HOST);

    this.socket.onopen = function () {
        console.log("Were Ready");
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
    app.winner = false;
    app.loser = false;
    app.gameEnd = false;
    app.playerAmmo = 0;
    app.gameshield = data.gameshield;
    app.opponentMove = "";
    app.yourmove = "";
    app.confirmGame = true;
    app.playerAmmo = data.playerAmmo;
    app.gameID = data.gameID;
    app.opponentName = data.opponentName;
  } else if (data.action == "result") {
    app.gameEnd = data.gameEnd;
    app.winner = data.winner;
    app.loser = data.loser;
    app.opponentMove = data.opponentMove;
  } else if (data.action == "play") {
    app.shootActive = false;
    app.reloadActive = false;
    app.blockActive = false;
    app.playerwaiting = false;
    if (data.predicate == "reload") {
      app.playerAmmo += data.playerAmmo;
      app.opponentMove = data.opponentMove;
    } else if (data.predicate == "shoot") {
      app.playerAmmo -= data.playerAmmo;
      app.opponentMove = data.opponentMove;
    } else if (data.predicate == "block") {
      app.gameshield -= data.gameshield;
      app.opponentMove = data.opponentMove;
    }
  } else if (data.action = "playerwaiting") {
    app.yourmove = "";
    app.playerwaiting = true;
  }
};
