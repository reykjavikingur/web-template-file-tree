var fs = require('fs');
var _ = require('underscore');

function TemplateFile(path) {
	if (!path) {
		throw new Error('TemplateFile constructor missing required path argument');
	}
	this.path = path;
}

_.extend(TemplateFile.prototype, {
	load: load,
	readFile: readFile
});

function load(cb) {
	fs.stat(this.path, function(err, stats) {
		if (err) {
			cb(err);
		} else {
			if (!this.mtime || stats.mtime.getTime() > this.mtime.getTime()) {
				// time to load or reload
				this.mtime = stats.mtime;
				this.readFile(cb);
			} else {
				// content is up to date
				cb(null);
			}
		}
	}.bind(this));
}

function readFile(cb) {
	fs.readFile(this.path, {
		encoding: 'utf8'
	}, function(err, data) {
		if (err) {
			cb(err);
		} else {
			this.content = data;
			cb(null);
		}
	}.bind(this));
}

module.exports = TemplateFile;