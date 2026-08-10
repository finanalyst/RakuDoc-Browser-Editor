use v6.d;
use JSON::Fast;
my %options = 'samples'.IO.dir(test => / '.rakudoc' $ /)
        .map({ .extension('').IO.basename.substr(3).tc.subst(/ '_' /, ' ', :g) => .basename });
my %abouts =
        'credits' =>
            '<p>Editor based on <a href="https://ace.c9.io/">ACE</a></p>' ~
            '<p>Author: Richard Hainsworth, aka finanalyst</p>'
        ,
        'based-on' => do {
            my $proc = run <RenderDocs -v>,:in,:out,:err ;
            my $raku = run <<$*EXECUTABLE -v>>,:in,:out,:err;
            $raku = $raku.out.slurp(:close).subst(/ 'Welcome to '/,'');
            qq[<p>{ $proc.out.slurp(:close) }\</p>
                <p>$raku\</p>]
        },
        'made-on' =>
            qq[<p>Docker image made  {(sprintf( "at %02d:%02d UTC on %s", .hour, .minute, .yyyy-mm-dd) with now.DateTime)}\</p>]
        ,
        'source' =>
            q[<p>Open source content at <a href="https://github.com/finanalyst/RakuDoc-Browser-Editor">GitHub/finanalyst</a></p>]
        ;

'assets/dynamics.js'.IO.spurt:
        'var selectionOptions=' ~ JSON::Fast::to-json(%options.sort(*.value)) ~
        ";\nvar dynamicData=" ~ JSON::Fast::to-json( %abouts );
