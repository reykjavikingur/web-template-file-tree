var fs = require('fs');
var should = require('should');
var _ = require('underscore');
var del = require('del');
var TemplateDirectory = require('../lib/template-directory');


describe('TemplateDirectory', function () {

	it('should be defined', function () {
		should(TemplateDirectory).be.ok();
	});

	it('should fail to instantiate without directory', function () {
		should(function () {
			new TemplateDirectory();
		}).throw();
	});

	describe('instance for non-existent directory', function () {
		var path, instance;

		beforeEach(function () {
			path = __dirname + '/doesnotexist';
			instance = new TemplateDirectory(path);
		});

		it('(SANITY) should not have created directory', function (done) {
			fs.stat(path, function (err, stats) {
				should(err).be.ok();
				done();
			});
		});

		describe('load', function () {
			var error;
			beforeEach(function (done) {
				instance.load(function (err) {
					error = err;
					done();
				})
			});

			it('should not set error', function () {
				should(error).not.be.ok();
			});
			it('should have empty cache', function () {
				should(instance.cache).eql({});
			});
		});

	});

	describe('instance for populated directory', function () {

		var path, instance;

		beforeEach(function () {
			path = __dirname + '/views';
			instance = new TemplateDirectory(path);
		});

		it('should work', function () {
			should(instance).be.ok();
		});

		describe('normalize', function () {

			it('should fix base level file path', function () {
				var filePath = __dirname + '/views/index.html';
				should(instance.normalize(filePath)).eql('index');
			});

			it('should fix file path in subdirectory', function () {
				var filePath = __dirname + '/views/sub/other.html';
				should(instance.normalize(filePath)).eql('sub/other');
			});

		});

		describe('loading', function () {

			var loadError;

			beforeEach(function (done) {
				instance.load(function (err) {
					loadError = err;
					done();
				});
			});

			it('should not return error', function () {
				should(loadError).not.be.ok();
			});

			it('should have cache', function () {
				should(instance.cache).be.ok();
			});

			it('should put three items in cache', function () {
				var keys = Object.keys(instance.cache);
				should(keys.length).eql(3);
			});

			it('should have correct keys in cache', function () {
				var keys = Object.keys(instance.cache);
				var expectedKeys = ['index', 'faq', 'sub/widget'];
				_.each(expectedKeys, function (expectedKey) {
					should(keys).containEql(expectedKey);
				});
			});

			it('should have correct value for index', function () {
				should(instance.cache['index']).eql('home\n');
			});

			it('should have correct value for faq', function () {
				should(instance.cache['faq']).eql('questions answered');
			});

			it('should have correct value for sub/widget', function () {
				should(instance.cache['sub/widget']).eql('[ things ]');
			});

		});

	});

	describe('watching for new files', function () {

		var path, instance;

		beforeEach(function (done) {
			path = __dirname + '/views';
			instance = new TemplateDirectory(path);
			instance.load(function (err) {
				should(err).not.be.ok();
				setTimeout(done, 100);
			});
		});

		it('should have found n files', function () {
			should(Object.keys(instance.cache).length).eql(3);
		});

		describe('creating', function () {

			beforeEach(function (done) {
				fs.writeFile(path + '/rogue.html', 'blah', function (err) {
					should(err).not.be.ok();
					instance.load(function (err) {
						should(err).not.be.ok();
						done();
					})
				});
			});

			afterEach(function (done) {
				fs.unlink(path + '/rogue.html', function (err) {
					should(err).not.be.ok();
					done();
				});
			});

			it('should have found n+1 files', function () {
				should(Object.keys(instance.cache).length).eql(4);
			});

			it('should have correct content for extra file', function () {
				should(instance.cache['rogue']).eql('blah');
			});

			describe('removing', function () {

				beforeEach(function (done) {
					fs.unlink(path + '/rogue.html', function (err) {
						should(err).not.be.ok();
						setTimeout(done, 31);
					});
				});

				afterEach(function (done) {
					fs.writeFile(path + '/rogue.html', '', function (err) {
						should(err).not.be.ok();
						done();
					});
				});

				describe('loading again', function () {

					var loadError;

					beforeEach(function (done) {
						instance.load(function (err) {
							loadError = err;
							done();
						});
					});

					it('should not pass error', function () {
						should(loadError).not.be.ok();
					});

					it('should not have removed file', function () {
						should(instance.cache).not.have.ownProperty('rogue');
					});

				});

				describe('purging', function () {

					beforeEach(function (done) {
						instance.purge(function (err) {
							should(err).not.be.ok();
							done();
						});
					});

					it('should have reduced cache', function () {
						should(Object.keys(instance.cache).length).eql(3);
					});

					it('should have removed purged file', function () {
						should(instance.cache).not.have.ownProperty('rogue');
					});

				});

			});

		});

	});

	describe('watching for file changes', function () {

		var path, instance;

		beforeEach(function (done) {
			path = __dirname + '/views';
			instance = new TemplateDirectory(path);
			fs.writeFile(path + '/temp.html', 'foo', function (err) {
				should(err).not.be.ok();
				setTimeout(done, 31);
			});
		});

		afterEach(function (done) {
			fs.unlink(path + '/temp.html', function (err) {
				should(err).not.be.ok();
				done();
			});
		});

		describe('loading', function () {

			beforeEach(function (done) {
				instance.load(function (err) {
					should(err).not.be.ok();
					done();
				});
			});

			it('should find all files', function () {
				should(Object.keys(instance.cache).length).eql(4);
			});

			it('should find new file', function () {
				should(instance.cache['temp']).be.ok();
			});

			it('should get correct content', function () {
				should(instance.cache['temp']).eql('foo');
			});

			describe('reloading', function () {

				beforeEach(function (done) {
					setTimeout(done, 1200);
				});

				it('should update new file content', function (done) {
					fs.writeFile(path + '/temp.html', 'bar', function (err) {
						should(err).not.be.ok();
						setTimeout(function () {
							instance.load(function (err) {
								should(err).not.be.ok();
								should(instance.cache['temp']).eql('bar');
								done();
							})
						}, 31);
					});
				});

			});

		});

	});

	describe('instance for new directory', function () {

		var path, instance;

		beforeEach(function () {
			path = __dirname + '/../.tmp/site';
			instance = new TemplateDirectory(path);
		});

		afterEach(function (done) {
			del(path)
				.then(function (r) {
					done();
				}, function (e) {
					done(e);
				});
		});

		it('(SANITY) should not have created directory yet', function (done) {
			fs.stat(path, function (err, stats) {
				should(err).be.ok();
				done();
			});
		});

		describe('save with no cache entry', function () {
			var error;
			beforeEach(function (done) {
				instance.save(function (err) {
					error = err;
					done();
				});
			});
			it('should not set error', function () {
				should(error).not.be.ok();
			});
		});

		describe('save with one cache entry', function () {

			var error;

			beforeEach(function (done) {
				instance.cache['page'] = 'Welcome2 .it';
				instance.save(function (err) {
					error = err;
					done();
				});
			});

			it('should not set error', function () {
				should(error).not.be.ok();
			});

			it('should create file', function (done) {
				fs.stat(path + '/page.html', function (err, stats) {
					should(err).not.be.ok();
					should(stats).be.ok();
					done();
				});
			});

			it('should write correct contents to file', function (done) {
				fs.readFile(path + '/page.html', 'utf8', function (err, data) {
					should(err).not.be.ok();
					should(data).equal('Welcome2 .it');
					done();
				});
			});

			describe('resave with modifications', function () {

				var content2;

				beforeEach(function (done) {
					content2 = 'Modded greetings!';
					instance.cache['page'] = content2;
					instance.save(function (err) {
						if (err) {
							done(err);
						}
						else {
							done();
						}
					});
				});

				it('should update file', function (done) {
					fs.readFile(path + '/page.html', 'utf8', function (err, data) {
						should(err).not.be.ok();
						should(data).equal(content2);
						done();
					});
				});

			});

			describe('resave with addition', function () {

				beforeEach(function (done) {
					instance.cache['other'] = 'Newxyz';
					instance.save(function (err) {
						if (err) {
							done(err);
						}
						else {
							done();
						}
					});
				});

				it('should create new file with correct content', function (done) {
					fs.readFile(path + '/other.html', 'utf8', function (err, data) {
						should(err).not.be.ok();
						should(data).equal('Newxyz');
						done();
					});
				});

				it('should keep content in existing file', function (done) {
					fs.readFile(path + '/page.html', 'utf8', function (err, data) {
						should(err).not.be.ok();
						should(data).equal('Welcome2 .it');
						done();
					});
				});

			});

		});

		describe('save with two cache entries at different levels', function () {

			beforeEach(function (done) {
				instance.cache['index'] = 'This is a test page. (c)2xxx';
				instance.cache['comps/cta'] = 'Press here';
				instance.save(function (err) {
					if (err) {
						done(err);
					}
					else {
						done();
					}
				});
			});

			it('should create first file', function (done) {
				fs.stat(path + '/index.html', function (err, stats) {
					should(err).not.be.ok();
					should(stats).be.ok();
					done();
				});
			});

			it('should create second file', function (done) {
				fs.stat(path + '/comps/cta.html', function (err, stats) {
					should(err).not.be.ok();
					should(stats).be.ok();
					done();
				});
			});

			it('should write correct content to first file', function (done) {
				fs.readFile(path + '/index.html', 'utf8', function (err, data) {
					should(data).equal('This is a test page. (c)2xxx');
					done();
				});
			});

			it('should write correct content to second file', function (done) {
				fs.readFile(path + '/comps/cta.html', 'utf8', function (err, data) {
					should(data).equal('Press here');
					done();
				});
			});

			describe('resave with removal', function () {

				beforeEach(function (done) {
					delete instance.cache['comps/cta'];
					instance.save(function (err) {
						err ? done(err) : done();
					});
				});

				it('should preserve existing file', function (done) {
					fs.readFile(path + '/index.html', 'utf8', function (err, data) {
						should(data).equal('This is a test page. (c)2xxx');
						done();
					});
				});

				it('should delete file', function (done) {
					fs.stat(path + '/comps/cta.html', function (err, stats) {
						should(err).be.ok();
						done();
					});
				});

			});

		});

	});

});