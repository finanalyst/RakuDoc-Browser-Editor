#! /usr/bin/env raku
use v6.d;
use Cro::HTTP::Router;
use Cro::HTTP::Server;
use Cro::HTTP::Log::File;
use Cro::HTTP::Router::WebSocket;
use RakuDoc::To::HTML;

'assets/sample.rakudoc'.IO.copy('publication/sample.rakudoc')
    unless 'publication/sample.rakudoc'.IO ~~ :e & :f ;

my RakuDoc::Processor $rdp = RakuDoc::To::HTML.new.rdp;
$rdp.add-templates( {
    footer => -> %prm, $tmpl {
        qq:to/FOOTER/;
        \n<div class="footer">
            Modified {(sprintf( "at %02d:%02d UTC on %s", .hour, .minute, .yyyy-mm-dd) with now.DateTime)}</span>
        { qq[<div class="warnings">%prm<warnings>\</div>] if %prm<warnings> }
        </div>
        FOOTER
    },
}, :source<Browser editor>);
my $host = 'localhost'; #= default host
my $port = 3000; #= default port, with defaults set browser to localhost:3000
my $publication = 'publication/';
my $landing = 'browser-editor.html';
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
                    my $error = '';
                    my $html;
                    try { $ast = $json<source>.AST }
                    $html = $rdp.render($ast);
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