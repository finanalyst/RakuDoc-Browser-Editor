var editor;
var browserSocket;
var renderFrame;
var renderingPane;
var initialContent;
var fileName;
// render state
var RS_processing;
var RS_failed;
var RS_success;
var RS_changes;
var renderInProgress = false;
var manualRender;
// rendering
var forceRenderBtn;
var timerId;
var frameworkName;
// Source selection
var sampleSelectBtn;
var sampleSelection;
var uploadFile;
var filePicker;
// download
var downloadBtn;
var downloadForm;
var downloadName;

const socketIsOpen = function(ws) {
    if ( ws == null ) return false;
    return ws.readyState === ws.OPEN
}
const renderState = function( type ) {
    RS_changes.classList.add('hidden');
    RS_failed.classList.add('hidden');
    RS_processing.classList.add('hidden');
    RS_success.classList.add('hidden');
    window['RS_' + type ].classList.remove('hidden');
}
function sendSource() {
    if ( editor == null ) {
        alert('no editor loaded');
        return
    }
    let source = editor.session.getValue();
   if(socketIsOpen(browserSocket)) {
        browserSocket.send(JSON.stringify({
            "source" : source,
            "online" : onlineFramework.checked
        }));
        renderState( 'processing' );
        renderInProgress = true;
    }
}
function fetchFile() {
    if(socketIsOpen(browserSocket)) {
        browserSocket.send(JSON.stringify({
            "filename" : fileName
        }))
    }
    else { editor.session.setValue( 'Link to render socket not established (yet?)' ) }
}
var blobUrl;
const blobify = ( bUrl, data ) => {
    if ( bUrl !== null ) { URL.revokeObjectURL( bUrl ) }
    const blob = new Blob([ data ], { type: "text/html" } );
    bUrl = URL.createObjectURL( blob );
    return bUrl
};
function saveSource( filename, fileformat ) {
    let url;
    if ( fileformat == 'HTML'  ) {
        url = window.blobUrl;
    }
    else {
        let source = editor.session.getValue();
        let blob = new Blob([source], { type: 'text/plain' });
        url = window.URL.createObjectURL(blob);
        fileName = filename + fileformat;

    }
    const link = document.createElement('a');
    link.href = url;
    link.download = filename + fileformat;
    link.style.display = 'none'; // Ensure it's hidden
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url); // Clean up the URL
}
function hideAll( missThis ) {
    if (missThis !== 'samples' ) { sampleSelection.classList.add('hidden') };
    if (missThis !== 'upload' ) { filePicker.classList.add('hidden') };
    if (missThis !== 'download' ) { downloadForm.classList.add('hidden') };
    if (missThis !== 'info' ) { aboutInfoPanel.classList.add('hidden') };
}
window.addEventListener('load', function () {
    RS_processing = document.getElementById('processing');
    RS_failed = document.getElementById('failed');
    RS_success = document.getElementById('success');
    RS_changes = document.getElementById('changes');
    forceRenderBtn = document.getElementById('forceRender');
    manualRender = document.getElementById('manualRender');
    sampleSelectBtn = document.getElementById('select_Sample');
    sampleSelection = document.getElementById('sampleSelection');
    fileNameInput = document.getElementById('sourceFileInput');
    uploadFile = document.getElementById('uploadFile');
    filePicker = document.getElementById('filePicker');
    downloadBtn = document.getElementById('downloadBtn');
    downloadForm = document.getElementById('downloadForm');
    downloadName = document.getElementById('downloadName');
    onlineFramework = document.getElementById('onlineFramework');
    renderFrame = document.getElementById('renderFrame');
    aboutInfoBtn = document.getElementById('aboutInfo');
    aboutInfoPanel = document.getElementById('about_info');
    // hide popups when radio buttons changed and force a render for framework
    document.getElementById('renderOptions').addEventListener('change', (e) => { 
         hideAll('all');
         // flush the changes to render when toggle back to auto
         if ( e.target.id == 'autoRender' ) { sendSource() }
    });
    document.getElementById('frameworkOptions').addEventListener('change', (e) => { 
        hideAll('all');
        sendSource();
    });

    // Rendering
    forceRenderBtn.addEventListener('click', function() {
        hideAll('all');
        // cancel accumulating timer
        clearTimeout(timerId);
        // do not force if already rendering
        if ( renderInProgress ) { return };
        sendSource();
    });
    // getting source section
    // get the selection options from the object provide by Cro
    // fill the selection from the object
    selectionOptions.forEach( ( pair ) => { 
        Object.entries( pair ).forEach(([key, value]) => {
            let option_elem = document.createElement('option');
            option_elem.value = value;
            option_elem.textContent = key;
            sampleSelection.appendChild(option_elem);
        }) 
    });
    sampleSelectBtn.addEventListener('click', function() {
        hideAll('samples');
        sampleSelection.classList.toggle('hidden');
    });
    sampleSelection.addEventListener('change', (event) => {
        fileName = event.target.value;
        fileNameInput.value = fileName;
        fetchFile();
        // after fetch make select element disappear
        sampleSelection.classList.add('hidden');
    });
    // attaching data in about section from ab object generated by MakeDynamics
    let aboutPanel = document.getElementById('about');
    aboutPanel.querySelectorAll('details p').forEach( (e) => {  e.innerHTML = dynamicData[ e.id ] } ) ;
    aboutInfoBtn.addEventListener('click', function() {
        hideAll('info');
        aboutInfoPanel.classList.toggle('hidden');
    })
    // initial source, which is the first item in the object
    fileName = Object.values(selectionOptions[0])[0];
    fileNameInput.value = fileName;
    // defer fetching file until socket established
    uploadFile.addEventListener('click', function() {
        hideAll('upload');
        filePicker.classList.toggle('hidden');
    });
    filePicker.addEventListener('change', function() {
        if (filePicker.files.length === 1) {
            var file = filePicker.files[0];
            fileName = file.name;
            var reader = new FileReader();
            reader.readAsText(file,'UTF-8');
            reader.onload = readerEvent => {
              var content = readerEvent.target.result; // this is the content!
              if (editor == null) { 
                alert('editor not instantiated')
              }
              else {
                editor.session.setValue( content );
                sendSource();
              }
                initialContent = content;
            }
        }
        filePicker.classList.add('hidden');
    });
    // Download section
    downloadBtn.addEventListener('click', function() {
        downloadName.value = fileName.replace(/\.[^/.]+$/, "");
        hideAll('download');
        downloadForm.classList.toggle('hidden');
    });
    downloadForm.addEventListener( 'submit', function( elem )  {
        elem.preventDefault();
        saveSource( downloadName.value, saveFormat.value);
        fileNameInput.value = fileName;
        downloadForm.classList.add('hidden');
        return false // prevent default action
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
        //let url = window.location.hostname;
        //let port = window.location.port;
        //if (url == 'localhost' ) { url = 'localhost:3000' };
        const socketUrl = `${socketProtocol}//${window.location.hostname}:${window.location.port}/browser-socket`;
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
                    if ( parsedData.renderState ) {
                        renderState('success')
                    }
                    else {
                        renderState('failed')
                    }
                    renderInProgress = false;
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
        // change render status to changes
        renderState( 'changes' );
        // do not send if render is manual
        if ( manualRender.checked) { return };
        // do not send if render is still processing
        if ( renderInProgress ) { return };
        // wait for a period after typing to accumulate changes
        clearTimeout(timerId);
        timerId = setTimeout( sendSource(), 500 );
    });
    if (browserSocket == null ) { connectRender() }
    // now fetch first file
    fetchFile();
});