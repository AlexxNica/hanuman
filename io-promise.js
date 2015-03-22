/*
 Copyright © 2015 World Wide Web Consortium, (Massachusetts Institute of Technology,
 European Research Consortium for Informatics and Mathematics, Keio University, Beihang).
 All Rights Reserved.

 This work is distributed under the W3C® Software License [1] in the hope that it will
 be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.

 [1] http://www.w3.org/Consortium/Legal/2002/copyright-software-20021231
*/

// library wrapping a few Node.js io operations around Promise

require('es6-promise').polyfill();

var io_promise = {};

function Response(options) {
  this.status = options.status;
  this.url    = options.url;
  this.data   = options.data;
  this.text = function () {
    return Promise.resolve(this.data);
  };
  this.json = function () {
    var p = this.text().then(JSON.parse);
    return p;
  };
}

io_promise.fetch = function (url) {
  var library = require((url.indexOf("https://") === 0)? "https" : "http");
  return new Promise(function (resolve, reject) {
    library.get(url, function(res) {
      var buffer = "";
      res.on('data', function (chunk) {
        buffer += chunk;
      });
      res.on('end', function () {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(new Response({ status: res.statusCode,
                                 url: res.url,
                                 data: buffer }));
        } else {
          reject(new Response({ status: res.statusCode,
                                url: res.url,
                                data: buffer }));
        }
      });
    }).on('error', function(err) {
      reject(err);
    });
  });
};

io_promise.read = function (filename, options) {
  var opts = options;
  if (options === undefined) {
    opts = {  encoding: "utf-8" };
  }
  return new Promise(function (resolve, reject) {
    require('fs').readFile(filename, opts, function(err, data) {
      if (err) {
        reject (err);
      } else {
        resolve(data);
      }
    });
  });
};

io_promise.save = function (filename, data, options) {
  var opts = options;
  if (options === undefined) {
    opts = { encoding: "utf-8" };
  }
  return new Promise(function (resolve, reject) {
    require('fs').writeFile(filename, data, opts, function(err) {
      if (err) {
        reject (err);
      } else {
        resolve(data);
      }
    });
  });
};

io_promise.readJSON = function (filename) {
  return io_promise.read(filename).then(JSON.parse);
};

io_promise.saveJSON = function (filename, obj) {
  return io_promise.save(filename, JSON.stringify(obj))
    .then( function(json) { return obj; } );
};

module.exports = io_promise;
