var http        = require( 'http' );
var config      = require( './config' );
var webshot     = require( 'webshot' );
var fs          = require( 'fs' );
var gm          = require( 'gm' );
var imageMagick = gm.subClass( { imageMagick: true } );

var server = http.createServer( function ( req, res ) {
  // filter out favicon request
  if ( /url/.test( req.url ) ) {
    var url  = req.url.match( /\/+\?+url=(.*)/ )[ 1 ];
    var file = config.picturePath + '/' + url.replace( /(http:\/\/)/, '' ) + '.png';

    console.log( url );
    webshot(
      url,
      file,
      {
        screenSize :{
          width  : 1000,
          height : 750
        }
      },
      function( err ) {
        if ( err ) {
          console.log( 'ERRRRORRR:' );
          console.log( err );
          res.send( 500 );

          return;
        }

        console.log( 'START RESIZING IMAGE' );
        imageMagick( file )
          .resize( config.image.width, config.image.height )
          .autoOrient()
          .write( file, function ( err ) {
            if ( !err ) {
              console.log(' hooray! ');
              var img = fs.readFileSync( file );

              res.writeHead( 200, {'Content-Type': 'image/gif' } );
              res.end( img, 'binary' );
            } else {
              console.log( err );
            }
          } );
      }
    );
  }
} );


server.listen( config.port );
console.log( 'Server running at http://127.0.0.1:' + config.port);
