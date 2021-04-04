//Define all document elements
const _svppt = document.getElementById("savepptx");
const _gpint = document.getElementById("GSPNintCS");
const _gpint1 = document.getElementById("GSPNintTech")
const _pptstat = document.getElementById("pptxgenjsstatus");
const output = document.getElementById("download");
const _pptxne = document.getElementById("pptxnotenabled");
const _imgdown = document.getElementById("wannasavemou");
const _nsi = document.getElementById("nosaveimage");
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
const _photo = document.getElementById("photoFile");
const _prompt = document.getElementById("prompt"); //Future purpose
const _dPrompt = document.getElementById("dropZone-prompt");
const _cPrefix = document.getElementById("currentPrefix");
const dropZone = document.body; //This line is for image file dropping

//Preset status
let pptxenabled = false;
let saveimg = false;
let optenb = false;
let photocount = 0;
let latencycount = 0;
let room;
let logping = false;
let logimgdata = false;
let gpintFocus = false;

//Pre-init elements
let mode = '';
let prefix = '';

//Enable PPTXGenJS...or not?
function togglepptx() {
    if (pptxenabled) {
        _pptstat.innerHTML = "Off";
        pptxenabled = false;
        _svppt.disabled = true;
        _gpint.value = "";
        _gpint.disabled = true;
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
socket.on("transimage", function(buffallow) {
    _consoleLog(`Image received, processing.`);
    let base64string = btoa([].reduce.call(new Uint8Array(buffallow),function(p,c){return p+String.fromCharCode(c)},''))
    let image = 'data:image/jpg;base64, ' + base64string;
    output.src = image;
    if(logimgdata){
        console.log(image);
    }
    //Download image if enabled
    if (saveimg === true) {
        imageDl(image);
    } else {
        _nsi.style.display = "block"
    }
    if (pptxenabled === true) {
        addSlide(image);
    } else {
        if (mode === 'cs') {
            _pptxne.style.display = "block";
        }
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

//Toggle file prefix, in tech mode only
let togglePrefix = () => {
    switch(prefix) {
        case '':
            prefix = 'wrt_';
            _cPrefix.innerHTML = 'wrt_';
            break;
        case 'wrt_':
            prefix = 'batt_';
            _cPrefix.innerHTML = 'batt_';
            break;
        case 'batt_':
            prefix = '';
            _cPrefix.innerHTML = 'N/A';
            break;
        default:
            prefix = '';
            _cPrefix.innerHTML = 'N/A';
            break;
    }
}

//Newer filename function to determine filename
function smartFilename() {
    if (_gpint.value) {
        let name = _gpint.value;
        return name.trim();
    } else if(_gpint1.value) {
        let name = prefix + _gpint1.value;
        return name.trim();
    } else {
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const stringLength = 10;
        function pickRandom() {	return possible[Math.floor(Math.random() * possible.length)]; }
        let randomString = Array.apply(null, Array(stringLength)).map(pickRandom).join('');
        let randName = prefix + randomString;
        return randName;
    }
}

//Download image function, to fix file naming problem
function imageDl(data) {
    download(data, smartFilename(), data.type);
}

async function genQR(data) {
    const qrcode = new QRCode("roomqr",{width: 330,height: 330,});
    qrcode.makeCode(data);
}


//Refresh Room
function refreshroom() {
    if (socket.connected && room) {
        socket.emit("leave", room);
    }
    room = genRand(10);
    Cookies.set('room',room,{ expires: 31 ,path: ''});

    _roomindicator.innerHTML = room;
    _roomqr.innerHTML = "";
    genQR(room);
    socket.emit("join", room);
    socket.emit("server","isOnline",room);
}

//Whenever adding a new slide, image data will parse into this function
function addSlide(image) {
    // Creating anonymous async func to check img orientation
    // checking was done by outer func
    orientCheck(image).then(rotated_image => {
        if(logimgdata) {
            console.log(`Response: ${rotated_image}`);
        }
        let imgmeasures = new Image(); 
        imgmeasures.onload = function() {
            let ppt_width = 10, ppt_height = 5.6;
            let img_width = (imgmeasures.width / 96).toFixed(2);
            let img_height = (imgmeasures.height / 96).toFixed(2);
            //_consoleLog(`Width: ${width}, Height: ${height}.`)
            if (ppt_width/ppt_height > img_width/img_height) {
                var width = ppt_height/img_height*img_width, height = ppt_height;
            } else if (ppt_width/ppt_height < img_width/img_height) {
                var width = ppt_width, height = ppt_width/img_width*img_height;
            } else if (ppt_width/ppt_height == img_width/img_height) {
                var width = img_width, height= img_height;
            }
            window.slide = pptx.addNewSlide();
            slide.addImage({ data: rotated_image,w:width, h:height, sizing:{ type:'contain',w:10,h:5.6}});
        }
        imgmeasures.src = rotated_image;
        triggerthumbnail(rotated_image);
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
            break;
        case false:
            saveimg = true;
            _imgdown.innerHTML = "Yes";
            _nsi.style.display = "none";
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
    //Convert base64 into blob for compression
    const base64 = await fetch(data);
    const blob = await base64.blob();

    return promise = new Promise(resolve => {
        _consoleLog(`Checking image orientation`);
        let img = new Image();
        img.crossOrigin="anonymous";
        img.src = data;
        // Wait till the image is loaded.
        img.onload = function(){
            if (img.height > img.width) {
                _consoleLog(`Orientation incorrect, rotating`);
                rotateImage();
            } else {
                _consoleLog(`Orientation correct,exit now`);
                //returnImg();
                compressImg(blob); //To compress image
            }
        }
        let rotateImage = () => {
            // Create a canvas object.
            let canvas = document.createElement("canvas");
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
            ctx.drawImage(img, cx, cy);
            _consoleLog(`Image rotation complete.`);
            //resolve(canvas.toDataURL("image/png"));
            canvas.toBlob((blobData)=>{compressImg(blobData)});
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
            fileReader.onloadend = (event) => {
                resolve(event.target.result);
            }
        }

        let returnImg = () => {
            resolve(data);
        }
    });
}

// Select Modes
//CS mode
function initCS() {
    roomInit();
    _cs.style.display= "flex";
    mode = "cs";
    //Cookies.remove('mode'); //reset cookie
    Cookies.set('mode', 'cs',{ expires: 7 ,path: ''});
    return 0;
}

//Tech mode
function initTech() {
    roomInit();
    _tech.style.display= "flex";
    mode = "tech";
    saveimg = true;
    //Cookies.remove('mode'); //reset cookie
    Cookies.set('mode', 'tech',{ expires: 7,path: ''});
    return 0;
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
        let getMode = Cookies.get('mode') || null;
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
                return null;
                break;
        }
        _consoleLog(`Server Preparation done.`);
    }
    catch (err) {
        _mainContainer.innerHTML = err.message;
        setTimeout(()=>{location.reload(true)}, 2000);
    }
}

// Room initialization
function roomInit(){
    _initContainer.style.display = "none";
    _mainContainer.style.display = "block";
    //Display roomqr popup
    $('#popup').modal('show');
    _consoleLog(`Server ready.`);
    return 0;
}

//Switch between CSO and Tech mode
let changemode = () => {
    Cookies.remove('mode');
    mode = '';
    location.reload(true);
    return 0;
}

//Active listener for window

//Listening to Hotkeys & Keystrokes
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
            //_consoleLog(`${event.key}`);
            break;
    }
});

//Sample: https://jsfiddle.net/ourcodeworld/hzvfq82b/
window.addEventListener('paste', function(e) {
    clipboardData = e.clipboardData;
    let file = clipboardData.files[0];
    let reader =  new FileReader();
    pastedData = clipboardData.getData('Text');

    //if (file instanceof Blob) {
    if (file) {
        reader.readAsDataURL(file);
        reader.onloadend = function () {
            if(logimgdata){
                console.log(reader.result);
            }
            if (pptxenabled) {
                addSlide(reader.result);
            }
            if (saveimg) {
                imageDl(reader.result);
            }
            if(!pptxenabled && !saveimg) {
                alert("PPTXGenJS not enabled!");
            }
            return true;
        } 
    }
    if (!gpintFocus) {
        if (pastedData && pptxenabled) {
            _gpint.value = pastedData.trim();
            return true;
        }
    } 
    if(mode = 'tech') {
        _gpint1.value = pastedData.trim();
        return true;
    }

    alert("Operation not supported!");

});

//To fix duplicate entry when direct paste in _gpint
[_gpint,_gpint1].forEach(function(e){
    e.onfocus = function() {
        gpintFocus = true;
    }
    e.onblur = function() {
        gpintFocus = false;
    }
})


//Dropzone : Drop the beat
if (dropZone) {
    _consoleLog("Drop action ok.")
    const hoverClassName = "hover";

    // Handle drag* events to handle style
    // Add the css you want when the class "hover" is present
    dropZone.addEventListener("dragenter", function (e) {
        e.preventDefault();
        dropZone.classList.add(hoverClassName);
        _dPrompt.classList.add('fadeShow');
        _dPrompt.classList.remove('fadeHide');
    });

    dropZone.addEventListener("dragover", function (e) {
        e.preventDefault();
        dropZone.classList.add(hoverClassName);
        _dPrompt.classList.add('fadeShow');
        _dPrompt.classList.remove('fadeHide');
    });

    dropZone.addEventListener("dragleave", function (e) {
        e.preventDefault();
        dropZone.classList.remove(hoverClassName);
        _dPrompt.classList.add('fadeHide');
        _dPrompt.classList.remove('fadeShow');
    });

    // This is the most important event, the event that gives access to files
    dropZone.addEventListener("drop", function (e) {
        e.preventDefault();
        dropZone.classList.remove(hoverClassName);
        _dPrompt.classList.add('fadeHide');
        _dPrompt.classList.remove('fadeShow');
        _consoleLog('File dropped.')
        const files = Array.from(e.dataTransfer.files);
        _consoleLog(files);
        if (files.length > 0) {
            //const data = new FormData();
            for (const file of files) {
                //data.append('file', file);
                let reader =  new FileReader();
                reader.readAsDataURL(file);
                reader.onloadend = function () {
                    if(logimgdata){
                        console.log(reader.result);
                    }
                    if (pptxenabled) {
                        addSlide(reader.result);
                    }
                    if (saveimg) {
                        imageDl(reader.result);
                    }
                    if(!pptxenabled && !saveimg) {
                        alert("PPTXGenJS not enabled!");
                    }
                } 
            }
            
        }
    });
}

//Below are all functions that are used in dev mode

//Enable Dev toolbar (bottombar)
function devTool() {
    if (typeof xyz === 'undefined') {
        xyz = 1;
    }
    xyz++;
    if(xyz===11){
        const passcode = prompt("Please enter passcode for the development section:", "WritePasswordHere");
        const passphrase = prompt("Please enter passphrase for verification:", "WritePassphraseHere");
        if (passcode === null || passcode === "") {
            _consoleLog("User cancelled the prompt.");
            return false;
        } else if(passphrase === null || passphrase === "") {
            _consoleLog("No passphrase.");
            return false;
        } else {
            const enckey = 'U2FsdGVkX18iazBzCd0Chor8UE+OucOwE3Tlc3yL2wg='; //Pre-enc key
            const decKey = CryptoJS.AES.decrypt(enckey, passphrase).toString; //Static dec key from pre-enc key
            const inputkey = CryptoJS.AES.encrypt(passcode, passphrase); //Enc key from user input
            const inputKeyDec = CryptoJS.AES.decrypt(inputkey, passphrase).toString; //Static dec key from user input
            // decrypted.toString(CryptoJS.enc.Utf8)
            if (decKey === inputKeyDec) { //Verify both static dec key
                _bottombar.style.display="block";
                _consoleLog("Activated.");
                return true;
            } else if(decKey != inputKeyDec) {
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
    _consoleLog(`Received parsed request from host`);
    switch(data) {
        case "check":
            _consoleLog(`Sending status..`);
            $('#popup').modal('hide');
            switch (mode) {
                case "cs":
                    if (pptxenabled) {
                        socket.emit("status",`Now adding photo ${photocount+1}`,room);
                        return 0;
                    } else if (!pptxenabled && saveimg) {
                        socket.emit("status",`Saving photos only.`,room);
                        return 0;
                    } else {
                        socket.emit("status",`PptxGenJS not enabled!`,room);
                        return 0;
                    }
                    break;
                case "tech":
                    if (saveimg){
                        socket.emit("status",`Tech mode`,room);
                        return 0;
                    } 
                    break;
                default:
                    socket.emit("status",`Waiting for user input...`,room);
                    break;
            }
            if (!pptxenabled && !saveimg && !mode) {
                socket.emit("status",`Room initializing`,room);
            }
            break;
        case "save":
            if (pptxenabled) {
                savepptx();
            } else {
                alert("There's no active file!");
            }
            break;
        default:
            _consoleLog(`Request dropped!`);
            socket.emit("status",`Unknown error, please refresh page.`,room);
            break;
    }
});

// Latency checking
socket.on('pong', (ping) => {
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