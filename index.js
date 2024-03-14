// Import packages
const fs = require('fs');
const http=require('http');
const url=require('url');
const {Client} = require('pg'); //Postgres
const { parse } = require('querystring');

const PORT = process.env.PORT || 3000;
const dbURL = process.env.DATABASE_URL;

//Init postgres connection & setup
const client = new Client({
    connectionString: dbURL,
    ssl: {
        require : process.env.DATABASE_URL ? true : false,
        rejectUnauthorized: false
    }
});
client.connect(err => {
    if (err) {
      console.error('Error Connecting: ', err.stack);
      console.log(`Limited access.`);
    } else {
      console.log('connected');
    }
});
client.query('CREATE TABLE IF NOT EXISTS availableroom (room_id CHAR(11) PRIMARY KEY, server CHAR(8), client CHAR(8));', (err, res) => {
    if (err) {
        console.log(`Operating in headless mode, Postgres error:`,err)
    } else {
        console.log(`Result from postgres:`,res.command);
    }
});

//https://nodejs.org/en/docs/guides/anatomy-of-an-http-transaction/
let server=http.createServer(function(req,res){
    let pathname=url.parse(req.url).pathname;
    let mime = '';
    let fsCallback = function(error, data) {
        if(error) {
            res.writeHead(404);
            res.send("Oops! Couldn't find that file.");
            res.end();
        }
        res.writeHead(200, {'Content-Type': mime});
        res.write(data);
        res.end();
    }
    switch(pathname){
		case '/server-dev':
            mime='text/html';
            fs.readFile(__dirname + '/static/server-dev.html', 'utf8', fsCallback);
        break;
		case '/pc':
            mime='text/html';
            fs.readFile(__dirname + '/static/server.html', 'utf8', fsCallback);
        break;
		case '/client-dev':
            mime='text/html';
            fs.readFile(__dirname + '/static/client-dev.html', 'utf8', fsCallback);
        break;
		case '/phone':
            mime='text/html';
            fs.readFile(__dirname + '/static/client.html', 'utf8', fsCallback);
        break;
		case '/favicon.ico':
            mime='image/x-icon';
            fs.readFile(__dirname + '/static/favicon.ico', fsCallback);
        break;
		case '/jquery.js':
            mime='text/javascript';
            fs.readFile(__dirname + '/static/js/jquery-3.5.1.min.js', 'utf8', fsCallback);
        break;
		case '/bootstrap.css':
            mime='text/css';
            fs.readFile(__dirname + '/static/css/bootstrap.min.css', 'utf8', fsCallback);
        break;
		case '/bootstrap.js':
            mime='text/javascript';
            fs.readFile(__dirname + '/static/js/bootstrap.min.js', 'utf8', fsCallback);
        break;
		case '/compressor.js':
            mime='text/javascript';
			fs.readFile(__dirname + '/node_modules/compressorjs/dist/compressor.js', 'utf8', fsCallback);
		break;
        case '/html5-qrcode.min.js':
            mime='text/javascript';
            fs.readFile(__dirname + '/static/js/html5-qrcode.min.js', 'utf8', fsCallback);
        break;
        case '/keepalive':
            mime='text/plain';
            fs.readFile(__dirname + '/static/keepalive.txt', 'utf8', fsCallback);
        break;
        case '/server.js':
            mime='text/javascript';
            fs.readFile(__dirname + '/static/js/server.js', 'utf8', fsCallback);
        break;
        case '/client.js':
            mime='text/javascript';
            fs.readFile(__dirname + '/static/js/client.js', 'utf8', fsCallback);
        break;
        case '/server-dev.js':
            mime='text/javascript';
            fs.readFile(__dirname + '/static/js/server-dev.js', 'utf8', fsCallback);
        break;
        case '/client-dev.js':
            mime='text/javascript';
            fs.readFile(__dirname + '/static/js/client-dev.js', 'utf8', fsCallback);
        break;
        case '/server.css':
            mime='text/css';
            fs.readFile(__dirname + '/static/css/server.css', 'utf8', fsCallback);
        break;
        case '/client.css':
            mime='text/css';
            fs.readFile(__dirname + '/static/css/client.css', 'utf8', fsCallback);
        break;
        case '/server-dev.css':
            mime='text/css';
            fs.readFile(__dirname + '/static/css/server-dev.css', 'utf8', fsCallback);
        break;
        case '/client-dev.css':
            mime='text/css';
            fs.readFile(__dirname + '/static/css/client-dev.css', 'utf8', fsCallback);
        break;
        case '/dev.js':
            mime='text/javascript';
            fs.readFile(__dirname + '/static/js/dev.js', 'utf8', fsCallback);
        break;
        case '/manifest.json':
            mime='application/json';
            fs.readFile(__dirname + '/static/manifest.json', 'utf8', fsCallback);
        break;
        case '/cacat.png':
            mime='image/png';
            fs.readFile(__dirname + '/static/cacat.png', 'utf8', fsCallback);
        break;
        case '/papertrail':
            mime='text/plain';
            collectRequestData(req, result => {
                console.log(`Response from ${result['room']} with message '${result['msg']}'`);
            });
            fsCallback(null,`Confirmation of receiving, timestamp: ${Math.floor(+new Date() / 1000)}`);
        break;
        default:
            /* doc = */ fs.readFile(__dirname + '/static/index.html', 'utf8', fsCallback);
            //fs.readFile(__dirname + '/static/' + pathname, 'utf8', fsCallback);
        break;
    }
	
}).listen(PORT);

// Initialize Socket.io and its variables
const io = require('socket.io').listen(server,{pingInterval: 5000,pingTimeout: 90000000});

// Register "connection" events to the WebSocket
io.on("connection", async function(socket) {

    // Register "server" events sent by server ONLY
    socket.on("server", (data, srcroom, callback) => {
        room = strTrimming(srcroom);
        // check for sent data
        switch (data) {
            case "isOnline":
                rooms.setServerOnline(room);
                console.log(`Received "isOnline" packet, updating ${room} record on host side.`);
                socket.room = room;
                socket.join(room);
                socket.on('disconnect', function (reason) {
                    //This code have bug, sample:
                    // Socket for transport close disconnected, updating transport close record. Reason:transport close
                    // Record of transport close updated to False, result = 0.
                    //Tried to fix via code block @ line #218
                    console.log(`Socket for ${room} disconnected, updating ${room} record. Reason:${reason}`);
                    rooms.setServerOffline(room);
                });
                break;
            case "keepAlive":
                rooms.keepServerOnline(room);
                break;
            default:
                //Do nothing
                break;
        }
    });

    // Register "client" events sent by client ONLY
    socket.on("client", (data, srcroom, callback) => {
        room = strTrimming(srcroom);
        console.log(`Received request from client side.`);
        if(room === undefined|| room === '') {
            callback({serverIsOnline:'error'});
            return false;
        }
        // check for sent data
        switch (data) {
            case "check":
                console.log(`Determined request type.`);
                rooms.getStateOfServer(room).then(res => {
                    console.log(`Returned value for ${room}: ${JSON.stringify(res)}.`);
                        if (res === 'online') {
                            console.log(`Parse request to server side of ${room}.`);
                            socket.broadcast.to(room).emit("status", data);
                            callback({serverIsOnline:'true'});
                        }
                        if (res === 'offline') {
                            console.log(`Server side ${room} offline. Return callback data.`);
                            callback({serverIsOnline:'false'});
                        }
                        if (res === 'error') {
                            console.log(`Queried ${room} doesn't exist, please check again.`);
                            callback({serverIsOnline:'error'});
                        }
                }).catch(err => {
                    console.log(`Unknown error occurred. Data: ${data}, RoomID: ${room}, ErrMsg:${err}.`);
                    callback({serverIsOnline:'error'});
                });
                break;
            default:
                break;
        }
    });

    socket.on('roomChk',(srcroom,callback) => {
        room = strTrimming(srcroom);
                rooms.checkAvailability(room).then(res => {
                    if (res === 0) {
                        console.log(`Room ${room} is available.`);
                        callback({result:'ok'});
                    } else if (res === 1) {
                        rooms.getStateOfServer(room).then(res1 => {
                            if (res1 === 'online') {
                                console.log(`Room ${room} is not available.`);
                                callback({result:genRand(9)});
                            } else {
                                console.log(`Room ${room} is available.`);
                                callback({result:'ok'});
                            }
                        })
                    }
                });
    })

    // Handle and broadcast "status" events
    socket.on("status", (data, srcroom) => {
        room = strTrimming(srcroom);
        console.log(`Parsing status..`)
        socket.broadcast.to(room).emit("status", data);
    });

    // Register "join" events, requested by a connected client
    socket.on("join", (srcroom,callback) => {
        // join channel provided by client
        room = strTrimming(srcroom);
        socket.room = room;
        socket.join(room);
        callback({result:'ok'});
    });

    // Register "leave" events, sent by phone side
    socket.on("leave", function (srcroom) {
        room = strTrimming(srcroom);
        // leave the current room
        socket.leave(room);
    });

    // Register "recvimage" events, a newer function sent by the client
    socket.on("recvimage", (data, srcroom, callback) => {
        room = strTrimming(srcroom);
        // Broadcast the "transimage" event to all server side in the room
        socket.broadcast.to(room).emit("transimage", data);
        // Return success msg
        console.log(`Broadcasting image to ${room}`);
        callback({isSuccess: true});
    });

})

var rooms = {
    setServerOnline : async function(val) {
        //sample command: INSERT INTO availableroom (room_id, server, client) VALUES ('abCDe12345', 'online', 'N/A');
        client.query(`INSERT INTO public.availableroom (room_id, server, client) VALUES ('${val}', 'online', 'N/A');`, (err, res) => {
            if (err) {
                rooms.keepServerOnline(val);
            }
            if (res) {
                console.log(`Created record for ${val}, result = ${JSON.stringify(res.rowCount)}.`);
            }
        });
    },
    keepServerOnline : async function(val) {
        let query = client.query(`UPDATE public.availableroom SET server = 'online' WHERE room_id='${val}';`);
        let result = await query;
        console.log(`Record of ${val} updated to True, result = ${JSON.stringify(result.rowCount)}.`);
        return await result.rowCount;
    },
    setServerOffline : async function(val) {
        let query = client.query(`UPDATE public.availableroom SET server = 'offline' WHERE room_id='${val}';`);
        let result = await query;
        console.log(`Record of ${val} updated to False, result = ${JSON.stringify(result.rowCount)}.`);
        return await result.rowCount;
    },
    getStateOfServer : async function(val) {
        console.log(`Querying data from postgres for room ${val}.`);
        //sample command: SELECT server FROM public.availableroom WHERE room_id='abCDe12345';
        let query = client.query(`SELECT server FROM public.availableroom WHERE room_id='${val}';`);
        let result = await query;
        return await result.rows[0].server.trim();
    },
    checkAvailability : async function(val) {
        console.log(`Checking room availability for room ${val}.`);
        let query = client.query(`SELECT server FROM public.availableroom WHERE room_id='${val}';`);
        let result = await query;
        return await result.rowCount;
    }
} 

function collectRequestData(request, callback) {
    console.log('Processing raw data from client...');
    const CONTENT_TYPE = 'application/json';
    if(request.headers['content-type'] === CONTENT_TYPE) {
        let body = '';
        request.on('data', chunk => {
            body += chunk.toString();
        });
        request.on('end', () => {
            callback(JSON.parse(body));
        });
    }
    else {
        callback(null);
    }
}

function genRand(len) {
    const hash = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ12346789";
    let randomStr = '';
    for(let i = 0; i < len; i++){
        randomStr += hash[parseInt(Math.random()*hash.length)];
    }
    return randomStr;
}

function strTrimming(x){
    return x == undefined ? '' : x.trim();
}

console.log("InstantPhoto had started!");

//Set all room to offline upon exit
process.on('SIGTERM', () => {
    console.log(`Shutting down server...`)
    client.query('TRUNCATE TABLE availableroom;').then(msg=>{
        console.log(`Successfully cleared table, result: ${msg}.`);
    }).finally(()=>{
        io.close();
        server.close(() => {
            console.log('Server terminated');
        })
    });
});