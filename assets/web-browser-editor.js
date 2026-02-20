var editor;
var taintedRender = true;
var browserSocket;
var renderFrame;
var renderingPane;
var initialContent;
var fileName = 'sample.rakudoc';
var saveName = 'MyRakuDoc';
var signal;
var rakuDocSource = true; // if false then HTML
var formatType = '.rakudoc';
var frameworkToggle = false;
const socketIsOpen = function(ws) {
    return ws.readyState === ws.OPEN
}
const signalLight = function( type ) {
    signal.style.backgroundColor = type ? 'red' : 'green';
    signal.title = type ? 'Processing' : 'Rendered'
}
function sendSource() {
    let source = editor.session.getValue();
    if(socketIsOpen(browserSocket)) {
        browserSocket.send(JSON.stringify({
            "source" : source,
            "online" : frameworkToggle
        }));
        signalLight( true );
    }
}
function fetchFile() {
    if(socketIsOpen(browserSocket)) {
        browserSocket.send(JSON.stringify({
            "filename" : fileName
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
function saveSource() {
    let url;
    if ( rakuDocSource ) {
        let source = editor.session.getValue();
        let blob = new Blob([source], { type: 'text/plain' });
        url = window.URL.createObjectURL(blob);
    }
    else {
        url = window.blobUrl;
    }
    const link = document.createElement('a');
    link.href = url;
    link.download = downLoadName.value + formatType;
    link.style.display = 'none'; // Ensure it's hidden
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url); // Clean up the URL
}
window.addEventListener('load', function () {
    filePicker = document.getElementById('file-picker');
    fileNameSelect = document.getElementById('filename');
    downloadButton = document.getElementById('downLoadFile');
    downloadName = document.getElementById('downLoadName');
    fileNameSelect.addEventListener('change', (event) => {
        fileName = event.target.value;
        fetchFile();
    });
    downloadName.value = saveName;
    signal = document.getElementById('signal');
    renderFrame = document.getElementById('renderFrame');
    sourceFileToggleBtn = document.getElementById('source-toggle');
    frameworkToggleBtn = document.getElementById('framework-toggle');
    formatTypeValue = document.getElementById('format');
    formatTypeValue.value = formatType;
//    renderingPane = document.getElementById('renderingModal');
    filePicker.addEventListener('change', function() {
        if (filePicker.files.length === 1) {
            var file = filePicker.files[0];
            fileName = file.name;
            var reader = new FileReader();
            reader.readAsText(file,'UTF-8');
            reader.onload = readerEvent => {
              var content = readerEvent.target.result; // this is the content!
              editor.session.setValue( content );
              sendSource();
              initialContent = content;
            }
        }
    });

    downloadButton.addEventListener('click', function() {
        saveSource();
    });
    frameworkToggleBtn.addEventListener('click', function( ) {
        frameworkToggle = ! frameworkToggle;
        frameworkToggleBtn.innerHTML = frameworkToggle ? 'Minimal single file' : 'Bulma & plugins';
        sendSource();
    });
    sourceFileToggleBtn.addEventListener('click', function( ) {
       rakuDocSource = ! rakuDocSource;
       sourceFileToggleBtn.innerHTML = rakuDocSource ? 'RakuDoc source' : 'HTML Rendering';
       formatType = rakuDocSource ? '.rakudoc' : '.html';
       formatTypeValue.value = formatType;
   });
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
        const socketProtocol = (window.location.protocol === 'https:' ? 'wss:' : 'ws:');
        const socketUrl = `${socketProtocol}//${window.location.hostname}/browser-socket`;
        return new Promise((resolve, reject) => {
            browserSocket = new WebSocket(socketUrl);
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
                    blobUrl = blobify(blobUrl, parsedData.html)
                    renderFrame.src = blobUrl;
                    signalLight( false );
                }
                else if ( parsedData.hasOwnProperty('rakudoc') && parsedData.rakudoc != '' ) {
                    editor.session.setValue( parsedData.rakudoc );
                    sendSource();
                    initialContent = parsedData.rakudoc;
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
        // do not send if render is still processing
        if ( signal.style.backgroundColor == 'red') { return };
        sendSource();
    });
    if (browserSocket == null ) { connectRender() }
});