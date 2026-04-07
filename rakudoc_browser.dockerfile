FROM docker.io/finanalyst/raku-cro-rrr-enum-base

RUN mkdir browser browser/assets browser/publication
RUN adduser -D rakudocer
RUN chown rakudocer:rakudocer browser browser/publication browser/assets
WORKDIR browser
ARG CACHEBUST=a
COPY assets/ ./assets
RUN sass assets/browser.scss:assets/browser.css
COPY WebServeBrowser.raku .
RUN raku -c WebServeBrowser.raku
USER rakudocer
CMD raku WebServeBrowser.raku
