#! /usr/bin/env raku
use v6.d;
use Cro::HTTP::Router;
use Cro::HTTP::Server;
use Cro::HTTP::Log::File;
use Cro::HTTP::Router::WebSocket;
use RakuDoc::To::HTML;
use RakuDoc::To::HTML-Extra;

for <sample rakudociem-ipsum ext-rakudociem-ipsum> {
    "assets/$_.rakudoc".IO.copy("publication/$_.rakudoc")
        unless "publication/$_.rakudoc".IO ~~ :e & :f;
}
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
my $publication = 'publication/';
my $landing = 'web-browser-editor.html';
my $app = route {
    get -> *@path {
        static "assets", @path, :indexes($landing,);
    }
    get -> 'browser-socket' {
        web-socket :json, -> $incoming {
            supply whenever $incoming -> $message {
                my $json = await $message.body;
                if $json<source> {
                    my $ast;
                    my $try-online;
                    my $error = '';
                    my $html;
                    try { $ast = $json<source>.AST }
                    try { $try-online = $json<online> }
                    $html = $try-online ?? $rdp-online.render($ast) !! $rdp.render($ast);
                    CATCH {
                        default {
                            $error = .message;
                            $html = '';
                        }
                    }
                    emit({ :$html, :$error })
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
                if $json<save>  {
                    my $fn = $publication ~ $json<save>;
                    $fn.IO.spurt( $json<save-source> )
                        if $json<save-source>:exists;
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
say "Serving $landing on $host\:$port";
$http.start;
react {
    whenever signal(SIGINT) {
        say "Shutting down...";
        $http.stop;
        done;
    }
}