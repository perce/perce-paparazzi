var http        = require( 'http' );
var config      = require( './config' );
var webshot     = require( 'webshot' );
var fs          = require( 'fs' );
var gm          = require( 'gm' );
var imageMagick = gm.subClass( { imageMagick: true } );
var argv        = require( 'optimist' ).argv;

// configurable options
var picturePath = argv.picturePath || config.picturePath;
var port        = argv.port || config.port;

// create server instance
var server = http.createServer( function ( req, res ) {
  var match = req.url.match( /\/width\/(\d+?)\/height\/(\d+?)\/url\/(.+?)(\?scale=(\d+)){0,1}$/ );

  if ( match !== null ) {
    var options = {
      width  : match[ 1 ],
      height : match[ 2 ],
      url    : match[ 3 ],
      scale  : match[ 5 ] || 100
    };

    serveImage( options, res );

  } else {
    serveWebsite( res );
  }
} );


/**
 * General function to kick off image serving
 * either generate images and serve it
 * or serve already generated images
 *
 * @param  {Object} options options
 * @param  {Object} res     response object
 */
function serveImage( options, res ) {
  options.filePath = picturePath + '/' +
                      options.width + '/' +
                      options.height + '/' +
                      options.scale + '/' +
                      options.url.replace( '/', '_' ) + '.png';

  fs.exists( options.filePath , function( exists ) {
    if ( exists ) {
      var img = fs.readFileSync( options.filePath );

      console.log( 'CACHED SERVING:' + options.filePath );
      res.writeHead( 200, {'Content-Type': 'image/png' } );
      res.end( img, 'binary' );
    } else {
      createImage( options, res );
    }
  } );
}


/**
 * Take picture with phantomjs
 *
 * @param  {Object} options options
 * @param  {Object} res     response object
 */
function createImage( options, res ) {
  console.log( 'http://' + options.url );
  webshot(
    options.url,
    options.filePath,
    {
      screenSize :{
        width  : options.width,
        height : options.height
      }
    },
    function( err ) {
      if ( err ) {
        console.log( 'ERROR IN WEBSHOT:' );
        console.log( err );
        res.statusCode = 500;
        res.end();

        return;
      }

      resizeImage( options, res );
    }
  );
}


/**
 * Resize image with desired dimension
 *
 * @param  {Object} options options
 * @param  {Object} res     response object
 */
function resizeImage( options, res ) {
  imageMagick( options.filePath )
    .resize(
      options.width * options.scale / 100 ,
      options.height * options.scale / 100
    )
    .autoOrient()
    .write( options.filePath, function ( err ) {
      if ( !err ) {
        var img = fs.readFileSync( options.filePath );

        console.log( 'GENERATED SERVING:' + options.filePath );
        res.writeHead( 200, {'Content-Type': 'image/png' } );
        res.end( img, 'binary' );
      } else {
        console.log( 'ERROR IN IMAGEMAGICK' );
        console.log( err );
      }
    } );
}


/**
 * Serve website
 * @param  {Object} res response object
 */
function serveWebsite( res ) {
  fs.readFile( './index.html', 'utf8', function( err, file ) {
    if ( err ) {
      console.log( err );
      res.statusCode = 500;
      res.end();
    } else {
      res.writeHead( 200, { 'Content-Type' : 'text/html; charset=utf-8' } );
      res.end( file, 'binary' );
    }
  } );
}


// let's kick things off
server.listen( port, function () {
  console.log( 'Server running at http://127.0.0.1:', port );
} );

