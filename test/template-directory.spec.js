var should = require('should');
var _ = require('underscore');
var TemplateDirectory = require('../lib/template-directory');


describe('TemplateDirectory', function() {

	it('should be defined', function() {
		should(TemplateDirectory).be.ok();
	});

	it('should fail to instantiate without directory', function() {
		should(function() {
			new TemplateDirectory();
		}).throw();
	});

	describe('instantiation', function() {

		var path, instance;

		beforeEach(function() {
			path = __dirname + '/views';
			instance = new TemplateDirectory(path);
		});

		it('should work', function() {
			should(instance).be.ok();
		});

		describe('normalize', function() {

			it('should fix base level file path', function() {
				var filePath = __dirname + '/views/index.html';
				should(instance.normalize(filePath)).eql('index');
			});

			it('should fix file path in subdirectory', function() {
				var filePath = __dirname + '/views/sub/other.html';
				should(instance.normalize(filePath)).eql('sub/other');
			});

		});

		describe('loading', function() {

			var loadError;

			beforeEach(function(done) {
				instance.load(function(err) {
					loadError = err;
					done();
				});
			});

			it('should not return error', function() {
				should(loadError).not.be.ok();
			});

			it('should have cache', function() {
				should(instance.cache).be.ok();
			});

			it('should put three items in cache', function() {
				var keys = Object.keys(instance.cache);
				should(keys.length).eql(3);
			});

			it('should have correct keys in cache', function() {
				var keys = Object.keys(instance.cache);
				var expectedKeys = ['index', 'faq', 'sub/widget'];
				_.each(expectedKeys, function(expectedKey) {
					should(keys).containEql(expectedKey);
				});
			});

			it('should have correct value for index', function() {
				should(instance.cache['index']).eql('home\n');
			});

			it('should have correct value for faq', function() {
				should(instance.cache['faq']).eql('questions answered');
			});

			it('should have correct value for sub/widget', function() {
				should(instance.cache['sub/widget']).eql('[ things ]');
			});

		});

	});

});