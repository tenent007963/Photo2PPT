const { Client } = require('pg');

/**
 * Simple Node.js recursivily copy/rename files with specific pattern
 * @license WTFPL
 * @usage $ node preProd.js
 */
var fs = require('fs');

let targetDir= __dirname + '/static/';
let serverDev= targetDir+'server-dev.html';
let serverCssDev= targetDir+'css/'+'server-dev.css';
let serverJsDev= targetDir+'js/'+'server-dev.js';
let server= targetDir+'server.html';
let serverCss= targetDir+'css/'+'server.css';
let serverJs= targetDir+'js/'+'server.js';
let clientDev= targetDir+'client-dev.html';
let clientCssDev= targetDir+'css/'+'client-dev.css';
let clientJsDev= targetDir+'js/'+'client-dev.js';
let client= targetDir+'client.html';
let clientCss= targetDir+'css/'+'client.css';
let clientJs= targetDir+'js/'+'client.js';

function preProd(src, des) {
    fs.copyFile(src,des, (err) => { 
        if (err) { 
          console.log("Error Found:", err); 
        } 
        else { 
          console.log(`\nFile copied`,des); 
        } 
    }); 
}

preProd(serverDev, server);
preProd(serverCssDev, serverCss);
preProd(serverJsDev, serverJs);
preProd(clientDev, client);
preProd(clientCssDev, clientCss);
preProd(clientJsDev, clientJs);

return 0;

