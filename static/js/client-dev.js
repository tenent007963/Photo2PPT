// Get WebSocket
const socket = io();

// Get DOM elements
let _src1 = document.getElementById("input1");
let _src2 = document.getElementById("input2");
let _status = document.getElementById("status");
let _fileform = document.getElementById("holder");
let _container = document.getElementById("container");
let _roomCodeInput = document.getElementById("roomCode");
let _roomIndicator = document.getElementById("roomindicator");
let _scanbutton = document.getElementById("startScan");
let _saveButton = document.getElementById("savefile");

// Join a channel
let room, lastResult, countResults = 0;

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
                socket.socket.connect(); //method1
                socket.on('connect', () => {
                    socket.emit("join",room);
                    emitPhoto(image);
                    _consoleLog(`Second try success.`);
                });
                socket.on('reconnect_error', () => {
                    alert("Connection lost! Will now refresh page.");
                    _consoleLog(`Connection lost!`);
                    window.location.reload();
                });
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
    event.preventDefault();
    let str = _roomCodeInput.value.trim();
    _consoleLog(`Value from input: ${str}.`);
    joinroom(str);
}

//Join room
function joinroom(rm) {
    $('#popup').modal('hide');
    _consoleLog(`Connecting to room ${rm}.`);
    if(rm === undefined || rm === '') {
        _status.textContent = 'Error: No room code!';
        _consoleLog(`Error: No room code!`);
        $('#popup').modal('show');
        return 0;
    } 
    if(socket.connected && room != rm) {
        leaveroom(room);
    }
    Cookies.set('room',rm,{ expires: 31 ,path: ''});
    socket.emit("join",rm);
    room = rm;
    checkStatus();
    return 0;
}

//Leave room
function leaveroom(rm){
    socket.emit("leave",rm);
    setOffline();
    _status.textContent = 'Disconnected from room ' + rm + '.';
    return 0;
}

//Initialize QR Scanner Elements

function onScanSuccess(qrCodeMessage) {
    if (qrCodeMessage !== lastResult) {
		++countResults;
		lastResult = qrCodeMessage;
	}
    if (qrCodeMessage === lastResult) {
        countResults = 0;
        //let thecode = qrCodeMessage.slice(0,11);
        let thecode = qrCodeMessage.trim();
        _consoleLog(`The code: ${thecode}`);
        joinroom(thecode);
        html5QrcodeScanner.clear();
        _scanbutton.style.display = "block";
        return 0;
    }
}

function onScanFailure(error) {
    // handle scan failure, usually better to ignore and keep scanning
    //_consoleLog(`QR error = ${error}`);
    console.log(`QR error = ${error}`);
}

//set to Html5Qrcode and comment out html5QrcodeScanner for pro mode
let html5QrcodeScanner = new Html5QrcodeScanner("reader", { fps: 25});
html5QrcodeScanner.render(onScanSuccess, onScanFailure);

$("#startScan").on("click", function(){
    //html5Qrcode.start(cameraId, { fps: 30 },onScanSuccess, onScanFailure).catch(err => { _consoleLog(err)});
    html5QrcodeScanner.render(onScanSuccess, onScanFailure);
    _scanbutton.style.display = 'none';
});

//Status styling code
let setOnline = () => {
    _roomIndicator.innerHTML = "&#x25cf; Online";
    _roomIndicator.className = "online";
}

let setOffline = () => {
    _roomIndicator.innerHTML = "&#x25cf; Offline";
    _roomIndicator.className = "offline";
}

//This function is to do a clean reload and cookie flushing
let cleanReload = () => {
    Cookies.remove('room', { path: '' })
    window.location.reload();
}

//Check socket connection upon window.onfocus
window.onfocus = () => {
    _consoleLog(`Window focused. Checking connection...`);
    if (!socket.connected) {
        _consoleLog(`Passive check, disconnected.`);
        setOffline();
        if (socket.socket.connecting === false) {
            // use a connect() or reconnect() here if you want
            _consoleLog(`Passive check, reconnecting`);
            socket.socket.connect();
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
    if (data == 'Tech mode') {
        _saveButton.disabled = true;
    } else {
        _saveButton.disabled = false;
    }
});

// Upon socket disconnection
socket.on('disconnect', reason => {
    _consoleLog(`Socket disconnected, reason: ${reason}`);
    // try to reconnect
    //socket.socket.connect();
    socket.open();
    _consoleLog(`Trying to reconnect socket.`);
});

socket.on('connect',() => {
    _consoleLog(`Reconnecting room.`);
    socket.emit("join",room);
    setOnline();
    checkStatus();
})

socket.on('reconnect_error',function(reason){
    _consoleLog(`Reconnect error.`);
    setOffline();
    _status.textContent = reason;
    window.location.reload();
})

socket.on('error',(reason) => {
    _consoleLog(`An error occured.`);
    setOffline();
    _status.textContent = 'An error occured:' + reason;
    window.location.reload();
});

// "check" to instruct server send check msg to PC and revert back
// "cb" to check callback from server
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
            window.room = '';
            _consoleLog(`Incorrect room details.`);
            return false;
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
