/*
 * Copyright 2014 IBM Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
 * service.js is Express middleware that provides an OSLC AM adapter for the IoT Platform.
 */

var express = require('express');

/*
 * Middleware to get IoT resouces and translate them to OSLC AM resources
 */
var iotRoutes = function(env) {
	var ldp = require('./vocab/ldp.js'); // LDP vocabulary
	var rdf = require('./vocab/rdf.js'); // RDF vocabulary
	var crypto = require('crypto'); // for MD5 (ETags)
	var oslcService = require('oslc-service'); // OSLC is built on LDP

	var subApp = express();

	// anything those services don't handle will be passed to this service next
	var resource = subApp.route(env.iotContext + '*');
	// route the request to the OSLC and then LDP services first
	subApp.use(oslcService(env));

	// route any requests matching the LDP context (defaults to /r/*)
	resource.all(function(req, res, next) {
		// all responses should have Link: <ldp:Resource> rel=type
		var links = {
		};
		// also include implementation constraints
		res.links(links);
		next();
	});

	resource.options(function(req, res, next) {
		console.log('IoT OPTIONS request on:'+req.path);
	});

	resource.head(function(req, res, next) {
		console.log('IoT HEAD request on:'+req.path);
	});

	resource.post(function(req, res, next) {
		console.log('IoT POST request on:'+req.path);
	});

	resource.get(function(req, res, next) {
		console.log('IoT GET request on:'+req.path);
		res.end('*** Getting an iot resource ***');
	});

	resource.put(function(req, res, next) {
		console.log('IoT PUT request on:'+req.path);
	});

	resource.delete(function(req, res, next) {
		console.log('IoT DELETE request on:'+req.path);
	});


	// generate an ETag for a response using an MD5 hash
	// note: insert any calculated triples before calling getETag()
	function getETag(content) {
		return 'W/"' + crypto.createHash('md5').update(content).digest('hex') + '"';
	}

	// add common headers to all responses
	function addHeaders(res, document) {
		var allow = 'GET,HEAD,DELETE,OPTIONS';
		if (isContainer(document)) {
			res.links({
				type: document.interactionModel
			});
			allow += ',POST';
			res.set('Accept-Post', media.turtle + ',' + media.jsonld + ',' + media.json);
		} else {
			allow += ',PUT';
		}

		res.set('Allow', allow);
	}

	// append 'path' to the end of a uri
	// - any query or hash in the uri is removed
	// - any special characters like / and ? in 'path' are replaced
	function addPath(uri, path) {
		uri = uri.split("?")[0].split("#")[0];
		if (uri.substr(-1) !== '/') {
			uri += '/';
		}

		// remove special characters from the string (e.g., '/', '..', '?')
		var lastSegment = path.replace(/[^\w\s\-_]/gi, '');
		return uri + encodeURIComponent(lastSegment);
	}
	return subApp;
}

module.exports = function(env) {
	return iotRoutes(env);
}
