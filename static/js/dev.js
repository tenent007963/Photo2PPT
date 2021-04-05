//Debug section
let isDebug = ( !!window.location.href.match(/dev/g) );
var versionUpdate = (new Date()).getTime();

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
    loadScript.src = window.location.pathname + ".js?v=" + versionUpdate;
    loadScript.async = "true";

    document.getElementsByTagName('head')[0].appendChild(loadScript);

    // CSS
    var loadStyle = document.createElement('link');
    loadStyle.rel = "stylesheet";
    loadStyle.href = window.location.pathname + ".css?v=" + versionUpdate;

    document.getElementsByTagName('head')[0].appendChild(loadStyle);

    //Enabled for Socket.io debug
    localStorage.debug = '*';

} else {
    if (window.location.href.match(/pc/g)) {
        var loadScript = document.createElement('script');
        loadScript.type = "text/javascript";
        loadScript.src = "server.js?v=" + versionUpdate;
        loadScript.async = "true";

        document.getElementsByTagName('head')[0].appendChild(loadScript);

        // CSS
        var loadStyle = document.createElement('link');
        loadStyle.rel = "stylesheet";
        loadStyle.href = "/server.css?v=" + versionUpdate;

        document.getElementsByTagName('head')[0].appendChild(loadStyle);
    } else if (window.location.href.match(/phone/g)) {
        var loadScript = document.createElement('script');
        loadScript.type = "text/javascript";
        loadScript.src = "client.js?v=" + versionUpdate;
        loadScript.async = "true";

        document.getElementsByTagName('head')[0].appendChild(loadScript);

        // CSS
        var loadStyle = document.createElement('link');
        loadStyle.rel = "stylesheet";
        loadStyle.href = "/client.css?v=" + versionUpdate;

        document.getElementsByTagName('head')[0].appendChild(loadStyle);
    }
    console.log('Normal Env.');
}