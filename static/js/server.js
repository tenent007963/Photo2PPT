//Debug section
let isDebug = ( !!window.location.href.match(/dev/g) );

//Define all document elements
const _svppt = document.getElementById("savepptx");
const _gpint = document.getElementById("GSPNint");
const _pptstat = document.getElementById("pptxgenjsstatus");
//const _togppt = document.getElementById("togglepptx"); //no longer in use
const output = document.getElementById("download");
const _pptxne = document.getElementById("pptxnotenabled");
const _fileInput = document.getElementById("e-warranty");
const _imgdown = document.getElementById("wannasavemou");
const _nsi = document.getElementById("nosaveimage");
const _ewanatt = document.getElementById("ewanstat");
const _btncoint = document.getElementById("btn-container");
const _moreopt = document.getElementById("moreopt");
const _latency = document.getElementById("socketlatency");
const _tmbdiv = document.getElementById("rightbar");
const _roomqr = document.getElementById("roomqr");
const _roomindicator = document.getElementById("roomindicator");
const _mainContainer = document.getElementById("main");
const _initContainer = document.getElementById("init");
const _header = document.getElementById("head");
const _ping = document.getElementById("ping");
const _imgdata = document.getElementById("imgdata");
const _bottombar = document.getElementById("bottombar");
const _cs = document.getElementById("cs");
const _tech = document.getElementById("tech");

//Initialize elements
let pptxenabled = false;
let saveimg = false;
let optenb = false;
let photocount = 0;
let latencycount = 0;
let room;
let logping = false;
let logimgdata = false;

//Enable PPTXGenJS...or not?
function togglepptx() {
    if (pptxenabled) {
        _pptstat.innerHTML = "Off";
        pptxenabled = false;
        _svppt.disabled = true;
        _gpint.value = "";
        _gpint.disabled = true;
        _fileInput.value = "";
        _fileInput.disabled = true;
        _ewanatt.style.display = "none";
        photocount = 0;
        rmtmb();
        socket.emit("status",`PptxGenJS not enabled!`,room);
        _consoleLog(`PptxGenJS disabled.`);
        _header.innerHTML = "PptxGenJS disabled.";
    } else {
        window.pptx = new PptxGenJS();
        pptxenabled = true;
        _svppt.disabled = false;
        _gpint.disabled = false;
        _fileInput.disabled = false;
        _pptxne.style.display = "none";
        _pptstat.innerHTML = "On";
        socket.emit("status",`Now adding photo ${photocount+1}`,room);
        _consoleLog(`PptxGenJS enabled, waiting photo.`);
        _header.innerHTML = "PptxGenJS enabled, waiting photo.";
    }
}

// Get WebSocket
const socket = io();

// new "transimage" socket - w/o room param
socket.on("transimage", function(image) {
    _consoleLog(`Image received, processing.`);
    output.src = image;
    //Download image if enabled
    if (saveimg === true) {
        download(image, smartFilename(), "application/octet-stream;base64");
    } else {
        _nsi.style.display = "block"
    }
    if (pptxenabled === true) {
        addSlide(image);
    } else {
        _pptxne.style.display = "block";
    }
});

//External Func for random string generating
function genRand(len) {
    const hash = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ12346789";
    let randomStr = '';
    for(let i = 0; i < len; i++){
        randomStr += hash[parseInt(Math.random()*hash.length)];
    }
    return randomStr;
}

//Newer filename function to determine filename
function smartFilename() {
    let filename = _gpint.value;
    if (filename) {
        return filename.trim();
    } else {
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const stringLength = 10;
        function pickRandom() {	return possible[Math.floor(Math.random() * possible.length)]; }
        let randomString = Array.apply(null, Array(stringLength)).map(pickRandom).join('');
        return randomString;
    }
}

async function genQR(data) {
    const qrcode = new QRCode("roomqr");
    qrcode.makeCode(data);
}


//Refresh Room
function refreshroom() {
    if (socket.connected && room) {
        socket.emit("leave", room);
    }
    room = genRand(10);
    Cookies.set('room',room,{ expires: 31 ,path: ''});

    // Join default channel "test" ,for debug only
    /*
    const room = "test";
    */

    _roomindicator.innerHTML = room;
    _roomqr.innerHTML = "";
    genQR(room);
    socket.emit("join", room);
    socket.emit("server","isOnline",room);
}

//Whenever adding a new slide, image data will parse into this function
function addSlide(image) {
    window.slide = pptx.addNewSlide();
    // Creating anonymous async func to check img orientation
    // checking was done by outer func
    orientCheck(image).then(rotated_image => {
        if(logimgdata) {
            _consoleLog(`Response: ${rotated_image}`);
        }
        triggerthumbnail(rotated_image);
        slide.addImage({ data: rotated_image, x: 0, y: 0, w: 10, h: 5.6});
        _header.innerHTML = `Added Image #${photocount}.`;
    });
}


//Save PPTX as file and reset all to default
function savepptx() {
    if (_gpint && _gpint.value) {
        pptx.save(smartFilename());
        _pptstat.innerHTML = "Off";
        pptxenabled = false;
        _svppt.disabled = true;
        _gpint.value = "";
        _gpint.disabled = true;
        _fileInput.value = "";
        _fileInput.disabled = true;
        _ewanatt.style.display = "none";
        photocount = 0;
        socket.emit("status",`File saved. Please re-enable PPTXGenJS.`,room)
        rmtmb();
        _header.innerHTML = 'File saved. Please re-enable PPTXGenJS.';
        _consoleLog(`PPT file saved. Status reset.`);
    } else {
        alert("No GSPN Service Order number!");
    }}

//Toggle SaveImage On/Off
function saveimage() {
    switch(saveimg) {
        case true:
            saveimg = false;
            _imgdown.innerHTML = "No";
            _nsi.style.display = "block";
            _fileInput.disabled = true;
            break;
        case false:
            saveimg = true;
            _imgdown.innerHTML = "Yes";
            _nsi.style.display = "none";
            _fileInput.disabled = false;
            break;
    }}

//generate thumbnail for current received image and show at sidebar
function triggerthumbnail(image){
    resizeImageToSpecificWidth(200, image, function(dat) {
        const tmbnail = document.createElement("img");
        tmbnail.src = dat;
        tmbnail.setAttribute('id', 'tmbtnb');
        _tmbdiv.appendChild(tmbnail);
    });
    setTimeout(function(){_tmbdiv.scrollTop = _tmbdiv.scrollHeight;},100);
    photocount++
    socket.emit("status",`Now adding photo ${photocount+1}`,room);
}

//Sub-function required for creating thumbnail
function resizeImageToSpecificWidth(max, imgur, cb) {
    let data;
    const img = new Image();
    img.onload = function() {
        const oc = document.createElement('canvas'), octx = oc.getContext('2d');
        if (img.width > max) {
            oc.width = img.width;
            oc.height = img.height;
            octx.drawImage(img, 0, 0);
            if( img.width > img.height) {
                oc.height = (img.height / img.width) * max;
                oc.width = max;
            } else {
                oc.width = (img.width / img.height) * max;
                oc.height = max;
            }
            octx.drawImage(oc, 0, 0, oc.width, oc.height);
            octx.drawImage(img, 0, 0, oc.width, oc.height);
            data = oc.toDataURL();
        } else {
            data = oc.toDataURL();
        }
        cb(data);
    };
    img.src = imgur;
}

// Function to rotate image through extra canvas
// Note: ES6 is required or else code will report error
// Reference: https://jsfiddle.net/tenent007963/sfta0725/1/
async function orientCheck(data) {
    return promise = new Promise(resolve => {
        _consoleLog(`Checking image orientation`);
        let img = new Image();
        img.crossOrigin="anonymous";
        img.src = data;
        // Create a canvas object.
        let canvas = document.createElement("canvas");
        // Wait till the image is loaded.
        img.onload = function(){
            if (img.height > img.width) {
                _consoleLog(`Orientation incorrect, rotating`);
                rotateImage();
            } else {
                _consoleLog(`Orientation correct,exit now`);
                resolve(returnImg());
            }
        }
        let rotateImage = () => {
            // Create canvas context.
            let ctx = canvas.getContext("2d");
            // Assign width and height.
            cw = img.height;
            ch = img.width;
            cx = 0;
            cy = img.height * (-1);

            canvas.setAttribute('width', cw);
            canvas.setAttribute('height', ch);
            ctx.rotate(90 * Math.PI / 180);
            ctx.drawImage(output, cx, cy);
            _consoleLog(`Image rotation complete.`);
            //return canvas.toDataURL("image/png");
            canvas.toBlob(function(blobData){ compressImg(blobData);});
        }

        let compressImg = (imgStream) => {
            const fileReader = new FileReader()
            new Compressor(imgStream, {
                quality: 0.6,
                checkOrientation: false,
                success(result) {
                    // Read file
                    fileReader.readAsDataURL(result);
                },
                error(err) {
                    _consoleLog(err.message);
                },
            });
            fileReader.onloadend = function (event) {
                resolve(event.target.result);
            }
        }

        let returnImg = () => {
            return data;
        }
    });
}

// Select Modes
//CS mode
function initCS() {
    roomInit();
    _cs.style.display= "flex";
    Cookies.set('mode', 'cs',{ expires: 31 ,path: ''});
}

//Tech mode
function initTech() {
    roomInit();
    _tech.style.display= "flex";
    Cookies.set('mode', 'tech',{ expires: 31,path: ''});
}

// Room Pre-initialize, load cookies and other presets from last session
function checkRoomInitialize() {
    try {
        //check isDebug environment
        if (isDebug) {
            window.document.title = "InstantPhoto - Server(Development)";
        }
        //Socket room initialization
        let getRoom = Cookies.get('room');
        if (!getRoom) {
            refreshroom();
            _consoleLog(`Joining new room`);
        } else {
            roomConnect(getRoom);
            _header.innerHTML = 'Joining old room, room code: ' + getRoom + '.';
            _consoleLog(`Joining old room, room code: ${getRoom}`)
        }
        //Mode checking
        let getMode = Cookies.get('mode');
        switch(getMode){
            case "cs":
                initCS();
                _consoleLog(`Init CS Mode.`);
                break;
            case "tech":
                initTech();
                _consoleLog(`Init Tech Mode.`);
                break;
            default:
                break;
        }
        _consoleLog(`Server Preparation done.`);
    }
    catch (err) {
        _mainContainer.innerHTML = err.message;
        setTimeout(()=>{location.reload()}, 2500);
    }
}

// Room initialization
function roomInit(){
    _initContainer.style.display = "none";
    _mainContainer.style.display = "block";
    //Display roomqr popup
    $('#popup').modal('show');
    _consoleLog(`Server ready.`);
}



//Active listener for window

//Listening to Hotkeys
window.addEventListener("keydown", function(event) {
    switch(event.key) {
        case "Enter":
            _consoleLog(`Enter Key Pressed`);
            event.preventDefault();
            if (!pptxenabled) {
                _consoleLog('Nothing to do.Exit now.');
                return false; //return true to submit, false to do nothing
            } else {
                if (photocount >=2) {
                    savepptx();
                    _consoleLog(`Saving PPT file`);
                } else {
                    _consoleLog('PptxGenJS enabled but not enough photos.');
                    alert('Not enough photos.');
                    return false; //return true to submit, false to do nothing
                }
            }
            break;
        case "x" :
            if (!pptxenabled) {
                togglepptx();
            }
            break;
        case "X":
            if (!pptxenabled) {
                togglepptx();
            }
            break;
        case ( (event.ctrlKey && event.shiftKey && event.altKey) & "z" || "Z"  ):
            if (pptxenabled) {
                togglepptx();
                alert(`File discarded!`);
            }
            break;
        case '`':
            saveimage();
            break;
        default:
            _consoleLog(`${event.key}`);
            break;
    }
});

window.addEventListener('paste', function(e) {
    clipboardData = e.clipboardData;
    _fileInput.files = clipboardData.files;
    const file = document.querySelector('input[type=file]').files[0];
    const reader =  new FileReader();
    pastedData = clipboardData.getData('Text');

    if (pptxenabled) {
        _consoleLog(`Detecting input type`);
        if (pastedData) {
            _consoleLog(`Detected input as text`);
            setTimeout(function(){
                if (_gpint.value === pastedData) {
                    return false;
                } else {
                    _gpint.value = pastedData;
                    return false;
                }},100);
        } else if (file instanceof Blob) {
            _consoleLog(`Detected input as blob`);
            reader.readAsDataURL(file);
            reader.onloadend = function () {
                let ewanss = reader.result;
                addSlide(ewanss);
                if (saveimg === true) {
                    download(ewanss, smartFilename(), "application/octet-stream;base64");
                }
            }
            _ewanatt.style.display = "block";
        } else {
            _consoleLog(`Unknown input type, aborting.`);
            reader.abort();
        }
    } else if(saveimg) {
        if (file instanceof Blob) {
            reader.readAsDataURL(file);
            reader.onloadend = function () {
                let pastedImg = reader.result;
                download(pastedImg, smartFilename(), "application/octet-stream;base64");
            }
        } else {
            _consoleLog(`Unknown input type, aborting.`);
            reader.abort();
        }
    } else {
        alert("PPTXGenJS not enabled!");
    }
});


//Below are all functions that are used in dev mode

//Enable Dev toolbar (bottombar)
function devTool() {
    if (typeof xyz === 'undefined') {
        xyz = 1;
    }
    xyz++;
    if(xyz===11){
        let passcode = prompt("Please enter passcode for the development section:", "WritePasswordHere");
        let passphrase = prompt("Please enter passphrase for verification:", "WritePassphraseHere");
        if (passcode === null || passcode === "") {
            _consoleLog("User cancelled the prompt.");
            return false;
        } else if(passphrase === null || passphrase === "") {
            _consoleLog("No passphrase.");
            return false;
        } else {
            const enckey = 'U2FsdGVkX18iazBzCd0Chor8UE+OucOwE3Tlc3yL2wg='; //Pre-enc key
            let decKey = CryptoJS.AES.decrypt(enckey, passphrase).toString; //Static dec key from pre-enc key
            let inputkey = CryptoJS.AES.encrypt(passcode, passphrase); //Enc key from user input
            let inputKeyDec = CryptoJS.AES.decrypt(inputkey, passphrase).toString; //Static dec key from user input
            // decrypted.toString(CryptoJS.enc.Utf8)
            if (decKey === inputKeyDec) { //Verify both static dec key
                _bottombar.style.display="block";
                _consoleLog("Activated.");
                return true;
            } else if(decKey !== inputKeyDec) {
                _consoleLog(`decKey=${decKey},inputKeyDec=${inputKeyDec}, incorrect key.`);
                return false;
            } else {
                _consoleLog('Unknown Error.')
            }
        }
    }
}

//rightbar (thumbnail) cleaning
function rmtmb() {
    _tmbdiv.innerHTML = '';
    _consoleLog(`Rightbar (Preview bar) cleaned.`);
}

//toggle more buttons
function moreopt() {
    switch(optenb) {
        case true:
            optenb = false;
            _btncoint.style.display = "none";
            _moreopt.textContent = "Expand";
            break;
        case false:
            optenb = true;
            _btncoint.style.display = "block";
            _moreopt.textContent = "Collapse";
            break;
    }
}

//static function for enable/disable logging
function _log(opt) {
    switch(opt) {
        case 'ping':
            if(!logping) {
                logping = true;
                _ping.innerHTML = "Hide";
                _consoleLog('Ping En-log');
            } else {
                logping = false;
                _ping.innerHTML = "Show";
                _consoleLog('Ping De-log');
            }
            break;
        case 'imgdata':
            if(!logimgdata) {
                logimgdata = true;
                _imgdata.innerHTML = "Hide";
                _consoleLog('ImgData En-log');
            } else {
                logimgdata = false;
                _imgdata.innerHTML = "Show";
                _consoleLog('ImgData De-log');
            }
            break;
        default:
            return false;
    }
}


// Below are all socket functions / connections

//Function to manual call socket connect
function roomConnect(val) {
    try {
        room = val;
        socket.connect();
        socket.emit('join', val);
        genQR(val);
        socket.emit("server","isOnline",val);
        _roomindicator.innerHTML = room;
        _consoleLog(`Old session reconnected.`)
        return true;
    } catch(err) {
        return err;
    }
}

// Upon socket disconnection
socket.on('disconnect', function(){
    // Save current active ppt with random hash and proceed page reload
    if (pptxenabled && photocount >= 2) {
        pptx.save(smartFilename());
    }
    window.location.reload();
    _consoleLog(`Socket disconnected`);
});

// Return server image status to client upon call
socket.on("status",(data) => {
    _consoleLog(`Received parsed request from host`)
    switch(data) {
        case "check":
            _consoleLog(`Sending status..`);
            $('#popup').modal('hide');
            if (pptxenabled) {
                socket.emit("status",`Now adding photo ${photocount+1}`,room);
            } else {
                socket.emit("status",`PptxGenJS not enabled!`,room);
            }
            break;
        case "save":
            if (pptxenabled) {
                savepptx();
            }
            break;
        default:
            _consoleLog(`Request dropped!`);
            break;
    }
});

// Latency checking
socket.on('pong', function(ping) {
    _latency.textContent = ping + 'ms';
    if(logping) {
        _consoleLog(`Received Pong: ${ping}`);
    }
    //Prompt if latency over acceptable threshold
    if (ping >= 550) {
        latencycount++;
        if (latencycount >= 4) {
            _latency.style.color = "red";
        }
        if (latencycount >= 7) {
            alert('High latency detected, some functions might not working properly.');
        }
    }
    if (ping < 500) {
        latencycount = 0;
        _latency.style.color = "black";
    }
});


//Preserve area

// noinspection JSValidateTypes
window.onload = checkRoomInitialize();

//Small cheat code to make sure heroku dyno doesn't go idling when user is connected
function httpGetAsync(theUrl, callback)
{
    const xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200)
            callback(xmlHttp.responseText);
    }
    xmlHttp.open("GET", theUrl, true); // true for asynchronous
    xmlHttp.send(`Dont sleep fker - Morning call from server side of ${room}`);
}

//To execute every 25 mins for keepalive
setInterval((function() {
    function loop() {
        socket.emit("server","keepAlive",room);
        httpGetAsync('/keepalive',function(res){
            _consoleLog(`Keepalive status from host: ${res}`);
        })
    }
    loop();
    return loop;
}()), 1500000);