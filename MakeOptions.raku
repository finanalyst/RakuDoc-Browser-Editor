use v6.d;
use JSON::Fast;
my %options = 'samples'.IO.dir(test => / '.rakudoc' $ / )
    .map({ .extension('').IO.basename.substr(3).tc.subst(/ '_' /,' ', :g) => .basename }) ;
'assets/selection-options.js'.IO.spurt: 'var selectionOptions=' ~ JSON::Fast::to-json(%options.sort( *.value ));
