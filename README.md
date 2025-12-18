
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
<div id="Credits"></div>

## Credits
Richard N. Hainsworth, aka finanalyst



<div id="License"></div>

## License
｢semantic_LICENCE UNAVAILABLE｣



----

----

Rendered from docs/README.rakudoc/README at 17:30 UTC on 2025-12-18

Source last modified at 17:29 UTC on 2025-12-18



----

----

## WARNINGS

1: Placement of undefined semantic block LICENCE

2: 〘 PCell, Waiting for: semantic_LICENCE 〙

