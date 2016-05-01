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
	normalize: normalize
});

function scan(cb) {

	var pattern = this.path + '/**/*.' + this.options.extension;

	glob(pattern, function(err, paths) {

		if (err) {

			cb(err);

		} else {

			_.each(paths, function(path) {
				var key = this.normalize(path);
				if (!this.files[key]) {
					this.files[key] = new TemplateFile(path);
				}
			}.bind(this));

			cb(null);
		}

	}.bind(this));

}

function load(cb) {

	this.scan(function(err) {
		if (err) {
			cb(err);
		} else {
			TemplateFile.loadAll(_.values(this.files), function(err) {
				if (err) {
					cb(err);
				} else {
					_.each(this.files, function(file, key) {
						this.cache[key] = file.content;
					}.bind(this));
					cb(null);
				}
			}.bind(this));
		}
	}.bind(this));

}

function normalize(path) {
	var norm = path.replace(this.path + '/', '').replace('.' + this.options.extension, '');
	return norm;
}

module.exports = TemplateDirectory;