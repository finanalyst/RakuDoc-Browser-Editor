FROM docker.io/finanalyst/raku-cro-rrr-base

RUN mkdir browser browser/assets browser/publication
WORKDIR browser
COPY assets/ ./assets
COPY publication/ ./publication
COPY ServeBrowser.raku .
RUN sass assets/browser.scss:assets/browser.css
RUN raku -c ServeBrowser.raku
EXPOSE 3000
CMD raku ServeBrowser.raku