//Default debug Code, do not modify
async function _consoleLog(stringData) {
    if(isDebug) {
        console.log(stringData);
        //TODO: https://help.papertrailapp.com/kb/configuration/configuring-centralized-logging-from-javascript/
    }
}