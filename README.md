
# RakuDoc Editor


<div id="VERSION&nbsp;&nbsp;&nbsp;&nbsp;v0.1.0"></div><div id="VERSION"></div>

## VERSION&nbsp;&nbsp;&nbsp;&nbsp;v0.1.0
<div id="Overview"></div>

## Overview
<span class="para" id="0ddc507"></span>This repo contains the files needed to create a Docker image that when run locally will allow a browser to create an edit a RakuDoc source file.   
<span class="para" id="46c57a2"></span>A directory is needed into which the source file is copied, eg. `~/rakudoc-test`.   
<span class="para" id="dbc1eef"></span>The container is deployed by running the following inside the directory.   

```
podman run -v .:browser/publication docker.io/finanalyst/browser-editor:latest
```
<span class="para" id="7d21cec"></span>The sample file `sample.rakudoc` is copied into the directory. Inside the browser, the sample file can be edited or a new one created, and the file name can be changed.   
<span class="para" id="e21fc9c"></span>The *web-browser-editor* files are intended for use on a server publicly accessible. The container created by `Web.dockerfile` is intended to be placed behind an Apache or nginx reverse-proxy.   
<span class="para" id="32393e2"></span>The following is a sample extract from an Apache2 conf file:   

```
    ProxyRequests Off
    ProxyVia on

    RewriteEngine on
    RewriteCond %{HTTP:Connection} Upgrade [NC]

    RewriteRule (/'browser-socket'.*) ws://127.0.0.1:12345/$1 [P,L]

    RewriteEngine off

    ProxyPass /browser-socket ws://127.0.0.1:12345/browser-socket
    ProxyPassReverse /browser-socket ws://127.0.0.1:12345/browser-socket
    ProxyPass /rakudoc_editor/ http://127.0.0.1:12345/

    ProxyPass /browser-socket ws://127.0.0.1:12345/browser-socket
    ProxyPassReverse /browser-socket ws://127.0.0.1:12345/browser-socket
    ProxyPass /rakudoc_editor/ http://127.0.0.1:12345/
    ProxyPassReverse /rakudoc_editor/ http://127.0.0.1:12345/
```
<span class="para" id="6914cf3"></span>The browser is given a URL `www.example.com/rakudoc_editor/` the final `/` is important. Finally, the container is started as follows:   

```
sudo docker pull docker.io/finanalyst/rakudoc_browser:latest
sudo docker run -d -p 12345:3000 --rm docker.io/finanalyst/rakudoc_browser
```
<span class="para" id="e1b6bf2"></span>The `3000` is the port being listened to by the Cro server defined by `WebServeBrowser.raku`   
<div id="Credits"></div>

## Credits
Richard N. Hainsworth, aka finanalyst



<div id="License"></div>

## License
｢semantic_LICENCE UNAVAILABLE｣



----

----

Rendered from docs/README.rakudoc/README at 20:43 UTC on 2026-01-16

Source last modified at 20:42 UTC on 2026-01-16



----

----

## WARNINGS

1: Placement of undefined semantic block LICENCE

2: 〘 PCell, Waiting for: semantic_LICENCE 〙

