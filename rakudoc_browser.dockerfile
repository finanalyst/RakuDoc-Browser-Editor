FROM docker.io/finanalyst/raku-cro-rrr-base

RUN mkdir browser browser/assets browser/samples
RUN adduser -D rakudocer
RUN chown rakudocer:rakudocer browser browser/samples browser/assets
WORKDIR browser
ARG CACHEBUST=abc
COPY samples/ ./samples
COPY assets/ ./assets
COPY MakeOptions.raku .
RUN raku MakeOptions.raku
RUN sass assets/browser.scss:assets/browser.css
COPY WebServeBrowser.raku .
RUN raku -c WebServeBrowser.raku
#USER rakudocer
CMD raku WebServeBrowser.raku
