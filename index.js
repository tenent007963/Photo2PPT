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
		case '/jquery.js':
            doc = fs.readFile(__dirname + '/static/jquery-3.5.1.min.js', fsCallback);
        break;
		case '/bootstrap.css':
            doc = fs.readFile(__dirname + '/static/bootstrap.min.css', fsCallback);
        break;
		case '/bootstrap.js':
            doc = fs.readFile(__dirname + '/static/bootstrap.min.js', fsCallback);
        break;
		case '/compressor.js':
			doc = fs.readFile(__dirname + '/node_modules/compressorjs/dist/compressor.js', fsCallback);
		break;
        case '/html5-qrcode.min.js':
            doc = fs.readFile(__dirname + '/static/html5-qrcode.min.js', fsCallback);
            break;
        default:
            doc = fs.readFile(__dirname + '/static/index.html', fsCallback);
        break;
    }
	
}).listen(PORT);

// Initialize Socket.io and its variables
var io = require('socket.io').listen(server,{pingInterval: 5000,pingTimeout: 60000,autoConnect: true});
var serverIsOnline = new Object;

// Register "connection" events to the WebSocket
io.on("connection", function(socket) {
	
	// Register "server" events sent by server ONLY
    socket.on("server", function (data,room) {
		// check for sent data
		if (data === "isOnline") {
            console.log(`Received "isOnline" packet, updating ${room} record on host side.`);
			serverIsOnline.room = true;
			// check if connection is dropped, method 1
			if (socket.disconnected) {
                console.log(`Server side of ${room} disconnected, updating ${room} record.`);
				serverIsOnline.room = false;
			}
			socket.on('disconnect', function (reason) {
				console.log(`Socket for ${room} disconnected, updating ${room} record. Reason:${reason}`);
				serverIsOnline.room = false;
				});
		} else {
            //Do nothing
			return false;
		}
  });
  
  // Register "client" events sent by client ONLY
    socket.on("client", (data,room,callback) => {
		console.log(`Received request from client side.`);
		// check for sent data
		if (data === "check") {
			console.log(`Determined request type.`);
			if (serverIsOnline.room) {
				console.log(`Parse request to server side of ${room}.`);
				socket.broadcast.to(room).emit("status",data);
			} else {
				console.log(`Server side offline. Return callback data.`);
				callback({serverIsOnline:false});
			}
		}
  });
	
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
  
  // Register "recvimage" events, a newer function sent by the client
	socket.on("recvimage", (data , room, callback) => {
		// Broadcast the "transimage" event to all server side in the room
		socket.broadcast.to(room).emit("transimage", data);
		// Return success msg
		console.log(`Broadcasting image to ${room}`);
		callback({isSuccess: true});
    });

  // Handle and broadcast "status" events
    socket.on("status",function(data,room) {
		console.log(`Parsing status..`)
	    socket.broadcast.to(room).emit("status",data);
	});
  
  });


console.log("InstantPhoto had started!");

/*
//required only if running on local machine
var os = require( 'os' );
var networkInterfaces = os.networkInterfaces( );
var arr = networkInterfaces['Ethernet']
var ip = arr[1].address;
console.log("Server IP:",ip);
*/
//var opn = require('opn');
// specify the app to open in 
//opn('http://localhost/pc', {app: 'chrome'});
