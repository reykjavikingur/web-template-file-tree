var fs = require('fs');
var should = require('should');
var sinon = require('sinon');
require('should-sinon');
var TemplateFile = require('../lib/template-file');

describe('TemplateFile', function () {

	it('should be defined', function () {
		should(TemplateFile).be.a.Function();
	});

	it('should fail to instantiation without path', function () {
		should(function () {
			new TemplateFile();
		}).throw();
	});

	describe('instance for existing file', function () {

		var path, instance;

		beforeEach(function () {
			path = __dirname + '/files/example.html';
			instance = new TemplateFile(path);
		});

		it('should be defined', function () {
			should(instance).be.ok();
		});

		it('should fail to load when path does not exist', function (done) {
			instance.load(function (err) {
				should(err).be.ok();
				done();
			});
		});

		it('should have undefined content', function () {
			should(instance.content).be.undefined();
		});

		describe('when file exists', function () {

			beforeEach(function (done) {
				fs.writeFile(path, '', function (err) {
					should(err).not.be.ok();
					done();
				});
			});

			afterEach(function (done) {
				fs.unlink(path, function (err) {
					should(err).not.be.ok();
					done();
				});
			});

			describe('loading', function () {

				var error;

				beforeEach(function (done) {
					instance.load(function (err) {
						error = err;
						done();
					});
				});

				it('should callback without error', function () {
					should(error).not.be.ok();
				});

				it('should have content', function () {
					should(instance.content).not.be.undefined();
				});

				it('should have correct content', function () {
					should(instance.content).eql('');
				});

			});

			describe('caching', function () {

				beforeEach(function () {
					sinon.spy(fs, 'readFile');
				});

				afterEach(function () {
					fs.readFile.restore();
				});

				it('should read file on first load', function (done) {
					instance.load(function (err) {
						should(fs.readFile).be.calledOnce();
						done();
					});
				});

				it('should not read file on second load', function (done) {
					instance.load(function (err) {
						should(err).not.be.ok();
						instance.load(function (err) {
							should(err).not.be.ok();
							should(fs.readFile).be.calledOnce();
							done();
						});
					});
				});

			});

			describe('reloading', function () {

				beforeEach(function (done) {
					fs.writeFile(path, 'a', function (err) {
						should(err).not.be.ok();
						instance.load(function (err) {
							should(err).not.be.ok();
							setTimeout(done, 100);
						});
					});
				});

				it('should have correct content', function () {
					should(instance.content).eql('a');
				});

				describe('after file modification', function () {

					beforeEach(function (done) {
						setTimeout(done, 1000);
					});

					beforeEach(function (done) {
						fs.writeFile(path, 'b', function (err) {
							should(err).not.be.ok();
							instance.load(function (err) {
								should(err).not.be.ok();
								setTimeout(done, 100);
							});
						});
					});

					it('should have latest content', function () {
						should(instance.content).eql('b');
					});

				});

			});

		});

	});

	describe('instance for non-existent file', function () {

		var path, instance;

		beforeEach(function () {
			path = __dirname + '/../.tmp/foo.html';
			instance = new TemplateFile(path);
		});

		it('(SANITY) should not have created file at path yet', function (done) {
			fs.stat(path, function (err, stat) {
				should(err).be.ok();
				done();
			});
		});

		describe('save', function () {

			var error, content;

			beforeEach(function (done) {
				content = 'oyo';
				instance.content = content;
				instance.save(function (err) {
					error = err;
					done();
				});
			});

			afterEach(function (done) {
				fs.unlink(path, function (err) {
					if (err) {
						done(err);
					}
					else {
						done();
					}
				});
			});

			it('should not have error', function () {
				should(error).not.be.ok();
			});

			it('should have created file', function () {
				fs.stat(path, function (err, stat) {
					should(err).not.be.ok();
				});
			});

			it('should have correct content', function () {
				fs.readFile(path, 'utf8', function (err, data) {
					should(err).not.be.ok();
					should(data).equal(content);
				});
			});

		});

	});

});