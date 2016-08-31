# Web Template File Tree

This is a utility that reads files from a directory and maintains a cache
of file contents keyed off of relative file paths.
It also keeps track of modification dates so that content can be reloaded
when necessary.

## Example

### Files

- views/index.html
- views/widget.html
- views/comp/cta.html

### Script

```
var FileTree = require('web-template-file-tree');
var fileTree = new FileTree(__dirname + '/views');
fileTree.load(function(err) {
	if (err) {
		console.error('unable to load templates:', err);
	}
})
```

### Results

* `fileTree.cache['index']` is the contents of the file `views/index.html`
* `fileTree.cache['widget']` is the contents of the file `views/widget.html`
* `fileTree.cache['comp/cta']` is the contents of the file `views/comp/cta.html`

Subsequent calls to `fileTree.load()` will update `fileTree.cache`.

## Documentation

### Constructor

#### `FileTree(directoryPath, options)`

* `directoryPath` {String} the path to the directory containing template files
* `options` {Object}
	* `extension` {String} (default 'html') the file extension to look for and exclude from cache keys

Instantiates file tree and initializes `cache` to empty Object.

### Instance Methods

#### `load(callback)`

* `callback` {Function} the callback, taking one `error` argument

Asynchronously updates `cache` property with keys corresponding to relative file paths (without extensions)
and values to file contents.

Passes `error` argument to callback if unsuccessful.

For efficiency, it uses last modification timestamp to decide whether to re-read file contents into `cache`.

#### `save(callback)`

* `callback` {Function} the callback, taking one `error` argument

Asynchronously writes `cache` to directory,
creating files with relative paths corresponding to keys
(without extensions) and file contents corresponding to values.

Passes `error` argument to callback if unsuccessful.

--