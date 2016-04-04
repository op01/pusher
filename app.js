// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

app.use(express.basicAuth(function(user, pass){
  console.log("BASIC");
   return 'nullshit' == user && process.env.AUTH_PASS == pass;
}));

// Routing
app.use(express.static(__dirname + '/public'));

// LOAD TEST

app.get('/loadtest', function(req, res){
  setTimeout(()=>res.send('hello world'),Math.random()*5000+500);
});

var push=io.of('/push');
push.on('connection',function(socket){
  // setTimeout(()=>socket.emit("push",{message:welcomeMsg[Math.floor(Math.random()*welcomeMsg.length)]}),10000);
});

setInterval(()=>{
  io.emit('new message',{
      username: 'SYSTEM',
      message: 'online '+Object.keys(push.connected).length+' user(s)'
    });
},30000);

// Chatroom
var welcomeMsg = [
  "ข้อ 3 เทสเคสผิดนะครับ",
  "กรุณาอย่าสแปมนะครับ ตัวตรวจทำงานหนักมากเลยครับ",
  "เฮือกครับ ผมยังเจนเคสไม่เสร็จเลย",
  "GG EZ",
  "เคสพึ่งเจนเมื่อคืนขอภัยในความไม่สะดวกด้วยครับ",
  "เดี๋ยวอีกสักครู่จะมีการ restart เครื่องนะครับ ไม่ต้องตกใจ",
  "หลังจากการหายไปของ  CodeCube beta เราก็ได้กลับมาอีกครั้ง",
  "ยินดีด้วย คุณคือผู้ได้รับเลือกให้เป็น CodeCube master",
  "ทางเราได้ขยายเวลาในการรับสมัครออกไปอีก 3 วันนะครับ",
  "bullshit!!!",
  "หากผิดพลาดประการใดทางเราต้องขออภัยด้วยครับ"];
var numUsers = 0;

io.on('connection', function (socket) {
  var addedUser = false;
  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {
    // we tell the client to execute 'new message'
    push.emit("push",{message:data});
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
    });
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username) {
    if (addedUser) return;

    // we store the username in the socket session for this client
    socket.username = username;
    ++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function () {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function () {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    if (addedUser) {
      --numUsers;

      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });
});
