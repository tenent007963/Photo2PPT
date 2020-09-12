//Debug section
let isDebug = ( !!window.location.href.match(/dev/g) );

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

//Loading dependencies depends on env
//https://gist.github.com/adikahorvath/8707925
if(isDebug) {
    // js
    var loadScript = document.createElement('script');
    loadScript.type = "text/javascript";
    loadScript.src = window.location.pathname + ".js";
    loadScript.async = "true";

    document.getElementsByTagName('head')[0].appendChild(loadScript);

    // CSS
    var loadStyle = document.createElement('link');
    loadStyle.rel = "stylesheet";
    loadStyle.href = window.location.pathname + ".css";

    document.getElementsByTagName('head')[0].appendChild(loadStyle);
} else {
    var loadScript = document.createElement('script');
    loadScript.type = "text/javascript";
    loadScript.src = "server.js";
    loadScript.async = "true";

    document.getElementsByTagName('head')[0].appendChild(loadScript);

    // CSS
    var loadStyle = document.createElement('link');
    loadStyle.rel = "stylesheet";
    loadStyle.href = "/client.css";

    document.getElementsByTagName('head')[0].appendChild(loadStyle);
}