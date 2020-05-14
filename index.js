// Import packages
var fs = require('fs'); 
var http=require('http');
var path = require("path");
var url=require('url');
var PptxGenJS = require("pptxgenjs");

const PORT = process.env.PORT || 3000;

var server=http.createServer(function(req,res){
    var pathname=url.parse(req.url).pathname;
	var fsCallback = function(error, data) {
        if(error) throw error;

        res.writeHead(200);
        res.write(data);
        res.end();
    }
    switch(pathname){
        case '/pc-min':
            doc = fs.readFile(__dirname + '/static/server-min.html', fsCallback);
        break;
		case '/server-dev':
            doc = fs.readFile(__dirname + '/static/server-dev.html', fsCallback);
        break;
		case '/pc':
            doc = fs.readFile(__dirname + '/static/server-source.html', fsCallback);
        break;
		case '/phone-min':
            doc = fs.readFile(__dirname + '/static/client-min.html', fsCallback);
        break;
		case '/client-dev':
            doc = fs.readFile(__dirname + '/static/client-dev.html', fsCallback);
        break;
		case '/phone':
            doc = fs.readFile(__dirname + '/static/client-source.html', fsCallback);
        break;
		case '/sync':
            doc = fs.readFile(__dirname + '/static/sync.html', fsCallback);
        break;
		case '/favicon':
            doc = fs.readFile(__dirname + '/static/favicon.ico', fsCallback);
        break;
        default:
            doc = fs.readFile(__dirname + '/static/index.html', fsCallback);
        break;
    }
	
}).listen(PORT);

console.log("InstantPhoto had started!");

// Initialize Socket.io 
var io = require('socket.io').listen(server);

// Register "connection" events to the WebSocket
io.on("connection", function(socket) {
  // Register "join" events, requested by a connected client
  socket.on("join", function (room) {
    // join channel provided by client
	socket.room = room;
    socket.join(room);
  });
  
  // Register "leave" events, sent by phone side
  socket.on("leave", function(room) {
	// leave the current room  
	socket.leave(room);
  });
  
  // Register "image" events, sent by the client
	socket.on("image", function(data , room) {
     // Broadcast the "image" event to all other clients in the room
     socket.broadcast.to(room).emit("image", data, room);
	 //console.log(`Broadcasting data to ${room}`);
    });
  
  
/* not working due to client side value not passed to server  
  // Register "switchroom" events, sent by pc side
  socket.on("switchroom", function(newroom) {
	// leave the current room (stored in session)
	socket.leave(socket.room);
	// join new room, received as function parameter
	socket.join(newroom);
	}); */
  });
  
  

/*
var os = require( 'os' );
var networkInterfaces = os.networkInterfaces( );
var arr = networkInterfaces['Ethernet']
var ip = arr[1].address;
console.log("Server IP:",ip);
*/
//var opn = require('opn');
// specify the app to open in 
//opn('http://localhost/pc', {app: 'chrome'});
