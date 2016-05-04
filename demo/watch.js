var fs = require('fs');

var FileTree = require('../');

var path = __dirname + '/views';

var fileTree = new FileTree(path);

console.log('watching');
var pending = false;
setInterval(function(){
	if (!pending) {
		pending = true;
		console.log('loading');
		fileTree.load(function(err) {
			fs.writeFile(__dirname + '/cache.json', JSON.stringify(fileTree.cache), function(err) {
				pending = false;
				console.log('updated');
			});
		});
	}
}, 1000);