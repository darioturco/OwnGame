function loadJSON(url, callback){
  var path = url;
  var errorCallback;
  var options;
  var ret = {}; // object needed for preload
  var t = 'json';
  httpDo(path, 'GET', options, t, function(resp) {
    for (var k in resp) {
      ret[k] = resp[k];
    }
    if (typeof callback != 'undefined') {
      callback(resp);
    }
  }, errorCallback);
  return ret;
}

function httpDo(){
  var type;
  var callback;
  var errorCallback;
  var request;
  var jsonpOptions = {};
  var cbCount = 0;
  var contentType = 'text/plain';
  // Trim the callbacks off the end to get an idea of how many arguments are passed
  for (var i = arguments.length - 1; i > 0; i--) {
    if (typeof arguments[i] === 'function') {
      cbCount++;
    } else {
      break;
    }
  }
  // The number of arguments minus callbacks
  var argsCount = arguments.length - cbCount;
  var path = arguments[0];
  if (
    argsCount === 2 &&
    typeof path === 'string' &&
    typeof arguments[1] === 'object'
  ) {
    // Intended for more advanced use, pass in Request parameters directly
    request = new Request(path, arguments[1]);
    callback = arguments[2];
    errorCallback = arguments[3];
  } else {
    // Provided with arguments
    var method = 'GET';
    var data;

    for (var j = 1; j < arguments.length; j++) {
      var a = arguments[j];
      if (typeof a === 'string') {
        if (a === 'GET' || a === 'POST' || a === 'PUT' || a === 'DELETE') {
          method = a;
        } else if (
          a === 'json' ||
          a === 'jsonp' ||
          a === 'binary' ||
          a === 'arrayBuffer' ||
          a === 'xml' ||
          a === 'text'
        ) {
          type = a;
        } else {
          data = a;
        }
      } else if (typeof a === 'number') {
        data = a.toString();
      } else if (typeof a === 'object') {
        if (a.hasOwnProperty('jsonpCallback')) {
          for (var attr in a) {
            jsonpOptions[attr] = a[attr];
          }
        } else {
          data = JSON.stringify(a);
          contentType = 'application/json';
        }
      } else if (typeof a === 'function') {
        if (!callback) {
          callback = a;
        } else {
          errorCallback = a;
        }
      }
    }

    request = new Request(path, {
      method: method,
      mode: 'cors',
      body: data,
      headers: new Headers({
        'Content-Type': contentType
      })
    });
  }

  // do some sort of smart type checking
  if (!type) {
    if (path.indexOf('json') !== -1) {
      type = 'json';
    } else if (path.indexOf('xml') !== -1) {
      type = 'xml';
    } else {
      type = 'text';
    }
  }

  var promise;
  if (type === 'jsonp') {
    promise = fetchJsonp(path, jsonpOptions);
  } else {
    promise = fetch(request);
  }
  promise = promise.then(function(res) {
    if (!res.ok) {
      var err = new Error(res.body);
      err.status = res.status;
      err.ok = false;
      throw err;
    }

    switch (type) {
      case 'json':
      case 'jsonp':
        return res.json();
      case 'binary':
        return res.blob();
      case 'arrayBuffer':
        return res.arrayBuffer();
      case 'xml':
        return res.text().then(function(text) {
          var parser = new DOMParser();
          var xml = parser.parseFromString(text, 'text/xml');
          return parseXML(xml.documentElement);
        });
      default:
        return res.text();
    }
  });
  promise.then(callback || function() {});
  promise.catch(errorCallback || console.error);
  return promise;
};
