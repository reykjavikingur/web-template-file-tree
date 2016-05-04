var fs = require('fs');
var _ = require('underscore');

function TemplateFile(path) {
	if (!path) {
		throw new Error('TemplateFile constructor missing required path argument');
	}
	this.path = path;
}

_.extend(TemplateFile, {
	loadAll: loadAll,
	checkAll: checkAll
});

function loadAll(files, cb) {
	var error, n = files.length;

	_.each(files, function(file) {
		file.load(function(err) {
			if (!error) {
				if (err) {
					error = err;
					cb(err);
				} else {
					n--;
					if (n === 0) {
						cb();
					}
				}
			}
		});
	});
}

function checkAll(files, cb) {
	var inaccessibleFiles = [],
		n = files.length;

	_.each(files, function(file) {
		fs.access(file.path, fs.R_OK, function(err) {
			if (err) {
				inaccessibleFiles.push(file);
			}
			n--;
			if (n === 0) {
				cb(null, inaccessibleFiles);
			}
		});
	});
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