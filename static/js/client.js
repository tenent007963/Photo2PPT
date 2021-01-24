// Get WebSocket
let socket = io();

// Get DOM elements
let _src1 = document.getElementById("input1");
let _src2 = document.getElementById("input2");
let _status = document.getElementById("status");
let _fileform = document.getElementById("holder");
let _container = document.getElementById("container");
let _roomCodeInput = document.getElementById("roomCode");
let _roomIndicator = document.getElementById("roomindicator");

// Join a channel
let room;
let cameraId;

// Listen to Source1 and Source2 input events
[_src1,_src2].forEach(function(sauce){
    sauce.addEventListener("change", function (event) {

        // Prepare file reader
        const file = event.target.files[0];
        if (!file) {
            return;
        }
        const fileReader = new FileReader();

        // Determine input type
        if (file instanceof Blob) {
            // Check for file size (in kb)
            //fileSize = (file.size / 1024).toFixed(3); //not really used
            // Add line for compressing image data here
            new Compressor(file, {
                quality: 0.6,
                checkOrientation: false,
                success(result) {
                    // Read file
                    //fileReader.readAsDataURL(result);  //Previously read as DataURL
                    fileReader.readAsArrayBuffer(result);//Now I want to read as blob data
                },
                error(err) {
                    _consoleLog(err.message);
                    _status.textContent = err.message;
                },
            });
        }
        fileReader.onloadend = function (event) {
            // Send an image event to the socket
            let image = event.target.result;
            // Check for connection status
            if (socket.connected) {
                emitPhoto(image);
                _consoleLog(`First try success!`);
            } else {
                // reconnect
                socket.connect(); //method1
                socket.emit("join",room);
                if (socket.connected) {
                    emitPhoto(image);
                    _consoleLog(`Second try success.`);
                } else {
                    alert("Connection lost! Will now refresh page.");
                    _consoleLog(`Connection lost!`);
                    window.location.reload();
                    return false;
                }
            }
        };
    });
});

function emitPhoto(image) {
    socket.emit("recvimage", image, room, (isSuccess) => {
        if (isSuccess) { _consoleLog('Image sent!') } else { emitPhoto(image)}
    });
}

function savefile() {
    socket.emit("status","save", room);
}

//Retrieving room code from input
function getRoom() {
    let str = _roomCodeInput.value.trim();
    _consoleLog(`Value from input: ${str}.`);
    joinroom(str);
}

//Join room
function joinroom(rm) {
    _consoleLog(`Connecting to room ${rm}.`);
    if(rm === undefined || rm === '') {
        _status.textContent = 'Error: No room code!';
        _consoleLog(`Error: No room code!`);
        $('#popup').modal('show');
        return false;
    }
    if(socket.connected && room) {
        leaveroom(room);
    }
    Cookies.set('room',rm,{ expires: 31 ,path: ''});
    room = rm;
    socket.emit("join",rm);
    checkStatus();
    $('#popup').modal('hide');
}

//Leave room
function leaveroom(rm){
    socket.emit("leave",rm);
    setOffline();
    _status.textContent = 'Disconnected from room ' + rm + '.';
}

//Initialize QR Scanner
function onScanSuccess(qrCodeMessage) {
    let thecode = qrCodeMessage.trim();
    joinroom(thecode.slice(0,10));
    html5Qrcode.stop().then(ignore => {
        // QR Code scanning is stopped.
    }).catch(err => {
        html5Qrcode.clear();
        _consoleLog(err);
    });
}

function onScanFailure(error) {
    // handle scan failure, usually better to ignore and keep scanning
    _consoleLog(`QR error = ${error}`);
}

let setOnline = () => {
    _roomIndicator.innerHTML = "&#x25cf; Online";
    _roomIndicator.className = "online";
}

let setOffline = () => {
    _roomIndicator.innerHTML = "&#x25cf; Offline";
    _roomIndicator.className = "offline";
}

//previously Html5QrcodeScanner for preset scanner interface
const html5Qrcode = new Html5Qrcode("reader");
//html5Qrcode.render(onScanSuccess, onScanFailure);

// This method will trigger user permissions
Html5Qrcode.getCameras().then(devices => {
    /**
     * devices would be an array of objects of type:
     * { id: "id", label: "label" }
     */
    if (devices && devices.length) {
        let cameraId = devices[1].id;
        html5Qrcode.start(cameraId, { fps: 30, qrbox: 250 },onScanSuccess, onScanFailure).catch(err => { _consoleLog(err)});
    }
}).catch(err => {
    _consoleLog(err);
});


//This function is to do a clean reload and cookie flushing
let cleanReload = () => {
    Cookies.remove('room', { path: '' })
    window.location.reload();
}

//Check socket connection upon window.onfocus
window.onfocus = () => {
    _consoleLog(`Window focused. Checking connection...`);
    if (!socket.connected) {
        _consoleLog(`Trying to reconnect...`);
        setOffline();
        try {
            socket.connect();
            socket.emit("join",room);
            socket.on('connect_error',function(reason) {
                _status.textContent = reason;
                window.location.reload();
            });
            _consoleLog(`Client reconnected.`);
            checkStatus();
        }
        catch(err) {
            _consoleLog(`Reconnect failed! Will proceed to force reload.`);
            //alert(`${err} Will now force reload.`); //This code will cause page to lose focus and thus infinite loop
            _container.textContent = 'Socket disconnected! Will proceed to force reload.';
            window.location.reload();
        }

    } else {
        _consoleLog(`Client is connected, falling back.`);
        checkStatus();
    }
}

//AJAX Codes
$(".custom-file-input").on("change", function() {
    let fileName = $(this).val().split("\\").pop();
    $(this).siblings(".custom-file-label").addClass("selected").html(fileName);
});


//Below are all socket functions / connections

//Listen to "status" event and update _status element
socket.on("status",function(data){
    _consoleLog(`Received status update.`);
    _status.textContent = data;
    _fileform.reset();
    setOnline();
});

// Upon socket disconnection
socket.on('disconnect', function(){
    // try to reconnect
    socket.connect();
    socket.emit("join",room);
    _consoleLog(`Trying to reconnect socket.`);
    socket.on('connect_error',function(reason) {
        setOffline();
        _status.textContent = reason;
        window.location.reload();
    });
});

socket.on('reconnect_error',function(reason){
    setOffline();
    _status.textContent = reason;
    window.location.reload();
})

function checkStatus() {
    _consoleLog("Querying status..");
    socket.emit("client","check",room, (cb) => {
        let res = cb.serverIsOnline;
        if (res === 'true') {
            _consoleLog('Server side online!');
            setOnline();
            _fileform.reset();
            return true;
        } else if(res === 'false') {
            _consoleLog(`Server side offline!`);
            _status.textContent = 'Server side offline!';
            _fileform.reset();
            setOffline();
            return false;
        } else if(res === 'error') {
            _status.textContent = 'Incorrect room details.';
            _fileform.reset();
            $('#popup').modal('show');
            _consoleLog(`Incorrect room details.`);
        } else {
            _status.textContent = 'An error occurred. Will proceed with force refresh.';
            window.location.reload();
            _consoleLog(`An error occurred.`);
        }

    });
}

window.onload = () => {
    if (isDebug) {
        window.document.title = "InstantPhoto - Client(Development)";
    }
    let getRoom = Cookies.get('room');
    if (!getRoom) {
        $('#popup').modal('show');
    } else {
        joinroom(getRoom);
        _consoleLog(`Joining old room, room code: ${getRoom}`)
    }
}
