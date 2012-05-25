var http = require('http');
var spawn = require('child_process').spawn;
var config = require('./config');
var s3 = require('knox').createClient(config.s3);
var StreamCache = require('stream-cache');
var port = process.env.PORT || 8080;

var caches = {};
http.createServer(function(req, res) {
  if (caches[req.url]) {
    caches[req.url].pipe(res);
    return;
  }

  var parts = req.url.split('/');

  s3.get('/' + parts[1]).on('response', function(s3Res) {
    var args = ['-', '-resize', parts[2], '-'];
    var convert = spawn('convert', args);

    s3Res.pipe(convert.stdin);

    convert.stdout.pipe(res);
    convert.stderr.pipe(process.stderr);

    var cache = new StreamCache();
    convert.stdout.pipe(cache);
    caches[req.url] = cache;
  }).end();
}).listen(port);

console.log('Listening on port', port);
