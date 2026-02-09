FROM docker.io/finanalyst/raku-cro-rrr-enum-base

RUN mkdir browser browser/assets browser/publication
WORKDIR browser
COPY publication/ ./publication
ARG RN=4z
COPY assets/ ./assets
COPY ServeBrowser.raku .
RUN sass assets/browser.scss:assets/browser.css
RUN raku -c ServeBrowser.raku
EXPOSE 3000
CMD raku ServeBrowser.raku