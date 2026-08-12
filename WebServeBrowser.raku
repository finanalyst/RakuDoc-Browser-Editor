#! /usr/bin/env raku
use v6.d;
use Cro::HTTP::Router;
use Cro::HTTP::Server;
use Cro::HTTP::Log::File;
use Cro::HTTP::Router::WebSocket;
use RakuDoc::To::HTML;
use RakuDoc::To::HTML-Extra;

my RakuDoc::Processor $rdp = RakuDoc::To::HTML.new.rdp;
my RakuDoc::Processor $rdp-online = RakuDoc::To::HTML-Extra.new.rdp;
$rdp.add-templates( {
    footer => -> %prm, $tmpl {
        qq:to/FOOTER/;
        \n<div class="footer">
            Single-file HTML Modified {(sprintf( "at %02d:%02d UTC on %s", .hour, .minute, .yyyy-mm-dd) with now.DateTime)}</span>
        { qq[<div class="warnings">%prm<warnings>\</div>] if %prm<warnings> }
        </div>
        FOOTER
    },
}, :source<Browser editor>);
$rdp-online.add-templates( {
    footer => -> %prm, $tmpl {
        qq:to/FOOTER/;
        \n<div class="footer">
            Online Bulma HTML Modified {(sprintf( "at %02d:%02d UTC on %s", .hour, .minute, .yyyy-mm-dd) with now.DateTime)}</span>
        { qq[<div class="warnings">%prm<warnings>\</div>] if %prm<warnings> }
        </div>
        FOOTER
    },
}, :source<Browser editor>);
my $host = '0.0.0.0'; #= default host
my $port = 3000; #= default port, with defaults set browser to localhost:3000
my $publication = 'samples/';
my $landing = 'web-browser-editor.html';
my $app = route {
    get -> *@path {
        static "assets", @path, :indexes($landing,);
    }
    get -> 'browser-socket' {
        web-socket :json, -> $incoming {
            supply whenever $incoming -> $message {
                my $json = await $message.body;
                if $json<source>:exists {
                    my $ast;
                    my $try-online;
                    my $html;
                    my Bool $renderState = False;
                    if $json<source> {
                        try { $ast = $json<source>.AST }
                        if $! {
                            $html = q:to/TOP/ ~ $!.message ~ q:to/END/;
                            <html>
                            <head><title>Parsing error</title></head>
                            <body><p>The RakuDoc source has an error:</p>
                            <p>
                            TOP
                            </p>
                            </body>
                            </html>
                            END
                            $renderState = False;
                        }
                        elsif $ast.rakudoc {
                            $try-online = $json<online> // False;
                            $html = $try-online ?? $rdp-online.render($ast) !! $rdp.render($ast);
                            $renderState = True;
                        }
                        else {
                            $html = q:to/NORAK/;
                            <html>
                            <head><title>No RakuDoc source</title></head>
                            <body><p>Source has no RakuDoc content</p>
                            </body>
                            </html>
                            NORAK
                            $renderState = True;
                        }
                    }
                    else {
                        $html = q:to/EMPTY/;
                            <html>
                            <head><title>Source empty</title></head>
                            <body><p>No source content was sent</p>
                            </body>
                            </html>
                            EMPTY
                            $renderState = True;
                    }
                    emit({ :$html, :$renderState })
                }
                if $json<loaded> {
                    emit({ :connection<Confirmed> })
                }
                if $json<filename> {
                    my $fn = $publication ~ $json<filename>;
                    my $rakudoc = '';
                    my $error = '';
                    if $fn.IO ~~ :e & :f { $rakudoc = $fn.IO.slurp; }
                    else { $error = "File $fn not found"}
                    emit({ :$rakudoc, :$error })
                }
            }
        }
    }
}
my Cro::Service $http = Cro::HTTP::Server.new(
    http => <1.1>,
    :$host, :$port,
    application => $app,
    after => [
        Cro::HTTP::Log::File.new(logs => $*OUT, errors => $*ERR)
    ]
);
$http.start;
say "Listening at http://$host:$port";
react {
    whenever signal(SIGINT) {
        say "Shutting down";
        $http.stop;
        done;
    }
}