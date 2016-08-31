var glob = require('glob');
var Path = require('path');
var _ = require('underscore');
var TemplateFile = require('./template-file');

function TemplateDirectory(directory, options) {
	if (!directory) {
		throw new Error('TemplateDirectory cannot be constructed without directory argument');
	}
	this.path = Path.normalize(directory);
	this.options = _.defaults(options || {}, {
		extension: 'html'
	});
	this.files = {};
	this.cache = {};
}

_.extend(TemplateDirectory.prototype, {
	scan: scan,
	load: load,
	purge: purge,
	save: save,
	removeDeprecated: removeDeprecated,
	normalize: normalize
});

function scan(cb) {

	var pattern = this.path + '/**/*.' + this.options.extension;

	glob(pattern, function (err, paths) {

		if (err) {

			cb(err);

		} else {

			_.each(paths, function (path) {
				var key = this.normalize(path);
				if (!this.files[key]) {
					this.files[key] = new TemplateFile(path);
				}
			}.bind(this));

			cb(null);
		}

	}.bind(this));

}

function purge(cb) {
	TemplateFile.checkAll(_.values(this.files), function (err, inaccessibleFiles) {
		_.each(inaccessibleFiles, function (inaccessibleFile) {
			var key = this.normalize(inaccessibleFile.path);
			delete this.files[key];
			delete this.cache[key];
		}.bind(this));
		cb(err);
	}.bind(this));
}

function load(cb) {

	this.scan(function (err) {
		if (err) {
			cb(err);
		} else {
			this.purge(function () {
				TemplateFile.loadAll(_.values(this.files), function (err) {
					if (err) {
						cb(err);
					} else {
						_.each(this.files, function (file, key) {
							this.cache[key] = file.content;
						}.bind(this));
						cb(null);
					}
				}.bind(this));
			}.bind(this));
		}
	}.bind(this));

}

function save(cb) {
	_.each(this.cache, function (content, key) {
		var path = this.path + '/' + key + '.' + this.options.extension;
		this.files[key] = new TemplateFile(path);
		this.files[key].content = this.cache[key];
	}.bind(this));
	TemplateFile.saveAll(_.values(this.files), function (err) {
		if (err) {
			cb(err);
		}
		else {
			this.removeDeprecated(cb);
		}
	}.bind(this));
}

function removeDeprecated(cb) {
	var deprecatedFiles = [];
	_.each(this.files, function (file, key) {
		if (!this.cache.hasOwnProperty(key)) {
			deprecatedFiles.push(file);
			delete this.files[key];
		}
	}.bind(this));
	TemplateFile.removeAll(deprecatedFiles, cb);
}

function normalize(path) {
	var norm = path.replace(this.path + '/', '').replace('.' + this.options.extension, '');
	return norm;
}

module.exports = TemplateDirectory;