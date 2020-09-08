//Default debug Code, do not modify
async function _consoleLog(stringData) {
    if(isDebug) {
        console.log(stringData);
        const data = JSON.stringify({
            room: room,
            msg: stringData
        })
        const xhr = new XMLHttpRequest();
        xhr.open("POST", 'papertrail', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(data);
    }
}