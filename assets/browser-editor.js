var localServer = 'ws://localhost:3000/browser-socket';
var editor;
var taintedRender = true;
var browserSocket;
var renderFrame;
var initialContent;
var fileName;
fileName = 'sample.rakudoc';
const socketIsOpen = function(ws) {
    return ws.readyState === ws.OPEN
}
function sendSource() {
    let source = editor.session.getValue();
    if(socketIsOpen(browserSocket)) {
        browserSocket.send(JSON.stringify({
            "source" : source
        }))
    }
}
function fetchFile() {
    if(socketIsOpen(browserSocket)) {
        browserSocket.send(JSON.stringify({
            "filename" : fileName
        }))
    }

}
function saveSource() {
    let source = editor.session.getValue();
    if(socketIsOpen(browserSocket)) {
        browserSocket.send(JSON.stringify({
            "save": fileName,
            "save-source" : source
        }))
    }
}
var blobUrl;
const blobify = ( bUrl, data ) => {
    if ( bUrl !== null ) { URL.revokeObjectURL( bUrl ) }
    const blob = new Blob([ data ], { type: "text/html" } );
    bUrl = URL.createObjectURL( blob );
    return bUrl
};
window.addEventListener('load', function () {
    filePicker = document.getElementById('file-picker');
    fileNameInput = document.getElementById('filename');
    saveButton = document.getElementById('save-file');
    loadButton = document.getElementById('load-file');
    fileNameInput.value = fileName;
    filePicker.addEventListener('change', function() {
        if (filePicker.files.length === 1) {
            fileName = filePicker.files[0];
            fileNameInput.value = fileName;
        }
    });
    saveButton.addEventListener('click', function() {
        fileName = fileNameInput.value;
        saveSource();
    });
    loadButton.addEventListener('click', function() {
        fileName = fileNameInput.value;
        fetchFile();
    });
    renderFrame = document.getElementById('renderFrame');
    editor = ace.edit("editor");
    editor.setOptions({
       behavioursEnabled: true,
       autoScrollEditorIntoView: true
    });
    // credit: This javascript file is adapted from
    // https://fjolt.com/article/javascript-websockets
    // Connect to the websocket
    // This will let us create a connection to our Server websocket.
    const connectRender = function() {
        // Return a promise, which will wait for the socket to open
        return new Promise((resolve, reject) => {
            browserSocket = new WebSocket(localServer);
            // This will fire once the socket opens
            browserSocket.onopen = (e) => {
                // Send a little test data, which we can use on the server if we want
                browserSocket.send(JSON.stringify({ "loaded" : true }));
                // Resolve the promise - we are connected
                resolve();
            }
            // This will fire when the server sends the user a message
            browserSocket.onmessage = (data) => {
                let parsedData = JSON.parse(data.data);
                if (parsedData.connection == 'Confirmed') {
                    if ( initialContent == null ) { fetchFile() };
                }
                else if ( parsedData.hasOwnProperty('html') && parsedData.html != '' ) {
                    renderFrame.src = blobify(blobUrl, parsedData.html);
                }
                else if ( parsedData.hasOwnProperty('rakudoc') && parsedData.rakudoc != '' ) {
                    editor.session.setValue( parsedData.rakudoc );
                    sendSource();
                    initialContent = parsedData.rakudoc;
                }
                else if ( parsedData.hasOwnProperty('error') && parsedData.error != '' )  {
                    alert(parsedData.error) ;
                }
                else { alert('Unknown response:' + parsedData) }
            }
            // This will fire on error
            browserSocket.onerror = (e) => {
                // Return an error if any occurs
                console.log(e);
                alert('Socket error:' + e);
                resolve();
                // Try to connect again
                //connectRender();
            }
        });
    }
    editor.session.on('change', function() {
        sendSource();
    });
    if (browserSocket == null ) { connectRender() }
});