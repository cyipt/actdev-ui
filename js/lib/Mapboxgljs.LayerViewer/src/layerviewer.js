// Layer viewer library code

/*jslint browser: true, white: true, single: true, for: true */
/*global $, jQuery, mapboxgl, MapboxDraw, geojsonExtent, autocomplete, Cookies, vex, GeoJSON, FULLTILT, alert, console, window */

var layerviewer = (function ($) {
	
	'use strict';
	
	// Settings defaults
	var _settings = {
		
		// API
		apiBaseUrl: 'API_BASE_URL',
		apiKey: 'YOUR_API_KEY',
		
		// Mapbox API key
		mapboxApiKey: 'YOUR_MAPBOX_API_KEY',
		
		// Initial lat/lon/zoom of map and tile layer
		defaultLocation: {
			latitude: 54.661,
			longitude: 1.263,
			zoom: 6
		},
		maxBounds: null,	// Or [W,S,E,N]
		defaultTileLayer: 'mapnik',
		maxZoom: 20,
		
		// Application baseUrl
		baseUrl: '/',
		
		// Default layers ticked
		defaultLayers: [],
		
		// Geocoder API URL; re-use of settings values represented as placeholders {%apiBaseUrl}, {%apiKey}, {%autocompleteBbox}, are supported
		geocoderApiUrl: '{%apiBaseUrl}/v2/geocoder?key={%apiKey}&bounded=1&bbox={%autocompleteBbox}',
		
		// BBOX for autocomplete results biasing
		autocompleteBbox: '-6.6577,49.9370,1.7797,57.6924',
		
		// Feedback API URL; re-use of settings values represented as placeholders {%apiBaseUrl}, {%apiKey}, are supported
		feedbackApiUrl: '{%apiBaseUrl}/v2/feedback.add?key={%apiKey}',

		poisApiUrl: '{%apiBaseUrl}/v2/pois.types?icons=32?key={%apiKey}',
		
		// Enable/disable 3D terrain (Mapbox GL JS v.2.0.0+)
		enable3dTerrain: false,
		
		// Enable/disable drawing feature
		enableDrawing: true,
		
		// Map scale
		enableScale: false,
		
		// First-run welcome message
		firstRunMessageHtml: false,
		
		// Google API key for Street View images
		gmapApiKey: 'YOUR_API_KEY',
		
		// Sending zoom as default for all layers
		sendZoom: false,
		
		// Explicit styling as default for all layers
		style: {},
		
		// Enable hover for all (line-based) layers
		hover: true,

		// Use existing geolocation button instead of Mapbox's
		geolocationElementId: false,

		// Display a dot that tracks user location (usual design language on mobile)
		trackUser: true,
		
		// Default icon and size
		iconUrl: null,
		iconSize: null,
		
		// Tileserver URLs, each as [path, options, label]
		tileUrls: {
			opencyclemap: {
				tiles: 'https://{s}.tile.cyclestreets.net/opencyclemap/{z}/{x}/{y}@2x.png',
				maxZoom: 22,
				attribution: 'Maps © <a href="https://www.thunderforest.com/">Thunderforest</a>, Data © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
				tileSize: 256,		// 512 also works but 256 gives better map detail
				label: 'OpenCycleMap',
				description: 'A cycling-orientated map, highlighting cycle infrastructure, hills, bike shops and more.'
			},
			mapboxstreets: {
				vectorTiles: 'mapbox://styles/mapbox/streets-v11',
				label: 'Streets',
				description: 'A general-purpose map that emphasizes legible styling of road and transit networks.'
			},
			night: {
				vectorTiles: 'mapbox://styles/mapbox/dark-v10',
				label: 'Night',
				description: 'A subtle, full-featured map designed to provide minimalist geographic context.'
			},
			satellite: {
				vectorTiles: 'mapbox://styles/mapbox/satellite-v9',
				label: 'Satellite',
				description: "A map that uses real satellite imagery to give you a bird's-eye view of your surroundings."
			},
			mapnik: {
				tiles: 'https://{s}.tile.cyclestreets.net/mapnik/{z}/{x}/{y}.png',
				maxZoom: 19,
				attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
				tileSize: 256,
				label: 'OpenStreetMap',
				description : 'The default OpenStreetMap style, emphasising road type and surrounding buildings.'
			},
			osoutdoor: {
				vectorTiles: 'https://s3-eu-west-1.amazonaws.com/tiles.os.uk/styles/open-zoomstack-outdoor/style.json',
				label: 'OS outdoor',
				description: 'Display footpaths, rights of way, open access land and the vegetation on the land.'
			},
			osopendata: {
				tiles: 'https://{s}.tile.cyclestreets.net/osopendata/{z}/{x}/{y}.png',
				maxZoom: 19,
				attribution: 'Contains Ordnance Survey data &copy; Crown copyright and database right 2010',
				tileSize: 256,
				label: 'OS Open Data',
				description: "The OS's most detailed, street-level mapping product available, using open data sources."
			},
			bartholomew: {
				tiles: 'https://{s}.tile.cyclestreets.net/bartholomew/{z}/{x}/{y}@2x.png',
				maxZoom: 15,
				attribution: '&copy; <a href="https://maps.nls.uk/copyright.html">National Library of Scotland</a>',
				tileSize: 256,
				label: 'Bartholomew',
				description: "John Bartholomew's distinctive 1897 map, using colour to represent landscape relief."
			},
			os6inch: {
				tiles: 'https://{s}.tile.cyclestreets.net/os6inch/{z}/{x}/{y}@2x.png',
				maxZoom: 15,
				attribution: '&copy; <a href="https://maps.nls.uk/copyright.html">National Library of Scotland</a>',
				tileSize: 256,
				label: 'OS 6-inch',
				description: 'Comprehensive topographic mapping covering all of England and Wales from the 1840s.'
			},
			/*
			os1to25k1stseries: {
				tiles: 'https://{s}.tile.cyclestreets.net/os1to25k1stseries/{z}/{x}/{y}@2x.png',
				maxZoom: 16,
				attribution: '&copy; <a href="https://maps.nls.uk/copyright.html">National Library of Scotland</a>',
				tileSize: 256,
				label: 'NLS - OS 1:25,000 Provisional / First Series 1937-1961',
			},
			os1inch7thseries: {
				tiles: 'https://{s}.tile.cyclestreets.net/os1inch7thseries/{z}/{x}/{y}@2x.png',
				maxZoom: 16,
				attribution: '&copy; <a href="https://maps.nls.uk/copyright.html">National Library of Scotland</a>',
				tileSize: 256,
				label: 'NLS - OS 1-inch 7th Series 1955-1961'
			}
			*/
		},
		
		// Popup pages, defined as content div ID
		pages: [
			// 'about'
		],
		
		// Region switcher, with areas defined as a GeoJSON file
		regionsFile: false,
		regionsField: false,
		regionsSubstitutionToken: false,
		regionSwitcherPosition: 'top-right',
		
		// Initial view of all regions; will use regionsFile
		initialRegionsView: false,
		initialRegionsViewRemovalZoom: 10,	// or false to keep it; 10 is roughly size of a UK County
		
		// Whether to show layer errors in a (non-modal) corner dialog, rather than as a modal popup
		errorNonModalDialog: false,
		
		// Beta switch
		enableBetaSwitch: false,
		
		// Password protection, as an SHA-256 hash
		password: false,
		
		// Hide default LayerViewer message area and legend
		hideExtraMapControls: false,
		
		// Form rescan path
		formRescanPath: 'form#data #{layerId}',
		
		// Custom data loading spinner selector for layerviewer. For layer specific spinner, should contain layerId
		dataLoadingSpinnerSelector: '#selector li.{layerId} img.loading',
		
		// Style switcher, either false to create a default Leaflet-style basic switcher, or a selector path for a div that will contain a graphical switcher
		styleSwitcherGraphical: false,
		
		// Custom panning control element
		panningControlElement: '<p><a id="panning" href="#">Panning: disabled</a></p>',
		
		// Custom panning control element insertion point (will be prepended to this element)
		panningControlInsertionElement: '#styleswitcher ul',
		
		// Determine whether to enable layerviewer's text based panning status indication
		setPanningIndicator: true,
		
		// Whether to use MapboxGL JS's default navigation controls
		useDefaultNavigationControls: true,
		
		// Whether to use MapboxGL JS's default geolocation control
		hideDefaultGeolocationControl: false,
		
		// Load Tabs class toggle, used when loading a parameterised URL. This CSS class will be added to the enabled parent li elements (i.e., 'checked', or 'selected')
		loadTabsClassToggle: 'selected',
		
		// Use jQuery tabs to tabify main menu
		useJqueryTabsRendering: true,
	};
	
	// Layer definitions, which should be overriden by being supplied as an argument by the calling application
	var _layerConfig = {
		
		/* Example, showing all available options:
		layerid: {
			
			// Path or full URL to the API endpoint
			apiCall: '/path/to/api',
			
			// API key specific to this layer's API call
			apiKey: false,
			
			// Fixed parameters required by this API
			apiFixedParameters: {
				key: 'value',
				foo: 'bar'
			},
			
			// Name and description
			name: '',
			description: '',
			
			// Explicit data type (assumed to be JSON), e.g. XML
			dataType: false,
			
			// Callback for data conversion just after receiving the data
			convertData: function (data) {return somefunction (data);},
			
			// Minimum zoom required for this layer
			minZoom: false,
			
			// Show a message if the zoom level is below this level (i.e. too zoomed out)
			fullZoom: 17,
			fullZoomMessage: 'Customised string',
			
			// If the layer requires that query fields are prefixed with a namespace, prefix each fieldname
			parameterNamespace: 'field:',
			
			// Whether to send zoom= to the API end, which is useful for some APIs
			sendZoom: true,
			
			// Specific icon to use for all markers in this layer
			iconUrl: '/images/icon.svg',
			
			// Field in GeoJSON data where the icon value can be looked up
			iconField: 'type',
			
			// Icon lookups, based on the iconField
			icons: {
				foo: '/images/foo.svg',
				bar: '/images/bar.svg',
				qux: '/images/qux.svg'
			},
			
			// Icon size, either fixed or dynamic lookup from a field in the feature properties
			iconSize: [38, 42],
			iconSizeField: false,
			iconSizes: {},
			
			// Order of marker appearance, in order from least to most important
			markerImportance: ['foo', 'bar', 'qux'],
			
			// Explicit styling
			style: {
				weight: 5
			},
			
			// If drawing lines, the field that contains the value used to determine the colour, and the colour stops for this, as an array of pairs of upper limit value and colour
			lineColourField: 'value',
			lineColourStops: [
				[200, '#ff0000'],
				[50, '#e27474'],
				[0, '#61fa61']
			],
			
			// Similarly, line width
			lineWidthField: 'width',
			lineWidthStops: [
				[250, 10],
				[100, 5],
				[0, 1],
			],
			
			// Enable hover for this layer (for line-based layers)
			hover: true,
			
			// Legend, either array of values (as same format as lineColourStops), or boolean true to use lineColourStops if that exists
			legend: true,
			
			// Polygon style; currently supported values are 'grid' (blue boxes with dashed lines, intended for tessellating data), 'green', 'red', 'blue'
			polygonStyle: 'grid',

			// A secondary API call, used to get a specific ID
			apiCallId: {
				apiCall: '/path/to/secondaryApi',
				idParameter: 'id',
				apiFixedParameters: {
					key: 'value',
					foo: 'bar'			
				},
				popupAnimation: 'true',
			},
			
			// Code for popups; placeholders can be used to reference data in the GeoJSON; if using sublayerParameter, this is specified as a hashmap
			popupHtml:
				+ '<p>Reference: <strong>{properties.id}</strong></p>'
				+ '<p>Date and time: {properties.datetime}</p>',
			
			// Formatter for popup fields when using auto-table creation
			popupImagesField: false,
			popupFormatters: {
				myField: function (value, feature) {return string;},
				...
			},
			
			// Make lookups (Popups / line colour stops) dependent on the value of a specified request parameter
			sublayerParameter: false,
			
			// Labels for auto-popups
			popupLabels: {},
			
			// Field that contains a follow-on API URL where more details of the feature can be requested
			detailsOverlay: 'apiUrl',
			
			// Overlay code, as per popupHtml, but for the follow-on overlay data
			overlayHtml: '<p>{properties.caption}</p>',
			
			// Retrieval strategy - 'bbox' (default) sends w,s,e,n; 'polygon' sends as sw.lat,sw.lng:se.lat,se.lng:ne.lat,ne.lng:nw.lat,nw.lng:sw.lat,sw.lng
			retrievalStrategy: 'bbox',
			
			// Boundary parameter name (most likely to be useful in polygon retrievalStrategy mode), defaulting to 'boundary'
			apiBoundaryField: 'boundary',
			
			// If reformatting the boundary in the response is needed, unpacking strategy; only 'latlon-comma-colons' is supported
			apiBoundaryFormat: 'latlon-comma-colons',
			
			// Flat JSON mode, for when GeoJSON is not available, specifying the location of the location fields within a flat structure
			flatJson: ['location.latitude', 'location.longitude'],
			
			// Heatmap mode
			heatmap: false,
			
			// Tile layer mode, which adds a bitmap tile overlay
			tileLayer: [],	// Format as per _settings.tileUrls
			
			// Marker-setting mode, which requires a hidden input field; a default value of that field will set an initial location; uses iconUrl
			setMarker: false
		},
		
		*/
	};
	
	
	// Internal class properties
	var _map = null;
	var _layers = {};	// Layer status registry
	var _styles = {};
	var _currentStyleId;
	var _markers = [];
	var _popups = [];
	var _tileOverlayLayer = false;
	var _isTouchDevice;
	var _panningEnabled = false;
	var _virginFormState = {};
	var _parameters = {};
	var _xhrRequests = {};
	var _requestCache = {};
	var _title = false;
	var _embedMode = false;
	var _betaMode = false;
	var _message = {};
	var _geolocate = null; // Store the geolocation element
	var _geolocationAvailable = false; // Store geolocation availability, to automatically disable location tracking if user has not selected the right permissions
	var _customPanningIndicatorAction = false; // Custom function that can be run on click action panning on and off, i.e. to control the visual state of a custom panning button
	var _customGeolocationButtonAction = false; // Custom function that can be run on click event on geolocation control, i.e. to control the visual state of a custom geolocation control
	
	return {
		
	// Public functions
		
		// Main function
		initialise: function (config, layerConfig)
		{
			// Merge the configuration into the settings
			$.each (_settings, function (setting, value) {
				if (config.hasOwnProperty(setting)) {
					_settings[setting] = config[setting];
				}
			});
			
			// Determine if the device is a touch device
			_isTouchDevice = layerviewer.isTouchDevice ();
			
			// Enable general page handlers
			if (_settings.pages) {
				$.each (_settings.pages, function (index, contentDivId) {
					layerviewer.pageDialog (contentDivId);
				});
			}
			
			// Require password if enabled
			if (_settings.password) {
				if (!layerviewer.passwordProtection ()) {
					return false;
				}
			}
			
			// Obtain the layers
			_layerConfig = layerConfig;
			
			// Parse the URL
			var urlParameters = layerviewer.parseUrl ();

			// Set the initial location and tile layer
			var defaultLocation = (urlParameters.defaultLocation || _settings.defaultLocation);
			var defaultTileLayer = (urlParameters.defaultTileLayer || _settings.defaultTileLayer);
			
			// Load styles
			layerviewer.getStyles ();
			
			// Create the map
			layerviewer.createMap (defaultLocation, defaultTileLayer);
			
			// Hide unwanted UI elements in embed mode if required
			layerviewer.embedMode ();
			
			// If HTML5 History state is provided, use that to select the sections
			var initialLayersPopstate = false;
			/* Doesn't work yet, as is asyncronous - need to restructure the initialisation
			$(window).on('popstate', function (e) {
				var popstate = e.originalEvent.state;
				if (popstate !== null) {
					initialLayersPopstate = popstate;
				}
			});
			*/
			
			// If cookie state is provided, use that to select the sections
			var state = Cookies.getJSON ('state');
			var initialLayersCookies = [];
			if (state) {
				$.each (state, function (layerId, parameters) {
					if (_layerConfig[layerId]) {
						initialLayersCookies.push (layerId);
					}
				});
			}
			
			// Determine layers to use, checking for data in order of precedence
			var initialLayers = initialLayersPopstate || (urlParameters.sections.length ? urlParameters.sections : false) || (initialLayersCookies.length ? initialLayersCookies : false) || _settings.defaultLayers;
			
			// Load the tabs
			layerviewer.loadTabs (initialLayers);
			
			// Create mobile navigation
			layerviewer.createMobileNavigation ();
			
			// Populate dynamic form controls
			layerviewer.populateDynamicFormControls ();
			
			// Add slider value display support
			layerviewer.sliderValueDisplayHandler ();
			
			// Set form values specified in the URL
			layerviewer.setFormValues (urlParameters.formParameters);
			
			// Add tooltip support
			layerviewer.tooltips ();
			
			// Set dialog style
			vex.defaultOptions.className = 'vex-theme-plain';
			
			// Register a more details dialog box handler, giving a link to more information
			layerviewer.moreDetails ();
			
			// Show first-run welcome message if the user is new to the site
			layerviewer.welcomeFirstRun ();
			
			// Create the legend for the current field, and update on changes
			layerviewer.createLegend ();
			
			// Create a beta switch if required
			layerviewer.createBetaSwitch ();
			
			// Create a message area, and provide methods to manipulate it
			layerviewer.messageArea ();
			
			// Region switcher
			layerviewer.regionSwitcher ();
			
			// Show intial regions view if required
			layerviewer.initialRegionsView (urlParameters);
			
			// Enable feedback handler
			layerviewer.feedbackHandler ();
			
			// Determine the enabled layers
			layerviewer.determineLayerStatus ();
			
			// Determine the initial form state as specified in the fixed HTML, for all layers
			$.each (_layers, function (layerId, layerEnabled) {
				_virginFormState[layerId] = layerviewer.parseFormValues (layerId);
			});
			
			// Load the data, and add map interactions and form interactions
			_map.on ('load', function () {		// Because layers may do addLayer(), the whole layer management must be wrapped in map load; see: https://docs.mapbox.com/help/how-mapbox-works/web-apps/#adding-layers-to-the-map
				$.each (_layers, function (layerId, layerEnabled) {
					if (layerEnabled) {
						layerviewer.enableLayer (layerId);
					}
				});
			});

			// If an ID is supplied in the URL, load it 
			layerviewer.loadIdFromUrl (urlParameters);
			
			// Toggle map data layers on/off when checkboxes changed
			$('#selector input[type="checkbox"]').change (function(event) {
				layerviewer.toggleDataLayer (event.target);
			});
			
			// Enable embed dialog handler
			layerviewer.embedHandler ();

		},


		// Function to set a layer configuration after loading
		setLayerConfigParameter: function (layer, field, value)
		{
			_layerConfig[layer][field] = value;
		},


		// Function to toggle map data layers on/off when checkboxes changed
		toggleDataLayer: function (target)
		{
			// Add class to facilitate display of an icon
			var layerId = target.id.replace('show_', '');
			if (target.checked) {
				_layers[layerId] = true;
				layerviewer.enableLayer (layerId);
			} else {
				_layers[layerId] = false;
				if (_xhrRequests[layerId]) {
					_xhrRequests[layerId].abort();
				}
				layerviewer.removeLayer (layerId);
				layerviewer.clearLegend ();
			}
		},
		
		
		// Getter for map
		getMap: function ()
		{
			return _map; 
		},
		
		
		// Function to determine if the device is a touch device
		isTouchDevice: function ()
		{
			// See https://stackoverflow.com/a/13470899/180733
			return 'ontouchstart' in window || navigator.msMaxTouchPoints;		// https://stackoverflow.com/a/13470899/180733
		},
		
		
		// Password protection; this is intended to provide a simple, basic level of protection only
		passwordProtection: function ()
		{
			// Obtain the cookie if present
			var hostSuffix = window.location.hostname.toLowerCase().replace(/[^a-z]+/g, '');
			var cookieName = 'login' + hostSuffix;
			var value = Cookies.get(cookieName);
			
			// Validate if value supplied from cookie
			if (value) {
				if (layerviewer.validatePassword (value)) {
					return true;
				}
			}
			
			// Get the home page HTML and overwrite the content
			var html = $('#home').html();
			html = '<div id="protection">' + html + '</div>';
			$('main').html (html);
			
			// Add a password form
			$('#protection').append ('<p id="loginprompt">If you have been given a login password, please enter it below.</p>');
			var form = $('<form id="password" method="post"></form>');
			form.append('<input name="password" type="password" required="required" placeholder="Password" size="20" autofocus="autofocus" />');
			form.append('<input type="submit" value="Submit" />');
			$('#protection').append (form);
			
			// If the form is submitted, validate the value
			$('#password').submit (function(event) {
				
				// Prevent page reload
				event.preventDefault();
				
				// Obtain the value and validate the password
				var values = $(this).serializeArray ();
				var password = values[0].value;
				if (layerviewer.validatePassword (password)) {
					
					// Set the cookie, storing the (low-security) entered value
					Cookies.set(cookieName, password, {expires: 7});
					
					// Reload the page and end
					location.reload ();
				} else {
					
					// Show message
					var message = 'The password you gave is not correct. Please check and try again.';
					vex.dialog.alert ({
						message: message,
						showCloseButton: true,
						className: 'vex vex-theme-plain',
						afterClose: function () {
							$('form#password')[0].reset();	// See: https://stackoverflow.com/a/21514788/180733
							$('form#password input[type="password"]').focus();
						}
					});
				}
			});
			
			// Not validated
			return false;
		},
		
		
		// Helper function to validate the password
		validatePassword: function (value)
		{
			// Hash the value
			var shaObj = new jsSHA ('SHA-256', 'TEXT');
			shaObj.update (value);
			var hash = shaObj.getHash ('HEX');
			
			// Compare against the correct password hash
			if (hash === _settings.password) {
				return true;
			}
			
			// Failure
			return false;
		},
		
		
		// Function to parse the URL
		parseUrl: function ()
		{
			// Start a list of parameters
			var urlParameters = {};
			
			// Split the path by slash; see: https://stackoverflow.com/a/8086637
			var pathComponents = window.location.pathname.split('/').slice(1);
			if (pathComponents) {
				
				// Obtain the sections and form parameters from the URL
				var formParameters = layerviewer.urlSlugToFormParameters (pathComponents[0]);
				
				// Obtain the section(s), checking against the available sections in the settings
				urlParameters.sections = [];
				if (formParameters) {
					$.each (formParameters, function (layerId, parameters) {
						if (_layerConfig[layerId]) {
							urlParameters.sections.push (layerId);
						}
					});
				}
				
				// Register the form parameters
				urlParameters.formParameters = formParameters;
				
				// Register non-form components (i.e., Photomap popup)
				if (pathComponents[1]) {
					urlParameters.id = pathComponents[1];
				}	
				
				// Obtain embed mode if present
				// #¡# Needs to recognise whether embed is the last (but not the first) parameter
				if (pathComponents[1]) {
					if (pathComponents[1] == 'embed') {
						_embedMode = true;
					}
				}
			}
			
			// Obtain query string parameters, which are used for presetting form values
			urlParameters.queryString = layerviewer.parseQueryString ();
			
			// Get the location from the URL
			urlParameters.defaultLocation = null;
			urlParameters.defaultTileLayer = null;
			if (window.location.hash) {
				var hashParts = window.location.hash.match (/^#([0-9]{1,2}.?[0-9]*)\/([-.0-9]+)\/([-.0-9]+)\/([a-z0-9]+)$/);	// E.g. #17.21/51.51137/-0.10498/opencyclemap
				if (hashParts) {
					urlParameters.defaultLocation = {
						latitude: hashParts[2],
						longitude: hashParts[3],
						zoom: hashParts[1]
					}
					urlParameters.defaultTileLayer = hashParts[4];
					
					// Remove the tile layer element, before loading the map, so that the MapboxGL hash value is as expected
					window.location.hash = window.location.hash.replace ('/' + urlParameters.defaultTileLayer, '');
				}
			}
			
			// Return the parameters
			return urlParameters;
		},
		
		
		// Function to parse the query string into key/value pairs
		parseQueryString: function ()
		{
			// See: https://stackoverflow.com/a/8649003/180733
			if (!location.search.length) {return {};}
			var queryString = location.search.substring(1);
			var parameters = layerviewer.deparam (queryString);
			return parameters;
		},
		
		
		// Function to add an initial regions view
		initialRegionsView: function (urlParameters)
		{
			if (_settings.initialRegionsView && _settings.regionsFile) {
				if (!urlParameters.defaultLocation) {
					
					// Add the data, rendering the polygons
					_map.on ('load', function () {		// See: https://docs.mapbox.com/help/how-mapbox-works/web-apps/#adding-layers-to-the-map
						_map.addLayer ({
							id: 'regionsOverlay',
							source: {
								type: 'geojson',
								data: _settings.regionsFile,
								generateId: true	// NB See: https://github.com/mapbox/mapbox-gl-js/issues/8133
							},
							type: 'fill',
							layout: {},
							paint: {
								'fill-color': '#3388ff',
								'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 1, 0.5],	// See: https://docs.mapbox.com/mapbox-gl-js/example/hover-styles/
								'fill-outline-color': 'blue'
								// NB Outline line width cannot be changed: https://github.com/mapbox/mapbox-gl-js/issues/3018#issuecomment-240381965
							}
						});
					});
					
					// Set hover state; see: https://docs.mapbox.com/mapbox-gl-js/example/hover-styles/
					layerviewer.setHoverState ('regionsOverlay', 'regionsOverlay');
					
					// Support popup content, if enabled
					if (_settings.regionsField) {
						
						// Create a popup, but don't add it to the map yet
						var popup = new mapboxgl.Popup ({
							closeButton: false,
							closeOnClick: false
						});
						
						// Handle popup; see: https://docs.mapbox.com/mapbox-gl-js/example/popup-on-hover/
						_map.on ('mouseenter', 'regionsOverlay', function (e) {
							_map.getCanvas().style.cursor = 'pointer';
							
							// Set the co-ordinates
							var feature = e.features[0];
							var coordinates = layerviewer.polygonCentroid (feature);
							
							// Add the region name as the popup content
							var regionName = feature.properties[_settings.regionsField];
							regionName = layerviewer.htmlspecialchars (layerviewer.ucfirst (regionName));
							
							// Populate the popup and set its coordinates based on the feature found
							popup.setLngLat (coordinates)
								.setHTML (regionName)
								.addTo (_map);
						});
						_map.on ('mouseleave', 'places', function (e) {
							_map.getCanvas().style.cursor = '';
							popup.remove ();
						});
					}
					
					// Zoom to area and remove layer when clicked
					_map.on ('click', 'regionsOverlay', function (e) {
						var feature = e.features[0];
						_map.fitBounds (geojsonExtent (feature));
						_map.removeLayer ('regionsOverlay');
						if (_settings.regionsField) {
							popup.remove ();
						}
					});
					
					// Create a handler to remove the overlay automatically when zoomed in (but not explicitly clicked through)
					if (_settings.initialRegionsViewRemovalZoom) {
						_map.on ('zoomend', function (e) {
							if (_map.getLayer ('regionsOverlay')) {
								var currentZoom = _map.getZoom ();
								if (currentZoom >= _settings.initialRegionsViewRemovalZoom) {
									_map.removeLayer ('regionsOverlay');
								}
							}
						});
					}
				}
			}
		},
		
		
		// Helper function to handle hover state; see: https://docs.mapbox.com/mapbox-gl-js/example/hover-styles/
		setHoverState: function (layerId, sourceId)
		{
			// Create the hover state ID
			var hoveredStateId =  null;
			
			// When the user moves their mouse over the state-fill layer, update the feature state for the feature under the mouse
			_map.on ('mousemove', layerId, function (e) {
				if (e.features.length > 0) {
					if (hoveredStateId) {
						_map.setFeatureState ({source: sourceId, id: hoveredStateId}, {hover: false});
					}
					hoveredStateId = e.features[0].id;
					_map.setFeatureState ({source: sourceId, id: hoveredStateId}, {hover: true});
				}
			});
			 
			// When the mouse leaves the state-fill layer, update the feature state of the previously hovered feature
			_map.on ('mouseleave', layerId, function () {
				if (hoveredStateId) {
					_map.setFeatureState ({source: sourceId, id: hoveredStateId}, {hover: false});
				}
				hoveredStateId =  null;
			});
		},
		
		
		// Helper function to get the centre point of a ol
		polygonCentroid: function (feature)
		{
			// Convert the feature to bbox bounds, and then get the centre of that bbox
			var bounds = geojsonExtent (feature);
			var coordinates = {
				lng: ((bounds[0] + bounds[2]) / 2),	// Average (centre) of W/E
				lat: ((bounds[1] + bounds[3]) / 2)	// Average (centre) of S/N
			};
			return coordinates;
		},
		
		
		// Function to support embed mode, which disables various UI elements
		embedMode: function ()
		{
			// End if not enabled
			if (!_embedMode) {return;}
			
			// If the site is being iframed, force target of each link to parent
			var inIframe = layerviewer.inIframe ();
			if (inIframe) {
				$('a').attr('target', '_parent');
			}
			
			// Add CSS
			$('body').addClass('embed');
		},
		
		
		// Helper function to determine if the site is being iframed; see: https://stackoverflow.com/a/326076/180733
		inIframe: function () {
			try {
				return window.self !== window.top;
			} catch (e) {
				return true;
			}
		},
		
		
		// Function to load the tabs
		loadTabs: function (defaultLayers)
		{
			// Set each default layer and add background
			$.each (defaultLayers, function (index, layerId) {
				
				// Add background highlight to this tab
				$('nav li.' + layerId).addClass(_settings.loadTabsClassToggle);
				
				// Enable checkbox
				$('nav input#show_' + layerId).click();
			});
			
			if (_settings.useJqueryTabsRendering) {
				
				// Enable tabbing of main menu
				$('nav').tabs();
				
				// If a default tab is defined (or several, in which case use the first), switch to its contents (controls); see: https://stackoverflow.com/a/7916955/180733
				if (defaultLayers[0]) {
					var index = $('nav li.' + defaultLayers[0]).index();
					$('nav').tabs('option', 'active', index);
				}
			}
			
			// Handle selection/deselection of section checkboxes
			$('nav #selector input').change (function () {
				
				// Add background highlight to this tab
				$(this).parent ('li').toggleClass (_settings.loadTabsClassToggle, this.checked);
				
				// Update the URL using HTML5 History pushState
				layerviewer.determineLayerStatus ();
				layerviewer.updateUrl ();
				
				if (_settings.useJqueryTabsRendering) {
					// If enabling, switch to its tab contents (controls)
					if (this.checked) {
						var index = $(this).parent ().index ();
						$('nav').tabs('option', 'active', index);
					}
				}
			});
			
			// Allow double-clicking of each menu item (surrounding each checkbox) as implicit selection of its checkbox
			$('nav #selector li a').dblclick(function () {
				$(this).parent ().find ('input').click ();
			});
			
			// Allow any form change within a layer as implicit selection of its checkbox
			$('form#data .filters :input').change (function () {
				layerviewer.formChangeImplicitCheckbox (this);
			});
			$('form#data #sections div :text, form#data #sections div input[type="search"]').on ('input', function() {
				layerviewer.formChangeImplicitCheckbox (this);
			});
		},
		
		
		// Function for handlers of implicit selection of checkbox on form change
		formChangeImplicitCheckbox: function (changedInputPath)
		{
			var layerId = $(changedInputPath).closest('#sections > div').attr('id');	// Assumes #sections contains layer DIVs directly
			if ($('nav input#show_' + layerId).prop ('checked') != true) {
				$('nav input#show_' + layerId).click ();
			}
		},
		
		
		// Create mobile navigation
		createMobileNavigation: function ()
		{
			// Add hamburger menu
			$('body').append ('<div id="nav-mobile"></div>');
			
			// Toggle visibility clickable
			$('#nav-mobile').click(function () {
				if ($('nav').is(':visible')) {
					$('nav').hide ('slide', {direction: 'right'}, 250);
					$('#nav-mobile').fadeTo(250, 1);
				} else {
					$('nav').animate ({width: 'toggle'}, 250);
					$('#nav-mobile').fadeTo(250, 0.5);
				}
			});
			
			// Enable implicit click/touch on map as close menu
			if ($('#nav-mobile').is(':visible')) {
				if (!$('nav').is(':visible')) {
					$('.map').click(function () {
						$('nav').hide ('slide', {direction: 'right'}, 250);
						$('#nav-mobile').fadeTo(250, 1);
					});
				};
			};
			
			// Enable closing menu on slide right
			if ($('#nav-mobile').is(':visible')) {
				$('nav').on('swiperight', function () {
					$('nav').hide ('slide', {direction: 'right'}, 250);
					$('#nav-mobile').fadeTo(250, 1);
				});
			};
		},
		
		
		// Function to update the URL, to provide persistency when a link is circulated
		// Format is /<baseUrl>/<layerId1>:<param1key>=<param1value>&[...],<layerId2>[...]/#<mapHashWithStyle>
		updateUrl: function ()
		{
			// End if not supported, e.g. IE9
			if (!history.pushState) {return;}
			
			// Obtain the URL slug
			var urlSlug = layerviewer.formParametersToUrlSlug ();
			
			// Construct the URL
			var url = _settings.baseUrl;	// Absolute URL
			url += urlSlug;
			url += window.location.hash;
			
			// Construct the page title, based on the enabled layers
			var title = layerviewer.pageTitle ();
			
			// Push the URL state
			history.pushState (urlSlug, title, url);
			document.title = title;		// Workaround for poor browser support; see: https://stackoverflow.com/questions/13955520/
		},
		
		
		// Function to convert form parameters to a URL slug
		formParametersToUrlSlug: function ()
		{
			// Copy (clone) the parameter state for the purposes of determining the URL
			var urlParameters = $.extend (true, {}, _parameters);	// See: https://stackoverflow.com/a/12690181/180733
			
			// Define system-wide parameters that are not layer-specific
			var genericParameters = ['bbox', 'boundary'];
			
			// Filter for enabled layers
			var enabledLayers = [];
			var component;
			
			$.each (_layers, function (layerId, isEnabled) {
				if (isEnabled) {
					
					// Start with the layer ID
					component = layerId;
					
					// Deal with parameters for each layer
					if (urlParameters[layerId]) {
						
						// Omit generic parameters which the API will automatically receive
						$.each (genericParameters, function (index, parameter) {
							if (urlParameters[layerId].hasOwnProperty (parameter)) {
								delete urlParameters[layerId][parameter];
							}
						});
						
						// Omit parameters whose value matches the virgin form state, to keep the URL as short as possible
						$.each (_virginFormState[layerId], function (parameter, virginValue) {
							if (urlParameters[layerId].hasOwnProperty (parameter) && (urlParameters[layerId][parameter] == virginValue)) {
								delete urlParameters[layerId][parameter];
							} else {
								urlParameters[layerId][parameter] = '';		// Deal with scenario of e.g. checkbox ticked by default, and unticked, thus not being the default but not being present in the form parameter list
							}
						});
						
						// If there are now parameters remaining, add these to this layer's component
						if (!$.isEmptyObject (urlParameters[layerId])) {
							component += ':' + $.param (urlParameters[layerId]);
						}
					}
					
					// Register the component
					enabledLayers.push (component);
				}
			});
			
			// Construct the URL slug, joining by comma
			var urlSlug = enabledLayers.join(',') + (enabledLayers.length ? '/' : '');
			
			// Return the URL slug
			return urlSlug;
		},
		
		
		// Function to convert a URL to form parameters; this is the reverse of formParametersToUrlSlug()
		urlSlugToFormParameters: function (urlSlug)
		{
			// Return empty array if empty string
			if (!urlSlug) {return {};}
			
			// Split by comma
			var components = urlSlug.split (',');
			
			// Split each component by optional colon, then unpack the encoded string
			var layers = {};
			$.each (components, function (index, component) {
				var layerDetails = component.split (':', 2);
				var layerId = layerDetails[0];
				var parameters = (layerDetails[1] ? layerviewer.deparam (layerDetails[1]) : {});
				layers[layerId] = parameters;
			});
			
			// Return the result
			return layers;
		},
		
		
		// Reverse of $.param(); see: https://stackoverflow.com/a/26849194/180733
		deparam: function (string)
		{
			return string.split('&').reduce(function (params, param) {
				var paramSplit = param.split('=').map(function (value) {
					return decodeURIComponent(value.replace('+', ' '));
				});
				params[paramSplit[0]] = paramSplit[1];
				return params;
			}, {});
		},
		
		
		// Function to construct the browser page title
		pageTitle: function ()
		{
			if (!_title) {_title = document.title;}		// Obtain and cache the original page title
			var title = _title;
			var layerTitles = [];
			$.each (_layers, function (layerId, isEnabled) {
				if (isEnabled) {
					layerTitles.push (layerviewer.layerNameFromId (layerId).toLowerCase());
				}
			});
			if (layerTitles) {
				title += ': ' + layerTitles.join(', ');
			}
			
			// Return the title
			return title;
		},
		
		
		// Function to get the layer name from its ID
		layerNameFromId: function (layerId)
		{
			return $('#selector li.' + layerId + ' a').text();
		},
		
		
		// Function to populate dynamic form controls
		populateDynamicFormControls: function ()
		{
			// Support for "data-monthly-since" (e.g. = '2013-07') macro which populates a select with an option list of each month, grouped by optgroup years
			// #!# Also need support for data-monthly-until
			var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
			$('select[data-monthly-since]').val(function() {	// See: https://stackoverflow.com/a/16086337
				var since = $(this).data('monthly-since');
				since = since.split('-');
				var sinceYear = since[0];
				var sinceMonth = since[1];
				var html = '';
				var yearToday = new Date().getFullYear();
				var monthToday = new Date().getMonth() + 1;	// Index from 1
				var year;
				var month;
				var month1Indexed;
				for (year = yearToday; year >= sinceYear; year--) {	// See: https://stackoverflow.com/a/26511699
					html += '<optgroup label="' + year + '">';
					for (month = months.length - 1; month >= 0; month--) {	// Loop through backwards reliably; see: https://stackoverflow.com/a/4956313
						month1Indexed = month + 1;
						if ((year == yearToday) && (month1Indexed >= monthToday)) {continue;}	// Skip months not yet completed
						var monthPadded = (month1Indexed < 10 ? '0' : '') + month1Indexed;	// Pad zeroes and cast as string
						html += '<option value="' + year + '-' + monthPadded + '">' + months[month] + ' ' + year + '</option>';
						if ((year == sinceYear) && (monthPadded == sinceMonth)) {break;}	// End at last year and since month
					}
					html += '</optgroup>';
				}
				$(this).append(html);
			});
			
			// Support for "data-yearly-since-unixtime" macro which populates a select with an option list of each year, expressed as Unixtime
			$('select[data-yearly-since-unixtime]').val(function() {
				var sinceYear = $(this).data('yearly-since-unixtime');
				var yearToday = new Date().getFullYear();
				var html = '';
				var year;
				var unixtime;
				for (year = yearToday; year >= sinceYear; year--) {	// See: https://stackoverflow.com/a/26511699
					unixtime = parseInt((new Date(year, 1, 1).getTime() / 1000).toFixed(0));	// https://stackoverflow.com/a/28683720/180733
					html += '<option value="' + unixtime + '">' + year + '</option>';
				}
				$(this).append(html);
			});
			
			// Support for "data-yearly-range-{since|until}-sqldate" macros which populate a select with an option list of each year in a comma-separated range, expressed as SQL time
			var sqltimeMacros = {
				'yearly-range-since-sqldate': '-01-01',
				'yearly-range-until-sqldate': '-12-31'
			};
			$.each (sqltimeMacros, function (macroName, monthDateString) {
				$('select[data-' + macroName + ']').val(function() {
					var yearRange = $(this).data(macroName).split (',');
					var startYear = yearRange[0];
					var finishYear = yearRange[1];
					var html = '';
					var year;
					var sqldate;
					for (year = finishYear; year >= startYear; year--) {	// See: https://stackoverflow.com/a/26511699
						sqldate = year + monthDateString;
						html += '<option value="' + sqldate + '">' + year + '</option>';
					}
					$(this).append(html);
				});
			});
		},
		
		
		// Slider value display handler, to show the current slider value
		sliderValueDisplayHandler: function ()
		{
			// For each slider, show the input's value (at start, and on change), in the associated paragraph tag
			//var sliderDivs = $('form#data .slider');
			var sliderDivs = $('form .slider');
			$.each (sliderDivs, function (index, sliderDiv) {
				var datalistLabel = $('datalist option[value="' + $('input', sliderDiv).val() + '"]', sliderDiv).text();
				$('p', sliderDiv).text (datalistLabel);
				$('input', sliderDiv).on ('change', function (event) {
					var datalistLabel = $('datalist option[value="' + event.target.value + '"]', sliderDiv).text();
					$('p', sliderDiv).text (datalistLabel);
				});
			});
		},
		
		
		// Function to set form values specified in the URL
		setFormValues: function (formParameters)
		{
			// Set form values, where they exist
			var elementPath;
			$.each (formParameters, function (layerId, values) {
				if (_layerConfig[layerId]) {	// Validate against layer registry
					$.each (values, function (inputName, value) {
						elementPath = '#sections #' + layerId + ' :input[name="' + inputName + '"]';
						if ($(elementPath).length) {
							$(elementPath).val(value);
						}
					});
				}
			});
		},
		
		
		// Function to add tooltips, using the title value
		tooltips: function ()
		{
			// Use jQuery tooltips; see: https://jqueryui.com/tooltip/
			$('nav').tooltip ({
				track: true
			});
		},
		
		
		// Handler for a more details popup layer
		moreDetails: function ()
		{
			// End if no definitions present
			if ($('#aboutfields').length == 0) {return;}
			
			// Create popup when link clicked on
			$('.moredetails').click (function (e) {
				
				// Obtain the field
				var field = $(this).attr('data-field');
				
				// Obtain the content; see: https://stackoverflow.com/a/14744011/180733 and https://stackoverflow.com/a/25183183/180733
				var dialogBoxContentHtml = $('#aboutfields').find('h3.' + field).nextUntil('h3').addBack().map(function() {
					return this.outerHTML;
				}).get().join('');
				if (!dialogBoxContentHtml) {
					dialogBoxContentHtml = '<p><em>Sorry, no further details for this field available yet.</em></p>';
				}
				
				// Wrap in a div
				dialogBoxContentHtml = '<div id="moredetailsboxcontent">' + dialogBoxContentHtml + '</div>';
				
				// Create the dialog box
				layerviewer.dialogBox ('#moredetails', field, dialogBoxContentHtml);
				
				// Prevent link
				e.preventDefault ();
			});
		},
		
		
		// Dialog box
		dialogBox: function (triggerElement, name, html)
		{
			vex.dialog.buttons.YES.text = 'Close';
			vex.dialog.alert ({unsafeMessage: html, showCloseButton: true, className: 'vex vex-theme-plain wider'});
		},
		
		
		// Function to show a welcome message on first run
		welcomeFirstRun: function ()
		{
			// End if no welcome message
			if (!_settings.firstRunMessageHtml) {return;}
			
			// End if cookie already set
			var name = 'welcome';
			if (Cookies.get(name)) {return;}
			
			// Set the cookie
			Cookies.set(name, '1', {expires: 14});
			
			// Show the dialog
			vex.dialog.alert ({unsafeMessage: _settings.firstRunMessageHtml});
		},
		
		
		// Function to create and update the legend
		createLegend: function ()
		{
			if (_settings.hideExtraMapControls) {return;}

			// Affix the legend
			layerviewer.createControl ('legend', 'bottom-left');
			
			// Hide initially
			layerviewer.clearLegend ();
		},
		
		
		// Function to set the legend contents
		setLegend: function (layerId, sublayerIntervals, sublayerLineColourStops)
		{
			// Determine the intervalsand line colour stops for the current layer
			var intervals = _layerConfig[layerId].intervals;
			var lineColourStops = _layerConfig[layerId].lineColourStops;
			
			// In sublayer mode, do not display unless a sublayer is specified
			if (_layerConfig[layerId].sublayerParameter) {
				
				// If sublayer support is enabled, end if no sublayer specified, clearing the legend if present
				if (!sublayerIntervals) {
					layerviewer.clearLegend ();
					return;
				}
				
				// Allocate sublayer intervals and line colour stops
				intervals = sublayerIntervals;
				lineColourStops = sublayerLineColourStops;
			}
			
			// End if intervals not required for this layer
			if (!intervals) {return;}
			
			// If intervals is bool true, and lineColourStops is defined, use these as the intervals
			if ((intervals === true) && lineColourStops) {
				intervals = lineColourStops;
			}
			
			// If intervals is 'range', and lineColourStops is defined, generate range labels from these
			if ((intervals == 'range') && lineColourStops) {
				intervals = [];
				var label;
				var colour;
				var value;
				$.each (lineColourStops, function (index, interval) {
					colour = interval[1];
					value = interval[0];
					if (index == 0) {
						label = value + '+';
					} else {
						label = value + '-' + lineColourStops[index - 1][0];
					}
					intervals.push ([label, colour]);
				});
			}
			
			// Create the labels
			var labels = [];
			$.each (intervals, function (index, interval) {
				labels.push (['<i style="background: ' + interval[1] + '"></i>', layerviewer.htmlspecialchars (layerviewer.ucfirst (interval[0]))]);
			});
			
			// Compile the labels table
			var labelsTable = '<table>';
			$.each (labels, function (index, label) {
				labelsTable += '<tr><td>' + label[0] + '</td><td>' + label[1] + '</td></tr>';
			});
			labelsTable += '</table>';
			
			// Compile the HTML
			var html = '';
			if (_layerConfig[layerId].name) {
				html += '<h4>' + layerviewer.htmlspecialchars (_layerConfig[layerId].name) + '</h4>';
			}
			if (_layerConfig[layerId].description) {
				html += '<p>' + layerviewer.htmlspecialchars (_layerConfig[layerId].description) + '</p>';
			}
			html += labelsTable;
			
			// Set the HTML
			$('.legend').show ();
			$('.legend').html (html);
		},
		
		
		// Function to clear the legend
		clearLegend: function ()
		{
			$('.legend').hide ();
			$('.legend').html ('');
		},
		
		
		// Function to create a beta switch
		createBetaSwitch: function ()
		{
			// End if not required
			if (!_settings.enableBetaSwitch) {return;}
			
			// Create the control
			layerviewer.createControl ('betaswitch', 'bottom-right', 'info');
			
			// Determine the label
			var label = (_settings.enableBetaSwitch === true ? 'Beta' : _settings.enableBetaSwitch);
			
			// Define the HTML
			var html = '<form id="beta"><input type="checkbox" id="betabutton" name="betabutton" value="true" /><label for="betabutton"> ' + label + '</label></form>';
			
			// Add the content
			$('#betaswitch').html (html);
		},
		
		
		// Function to create a message area, and provide methods to manipulate it
		messageArea: function ()
		{	
			// Create the control
			layerviewer.createControl ('message', 'bottom-left');
			$('#message').hide ();
			
			// Register a method to set and show the message
			_message.show = function (html) {
				var html = '<p>' + html + '</p>';
				$('#message').html (html);
				$('#message').show ();
			};
			
			// Register a method to blank the message area
			_message.hide = function () {
				$('#message').html ('');
				$('#message').hide ();
			}
		},
		
		
		// Function to determine the layer status
		determineLayerStatus: function ()
		{
			// Initialise the registry
			$.each (_layerConfig, function (layerId, parameters) {
				_layers[layerId] = false;
			});
			
			// Create a list of the enabled layers
			$('#selector input:checked').map (function () {
				var layerId = this.id.replace('show_', '');
				_layers[layerId] = true;
			});
		},
		
		
		// Create the map
		createMap: function (defaultLocation, defaultTileLayer)
		{
			// Create the map in the "map" div, set the view to a given place and zoom
			mapboxgl.accessToken = _settings.mapboxApiKey;
			_map = new mapboxgl.Map ({
				container: 'map',
				style: _styles[defaultTileLayer],
				center: [defaultLocation.longitude, defaultLocation.latitude],
				zoom: defaultLocation.zoom,
				maxZoom: _settings.maxZoom,
				maxBounds: (_settings.maxBounds ? _settings.maxBounds : null),	// [W,S,E,N]
				// #!# Hash does not include layer; ideally would be added to: https://github.com/mapbox/mapbox-gl-js/blob/master/src/ui/hash.js perhaps using a monkey-patch: http://me.dt.in.th/page/JavaScript-override/
				hash: true
				// boxZoom is enabled, but mapbox-gl-draw causes it to fail: https://github.com/mapbox/mapbox-gl-draw/issues/571
			});
			
			// Set the style flag
			_currentStyleId = defaultTileLayer;
			
			// Enable zoom in/out buttons
			if (_settings.useDefaultNavigationControls) {
				_map.addControl (new mapboxgl.NavigationControl (), 'bottom-right');
			}
			
			// Add buildings
			layerviewer.addBuildings ();
			
			// Add 3D terrain
			if (_settings.enable3dTerrain) {
				layerviewer.add3dTerrain ();
			}
			
			// Add style (backround layer) switching
			layerviewer.styleSwitcher ();
			
			// Enable tilt and direction
			layerviewer.enableTilt ();
			
			// Add a geolocation control
			layerviewer.geolocation (_settings.geolocationElementId, _settings.trackUser);
			
			// Add geocoder control
			layerviewer.geocoder ();
			
			// Add drawing support if enabled
			if (_settings.enableDrawing) {
				layerviewer.drawing ('#geometry', true, '');
			}
			
			// Add map scale if required
			if (_settings.enableScale) {
				_map.addControl(new mapboxgl.ScaleControl ({position: 'bottom-left'}));
			}
		},
		
		
		// Define styles
		getStyles: function ()
		{
			// Register each tileset
			$.each (_settings.tileUrls, function (tileLayerId, tileLayerAttributes) {
				
				// Register vector tiles or traditional raster (bitmap) layers
				if (tileLayerAttributes.vectorTiles) {
					_styles[tileLayerId] = layerviewer.defineVectorLayer (tileLayerAttributes);
				} else {
					_styles[tileLayerId] = layerviewer.defineRasterLayer (tileLayerAttributes, 'background-' + tileLayerId);
				}
			});
		},
		
		
		// Function to define a vector layer
		defineVectorLayer: function (tileLayerAttributes)
		{
			// Support native vector tiles format
			if (tileLayerAttributes.vectorTiles) {
				return tileLayerAttributes.vectorTiles;
			}
			
			// Otherwise compile the layer definition
			// #!# Appears to be WIP code
			var layerDefinition = {
				version: 8,
				sources: {
					vector: {
						type: 'vector',
						tiles: [tileLayerAttributes.vectorTiles]
					}
				},
				layers: [{
					id: 'vector-tiles',
					type: 'vector',
					source: 'vector',
					'source-layer': 'vector',
					paint : {'raster-opacity' : 0.7}	// https://stackoverflow.com/a/48016804/180733
				}]
			};
			
			// Return the layer definition
			return layerDefinition;
		},
		
		
		// Function to define a raster layer
		defineRasterLayer: function (tileLayerAttributes, id)
		{
			// Determine if this is a TMS (i.e. {-y}) tilesource; see: https://docs.mapbox.com/mapbox-gl-js/style-spec/#sources-raster-scheme
			var scheme = 'xyz';
			if (tileLayerAttributes.tiles.indexOf('{-y}') != -1) {
				tileLayerAttributes.tiles = tileLayerAttributes.tiles.replace ('{-y}', '{y}');
				scheme = 'tms';
			}
		
			// Expand {s} server to a,b,c if present
			if (tileLayerAttributes.tiles.indexOf('{s}') != -1) {
				tileLayerAttributes.tiles = [
					tileLayerAttributes.tiles.replace ('{s}', 'a'),
					tileLayerAttributes.tiles.replace ('{s}', 'b'),
					tileLayerAttributes.tiles.replace ('{s}', 'c')
				]
			}
			
			// Convert string (without {s}) to array
			if (typeof tileLayerAttributes.tiles === 'string') {
				tileLayerAttributes.tiles = [
					tileLayerAttributes.tiles
				]
			}
			
			// Register the definition
			var sources = {};
			sources[id] = {
				type: 'raster',
				scheme: scheme,
				tiles: tileLayerAttributes.tiles,
				tileSize: (tileLayerAttributes.tileSize ? tileLayerAttributes.tileSize : 256),	// NB Mapbox GL default is 512
				attribution: tileLayerAttributes.attribution
			};
			var layerDefinition = {
				version: 8,
				sources: sources,	// Defined separately so that the id can be specified as a key
				layers: [{
					id: id,
					type: 'raster',
					source: id,
					paint : {'raster-opacity' : 0.7}	// https://stackoverflow.com/a/48016804/180733
				}]
			};
			
			// Return the layer definition
			return layerDefinition;
		},
		
		
		// Buildings layer; see: https://www.mapbox.com/mapbox-gl-js/example/3d-buildings/
		addBuildings: function ()
		{
			// The 'building' layer in the mapbox-streets vector source contains building-height data from OpenStreetMap.
			_map.on('style.load', function() {
				
				// Get the layers in the source style
				var layers = _map.getStyle().layers;
				
				// Ensure the layer has buildings, or end
				if (!layerviewer.styleHasLayer (layers, 'building')) {return;}
				
				// Insert the layer beneath any symbol layer.
				var labelLayerId;
				var i;
				for (i = 0; i < layers.length; i++) {
					if (layers[i].type === 'symbol' && layers[i].layout['text-field']) {
						labelLayerId = layers[i].id;
						break;
					}
				}
				
				// Add the layer
				_map.addLayer ({
					'id': '3d-buildings',
					'source': 'composite',
					'source-layer': 'building',
					'filter': ['==', 'extrude', 'true'],
					'type': 'fill-extrusion',
					'minzoom': 15,
					'paint': {
						'fill-extrusion-color': '#aaa',
						
						// Use an 'interpolate' expression to add a smooth transition effect to the buildings as the user zooms in
						'fill-extrusion-height': [
							"interpolate", ["linear"], ["zoom"],
							15, 0,
							15.05, ["get", "height"]
						],
						'fill-extrusion-base': [
							"interpolate", ["linear"], ["zoom"],
							15, 0,
							15.05, ["get", "min_height"]
						],
						'fill-extrusion-opacity': 0.6
					}
				}, labelLayerId);
			});
		},
		
		
		// Function to test whether a style has a layer
		styleHasLayer: function (layers, layerName)
		{
			// Ensure the layer has buildings, or end
			var i;
			for (i = 0; i < layers.length; i++) {
				if (layers[i].id == layerName) {
					return true;
				}
			}
			
			// Not found
			return false;
		},
		
		
		// 3D terrain; see: https://docs.mapbox.com/mapbox-gl-js/example/add-terrain/
		add3dTerrain: function ()
		{
			// Enable the layer
			_map.on ('load', function () {
				
				// Add the DEM
				_map.addSource ('mapbox-dem', {
					'type': 'raster-dem',
					'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
					'tileSize': 512,
					'maxzoom': 14
				});
				
				// Add the DEM source as a terrain layer with exaggerated height
				_map.setTerrain ({ 'source': 'mapbox-dem', 'exaggeration': 2.5 });
				 
				// Add a sky layer that will show when the map is highly pitched
				_map.addLayer ({
					'id': 'sky',
					'type': 'sky',
					'paint': {
						'sky-type': 'atmosphere',
						'sky-atmosphere-sun': [0.0, 0.0],
						'sky-atmosphere-sun-intensity': 15
					}
				});
			});
		},
		
		
		// Wrapper to enable tilt
		enableTilt: function ()
		{
			// Only enable on a touch device
			if (!_isTouchDevice) {return;}
			
			// Add panning control
			$(_settings.panningControlInsertionElement).prepend (_settings.panningControlElement);
			
			// Handle panning control UI
			layerviewer.controlPanning ();
			
			// Request permission where required on iOS13 and other supporting browsers; see:
			// https://github.com/w3c/deviceorientation/issues/57
			// https://dev.to/li/how-to-requestpermission-for-devicemotion-and-deviceorientation-events-in-ios-13-46g2
			$('body').on ('click', '#panning', function () {
				if (typeof DeviceOrientationEvent.requestPermission === 'function') {
					DeviceOrientationEvent.requestPermission()
						.then ( (permissionState) => {
							if (permissionState === 'granted') {
								layerviewer.implementTilt ();
							}
						})
						.catch (console.error);
				} else {
					layerviewer.implementTilt ();
				}
			});
		},
		
		
		// Externally accessible setter to define a custom action to be run when toggling panning on and off
		// This will replace the default action.
		setCustomPanningIndicatorAction: function (customAction)
		{
			_customPanningIndicatorAction = customAction;
		},


		// Control panning
		controlPanning: function ()
		{
			/*
			// Enable pan on rotate
			// https://github.com/mapbox/mapbox-gl-js/issues/3357
			_map.on ('rotateend', function () {
				_panningEnabled = true;
				layerviewer.setPanningIndicator ();
			});
			*/
			
			// Toggle panning on/off, and update the control
			$('#panning').on ('click', function () {
				
				_panningEnabled = !_panningEnabled;
				layerviewer.setPanningIndicator ();
				
				// Switch to top-down view when not enabled
				if (!_panningEnabled) {
					_map.setPitch (0);
				}
			});
		},
		
		
		// Set text for panning control
		setPanningIndicator: function ()
		{
			// Run custom panning indicator if available
			if (_customPanningIndicatorAction){
				_customPanningIndicatorAction (_panningEnabled);
			} else {
				var text = (_panningEnabled ? 'Panning: enabled' : 'Panning: disabled');
				$('#panning').text (text);
			}
		},
		
		
		// Function to tilt and orientate the map direction automatically based on the phone position
		// Note that the implementation of the W3C spec is inconsistent and is split between "world-orientated" and "game-orientated" implementations; accordingly a library is used
		// https://developer.mozilla.org/en-US/docs/Web/API/Detecting_device_orientation
		// https://developers.google.com/web/fundamentals/native-hardware/device-orientation/
		// https://stackoverflow.com/a/26275869/180733
		// https://www.w3.org/2008/geolocation/wiki/images/e/e0/Device_Orientation_%27alpha%27_Calibration-_Implementation_Status_and_Challenges.pdf
		implementTilt: function ()
		{
			layerviewer.monitorDragging();
			
			// Obtain a new *world-oriented* Full Tilt JS DeviceOrientation Promise
			var promise = FULLTILT.getDeviceOrientation ({ 'type': 'world' });
			
			// Wait for Promise result
			promise.then (function (deviceOrientation) { // Device Orientation Events are supported
				
				// Register a callback to run every time a new deviceorientation event is fired by the browser.
				deviceOrientation.listen (function() {
					
					// Disable if required
					// #!# For efficiency, disabling panning should disable this whole function, using FULLTILT.DeviceOrientation.stop() / .start(), rather than just at the final point here
					if (_panningEnabled) {
						
						// Get the current *screen-adjusted* device orientation angles
						var currentOrientation = deviceOrientation.getScreenAdjustedEuler ();
						
						// Calculate the current compass heading that the user is 'looking at' (in degrees)
						var compassHeading = 360 - currentOrientation.alpha;
						
						// Set the bearing and pitch
						_map.setBearing (compassHeading);
						_map.setPitch (currentOrientation.beta);
					}
				});
				
			}).catch (function (errorMessage) { // Device Orientation Events are not supported
				console.log (errorMessage);
			});
		},


		// Deactivate FULLTILT when map is being dragged, as it blocks panning otherwise
		monitorDragging: function () {
			var isDragging = false;
			var panningWasEnabled = false

			$('#map')
				.tapstart(function () {
					if (_panningEnabled) {
						panningWasEnabled = _panningEnabled;
						_panningEnabled = false;
						isDragging = false;
						layerviewer.setPanningIndicator();
					}
				})
				.tapmove(function () {
					if (panningWasEnabled) {
						isDragging = true;
						layerviewer.setPanningIndicator();
					}
				})
				.tapend(function () {
					if (panningWasEnabled) {
						panningWasEnabled = false;
						var wasDragging = isDragging;
						isDragging = false;
						if (wasDragging) {
							_panningEnabled = true;
							layerviewer.setPanningIndicator();
						}
					}
				});
		},


		// Set geolocation availability
		setGeolocationAvailability: function (boolean) {
			_geolocationAvailable = boolean;
		},


		// Get geolocation availability
		getGeolocationAvailability: function () {
			return _geolocationAvailable;
		},
		

		// Function to ascertain the geolocation status of the brwoser
		// If the class geolocationAvailability flag has been set to false, this function will not attempt to geolocate
		// @param onSuccess: function to be called if geolocation is found
		// @param onError: function to be called if geolocation is unavailable, or an error occurs doing search
		// @param force: boolean determining whether to force find a location (ignore geolocationAvailability flag)
		// @param surpressErrorMessages: boolean determining whether to show user error messages and prompts (i.e. to change privacy settings)
		checkForGeolocationStatus (onSuccess = false, onError = false, force = false, surpressErrorMessages = false)
		{
			// On startup, check the geolocation status of the browser
			function getLocation () 
			{
				var options = {
					enableHighAccuracy: false,
					timeout: 2000,
					maximumAge: Infinity
				};
				  
				if (navigator.geolocation) {
					navigator.geolocation.getCurrentPosition (showPosition, showError, options);
				} else {
					if (!surpressErrorMessages) {
						vex.dialog.alert ('Geolocation is not supported by this browser.');
					}
					layerviewer.setGeolocationAvailability (false);
				}
			}

			function showPosition (position) 
			{
				layerviewer.setGeolocationAvailability (true);
				
				// If there is a success callback
				if (onSuccess){
					onSuccess (position);
				}
			}

			function showError (error) 
			{				
				// If there is an error callback
				if (onError) {
					onError ();
				}
				
				// Display a user message and in certain cases set geolocation availability flag to false
				switch (error.code) {
					case error.PERMISSION_DENIED:
						layerviewer.setGeolocationAvailability (false);
						if (!surpressErrorMessages) {
							vex.dialog.alert ('Please allow the browser to access your location, by refreshing the page or changing privacy settings.');	
						}
						break;
					case error.POSITION_UNAVAILABLE:
						if (!surpressErrorMessages) {
							vex.dialog.alert ('Location information is unavailable.');
						}
						break;
					case error.TIMEOUT:
						if (!surpressErrorMessages) {
							vex.dialog.alert ('The request to get user location timed out.');
						}
						break;
					case error.UNKNOWN_ERROR:
						if (!surpressErrorMessages) {
							vex.dialog.alert ('An unknown error occurred.');
						}
						break;
				}
			}

			// Main entrance to this function
			if (layerviewer.getGeolocationAvailability () || force){
				getLocation ();
			} else {
				return false;
			}
		},

		
		// Function to add a geolocation control and associated events
		// https://www.mapbox.com/mapbox-gl-js/example/locate-user/
		// https://github.com/mapbox/mapbox-gl-js/issues/5464
		geolocation: function (geolocationElementId = false, trackUser = false)
		{
			// Create a tracking control
			_geolocate = new mapboxgl.GeolocateControl ({
				positionOptions: {
					enableHighAccuracy: true,
				},
				fitBoundsOptions: {
					duration: 1500
				},
				trackUserLocation: trackUser
			});
			
			// Add to the map
			_map.addControl (_geolocate, 'top-right');
			
			// Disable tilt on click
			/*
			_geolocate.on ('geolocate', function (event) {
				_panningEnabled = false;
				layerviewer.setPanningIndicator ();
			});
			*/

			// Click handler for new geolocation element
			if (geolocationElementId) {
				$('#' + geolocationElementId).on ('click', function (e){
					e.preventDefault ();
					e.stopPropagation ();
					
					layerviewer.triggerGeolocation ();

					if (_customGeolocationButtonAction){
						_customGeolocationButtonAction ();
					}
				});

				if (_settings.hideDefaultGeolocationControl) {
					// Hide default control
					$('.mapboxgl-ctrl-geolocate').hide ();
				}
			}

			// Listener for setting geolocation availability and setting map bounds
			_map.on ('locationfound', function(e) {
				layerviewer.setGeolocationAvailability (true);
				_map.fitBounds (e.bounds, {duration: 1500});
			});
		},

		
		// Setter for custom geolocation button action
		setCustomGeolocationButtonAction: function (customAction)
		{
			_customGeolocationButtonAction = customAction;
		},

		// Trigger geolocation, accessible externally
		triggerGeolocation: function () 
		{
			// Display error message if we haven't got permission
			if (!layerviewer.getGeolocationAvailability ()) {
				vex.dialog.alert ('Please allow the browser to access your location, by refreshing the page or changing privacy settings.');	
			}

			_geolocate.trigger ();
		},

		
		// Getter for the user's geolocation
		getGeolocation: function () 
		{
			return _geolocate;
		},


		// Function to add style (background layer) switching
		// https://www.mapbox.com/mapbox-gl-js/example/setstyle/
		// https://bl.ocks.org/ryanbaumann/7f9a353d0a1ae898ce4e30f336200483/96bea34be408290c161589dcebe26e8ccfa132d7
		styleSwitcher: function ()
		{
			// Add style switcher UI, unless creating a graphical container in a defined container
			if (!_settings.styleSwitcherGraphical) {
				var containerId = 'styleswitcher';
				layerviewer.createControl (containerId, 'bottom-left', 'expandable');
			}
			
			// Load a style from the cookie, if it exists
			if (Cookies.get ('mapstyle')) {
				var styleId = Cookies.get ('mapstyle');
				var style = _styles[styleId];
				_map.setStyle (style);
				
				// Set the style flag to the new ID
				_currentStyleId = styleId;
				
				// Fire an event; see: https://javascript.info/dispatch-events
				layerviewer.styleChanged ();
			}
			
			// Determine the container path
			var container = _settings.styleSwitcherGraphical || '#' + containerId;
			
			// Construct HTML for style switcher
			var styleSwitcherHtml = '<ul>';
			var name;
			var description;
			var image;
			var labelContent;
			$.each (_styles, function (styleId, style) {
				name = (_settings.tileUrls[styleId].label ? _settings.tileUrls[styleId].label : layerviewer.ucfirst (styleId));
				description = (_settings.tileUrls[styleId].description ? _settings.tileUrls[styleId].description : '');
				image = '/images/maps-' + styleId + '.png';
				if (_settings.styleSwitcherGraphical) {
					labelContent  = '<img src="' + image + '" alt="' + name + '" />';
					labelContent += '<span>' + name + '</span>';
					labelContent += '<p>' + description + '</p>';
				} else {
					labelContent = '<abbr title="' + description + '">' + name + '</abbr>';
				}
				styleSwitcherHtml += '<li><input id="' + styleId + '" type="radio" name="styleswitcher" value="' + styleId + '"' + (styleId == _settings.defaultTileLayer ? ' checked="checked"' : '') + '>';
				styleSwitcherHtml += '<label for="' + styleId + '">' + labelContent + '</label></li>';
			});
			styleSwitcherHtml += '</ul>';
			$(container).append (styleSwitcherHtml);
			
			// Switch to selected style
			function switchStyle (style) {
				var styleId = style.target.id;
				var style = _styles[styleId];
				_map.setStyle (style);

				// Save this style as a cookie
				Cookies.set ('mapstyle', styleId)
				
				// Set the style flag to the new ID
				_currentStyleId = styleId;	
				
				// Fire an event; see: https://javascript.info/dispatch-events
				layerviewer.styleChanged ();
			};
			var inputs = $(container + ' ul input');
			for (var i = 0; i < inputs.length; i++) {
				inputs[i].onclick = switchStyle;
			}

		},
		
		
		// Function to trigger style changed, checking whether it is actually loading; see: https://stackoverflow.com/a/47313389/180733
		// Cannot use _map.on(style.load) directly, as that does not fire when loading a raster after another raster: https://github.com/mapbox/mapbox-gl-js/issues/7579
		styleChanged: function ()
		{
			// Delay for 200 minutes in a loop until the style is loaded; see: https://stackoverflow.com/a/47313389/180733
			if (!_map.isStyleLoaded()) {
				setTimeout (function () {
					layerviewer.styleChanged ();	// Done inside a function to avoid "Maximum Call Stack Size Exceeded"
				}, 250);
				return;
			}
			
			// Fire a custom event that client code can pick up when the style is changed
			var body = document.getElementsByTagName ('body')[0];
			var myEvent = new Event ('style-changed', {'bubbles': true});
			body.dispatchEvent (myEvent);
		},
		
		
		// Function to make first character upper-case; see: https://stackoverflow.com/a/1026087/180733
		ucfirst: function (string)
		{
			if (typeof string !== 'string') {return string;}
			return string.charAt(0).toUpperCase() + string.slice(1);
		},
		
		
		// Function to create a control in a corner
		// See: https://www.mapbox.com/mapbox-gl-js/api/#icontrol
		createControl: function (id, position, className)
		{
			function myControl() { }
			
			myControl.prototype.onAdd = function(_map) {
				this._map = map;
				this._container = document.createElement('div');
				this._container.setAttribute ('id', id);
				this._container.className = 'mapboxgl-ctrl-group mapboxgl-ctrl local';
				if (className) {
					this._container.className += ' ' + className;
				}
				return this._container;
			};
			
			myControl.prototype.onRemove = function () {
				this._container.parentNode.removeChild(this._container);
				this._map = undefined;
			};
			
			// #!# Need to add icon and hover; partial example at: https://github.com/schulzsebastian/mapboxgl-legend/blob/master/index.js
			
			// Instiantiate and add the control
			_map.addControl (new myControl (), position);
		},
		
		
		// Wrapper function to add a geocoder control
		geocoder: function ()
		{
			// Geocoder URL; re-use of settings values is supported, represented as placeholders {%apiBaseUrl}, {%apiKey}, {%autocompleteBbox}
			var geocoderApiUrl = layerviewer.settingsPlaceholderSubstitution (_settings.geocoderApiUrl, ['apiBaseUrl', 'apiKey', 'autocompleteBbox']);
			
			// Attach the autocomplete library behaviour to the location control
			autocomplete.addTo ('.geocoder input', {
				sourceUrl: geocoderApiUrl,
				select: function (event, ui) {
					var bbox = ui.item.feature.properties.bbox.split(',');	// W,S,E,N
					_map.fitBounds(bbox, {maxZoom: 16, duration: 1500});
					
					event.preventDefault();
				}
			});
		},
		
		
		// Helper function to implement settings placeholder substitution in a string
		settingsPlaceholderSubstitution: function (string, supportedPlaceholders)
		{
			// Substitute each placeholder
			var placeholder;
			$.each(supportedPlaceholders, function (index, field) {
				placeholder = '{%' + field + '}';
				string = string.replace(placeholder, _settings[field]);
			});
			
			// Return the modified string
			return string;
		},
		
		
		// Function to enable a data layer
		enableLayer: function (layerId)
		{
			// If the layer is not available, give a dialog
			if ($('#selector li.' + layerId).hasClass('unavailable')) {
				vex.dialog.alert ('Sorry, the ' + $('#selector li.' + layerId + ' a').text().toLowerCase() + ' layer is not available yet.');
				$('nav li.' + layerId + ' input').prop('checked', false);
				return;
			}
			
			// If marker setting is enabled, add handlers
			layerviewer.setMarkerHandling (layerId);
			
			// Get the form parameters on load
			_parameters[layerId] = layerviewer.parseFormValues (layerId);
			
			// Register a dialog box handler for showing additional details if required
			if (_layerConfig[layerId].detailsOverlay) {
				layerviewer.detailsOverlayHandler ('#details', layerId);
			}
			
			// Set the legend
			// #!# Ideally this would appear below the style switcher, but this does not seem to be controllable
			layerviewer.setLegend (layerId, false, false);
			
			// Fetch the data
			layerviewer.getData (layerId, _parameters[layerId]);
			
			// Register to refresh data on map move
			if (!_layerConfig[layerId].static) {	// Unless marked as static, i.e. no change based on map location
				_map.on ('moveend', function (e) {
					layerviewer.getData (layerId, _parameters[layerId]);
				});
			}
			
			// Reload data on style change
			$('body').on ('style-changed', function (event) {
				layerviewer.getData (layerId, _parameters[layerId]);
			});
			
			// Register to show/hide message based on zoom level
			if (_layerConfig[layerId].fullZoom) {
				layerviewer.fullZoomMessage (layerId);
				_map.on ('zoomend', function (e) {
					layerviewer.fullZoomMessage (layerId);
				});
			}
			
			// Reload the data for this layer, using a rescan of the form parameters for the layer, when any change is made
			var rescanPathBase = layerviewer.parseSettingSelector ('formRescanPath', layerId);
			var rescanPath = rescanPathBase + ' :input';
			
			// Also scan drawing area if enabled
			if (_settings.enableDrawing) {
				rescanPath += ', form #drawing :input';
			}
			
			$(document).on ('change', rescanPath, function () {
				_parameters[layerId] = layerviewer.parseFormValues (layerId);
				layerviewer.updateUrl ();
				layerviewer.getData (layerId, _parameters[layerId]);
			});
			$(rescanPathBase + ' :text, ' + rescanPathBase + ' input[type="search"]').on ('input', function() {	// Also include text input changes as-you-type; see: https://gist.github.com/brandonaaskov/1596867
				_parameters[layerId] = layerviewer.parseFormValues (layerId);
				layerviewer.updateUrl ();
				layerviewer.getData (layerId, _parameters[layerId]);
			});
			
			// Register to reload on beta change
			if (_settings.enableBetaSwitch) {
				$('html').on('change', '#beta :checkbox', function () {
					_betaMode = (this.checked);
					layerviewer.getData (layerId, _parameters[layerId]);
				});
			}
		},


		// Function to load IDs from URL parameters
		loadIdFromUrl: function (urlParameters)
		{
			// Read the variables to obtain section and ID
			// #!# This should eventually loop through each section and get all IDs
			var layerId = urlParameters.sections[0];
			if (!layerId) {return;}
			
			var id = urlParameters.id;

			// Do not run if no definition of the functionality
			if (!_layerConfig[layerId].hasOwnProperty ('apiCallId')) {return;}

			// Do not run if there is no URL parameter
			if (!urlParameters.hasOwnProperty ('id')) {return;}
			
			// Start API data parameters and add in the ID
			var apiData = layerviewer.assembleBaseApiData (layerId, true);
			apiData['id'] = id;

			// Determine the API URL to use
			var apiUrl = _layerConfig[layerId].apiCallId.apiCall;
			if (! (/https?:\/\//).test (apiUrl)) {
				apiUrl = _settings.apiBaseUrl + apiUrl;
			}
			
			// Get the data via AJAX
			$.ajax ({
				dataType: 'json',
				type: 'GET',
				url: apiUrl,
				data: apiData,
				success: function (response) 
				{
					// Convert using a callback if required
					if (_layerConfig[layerId].convertData) {
						response = _layerConfig[layerId].convertData (response);
						//console.log(data);
					}
					
					// If there is a popup callback, create the popup
					if (_layerConfig[layerId].hasOwnProperty ('popupCallback')) {
						
						// Generate popupHTML
						var template = _layerConfig[layerId].popupHtml;
						var popupContentHtml = layerviewer.renderDetailsHtml (response.features[0], template, layerId);

						// Display the popup using the callback
						_layerConfig[layerId].popupCallback (popupContentHtml, _layerConfig[layerId].apiCallId.popupAnimation);
					}

					// If there is no popup callback, the popup should be generated with standard HTML
					// #!# It is assumed that the main API call will create a marker, as here we only create the popup
				}
			});
		},

		
		// Marker setting handling
		setMarkerHandling: function (layerId)
		{
			// Run only if enabled
			if (!_layerConfig[layerId].setMarker) {return;}
			
			// Determine the input field
			var inputField = _layerConfig[layerId].setMarker;
			var inputFieldSelector = 'nav #' + layerId + " input[name='" + inputField + "']";
			
			// Get any intial value
			var initialValue = $(inputFieldSelector).val ();
			var lonLat;
			if (initialValue) {
				var position = initialValue.split (',');
				lonLat = {lng: parseFloat(position[0]), lat: parseFloat(position[1])};
			} else {
				lonLat = _map.getCenter ();
			}
			
			// Create the icon
			var iconUrl = layerviewer.getIconUrl (layerId, null);
			var iconSize = layerviewer.getIconSize (layerId, null);
			var icon = layerviewer.createIconDom (iconUrl, iconSize);
			
			// Add the marker to the map, setting it as draggable
			var marker = new mapboxgl.Marker (icon, {draggable: true})
				.setLngLat (lonLat)
				.addTo (_map);
			
			// If the marker is dragged or set to a different location, update the input value
			marker.on ('dragend', function (e) {
				var lngLat = marker.getLngLat ();
				var value = lngLat.lng.toFixed(5) + ',' + lngLat.lat.toFixed(5);
				$(inputFieldSelector)
					.attr ('value', value)		// Using this rather than .val() ensures the console representation is also correct
					.trigger('change');			// Ensure that form rescan gets triggered
			});
		},
		
		
		// Function to create a zoom message for a layer
		// #!# This needs to be reworked to register messages on a per-layer basis, then compile them, and hide the message box if none; currently it operates only on zoom changes
		fullZoomMessage: function (layerId)
		{
			// If the layer is disabled, hide the message
			if (!_layers[layerId]) {
				_message.hide ();
				return;
			}
			
			// Show or hide the message
			if (_map.getZoom () < _layerConfig[layerId].fullZoom) {
				if (_layerConfig[layerId].fullZoomMessage) {
					var message = _layerConfig[layerId].fullZoomMessage;
				} else {
					var message = 'Zoom in to show all ' + layerviewer.layerNameFromId (layerId).toLowerCase() + ' markers - only a selection are shown due to the volume.';
				}
				_message.show (message);
				$('#selector li.' + layerId + ' p.total').hide();
			} else {
				_message.hide ();
				$('#selector li.' + layerId + ' p.total').show();
			}
		},
		
		
		// Function to parse the form values, returning the minimal required set of key/value pairs
		parseFormValues: function (layerId)
		{
			// Start a list of parameters that have a value
			var parameters = {};
			
			// Define the delimiter used for combining groups
			var delimiter = ',';	// Should match the delimiter defined by the API
			
			// Loop through list of inputs (e.g. checkboxes, select, etc.) for the selected layer
			var processing = {};
			var processingStrategy;
			
			var rescanPathBase = layerviewer.parseSettingSelector ('formRescanPath', layerId);
			$(rescanPathBase + ' :input').each(function() {
				
				// Determine the input type
				var tagName = this.tagName.toLowerCase();	// Examples: 'input', 'select'
				var type = $(this).prop('type');			// Examples: 'text', 'checkbox', 'select-one'
				
				// Obtain the element name and value
				var name = $(this).attr('name');
				var value = $(this).val();

				// For checkboxes, degroup them by creating/adding a value that is checked, split by the delimiter
				if (tagName == 'input' && type == 'checkbox') {
					if (this.checked) {
						
						// Get name of this checkbox, stripping any trailing grouping indicator '[]' (e.g. values for 'foo[]' are registered to 'foo')
						name = name.replace(/\[\]$/g, '');
						
						// Determine if there is a post-processing instruction
						processingStrategy = $(this).parent().attr('data-processing');
						if (processingStrategy) {
							processing[name] = processingStrategy;
						}
						
						// Register the value
						if (processingStrategy && (processingStrategy == 'array')) {
							if (!parameters.hasOwnProperty('name')) {parameters[name] = [];}	// Initialise if required
							parameters[name].push (value);
						} else if (parameters[name]) {
							parameters[name] += delimiter + value; // Add value
						} else {
							parameters[name] = value; // Set value
						}
					}
					return;	// Continue to next input
				}
				
				// For range, look for an associated datalist and look up the data values in that
				if (tagName == 'input' && type == 'range') {
					if (this.list) {
						var datalistValue = $('option[value="' + value + '"]', this.list).attr('data-value');
						if (datalistValue) {
							parameters[name] = datalistValue;
							return;	// Continue to next input
						}
					}
				}
				
				// For all other input types, if there is a value, register it
				
				if (value.length > 0) {
					parameters[name] = value;	// Set value
					return;	// Continue to next input
				}
			});
			
			// Handle processing when enabled
			$.each(processing, function (name, processingStrategy) {
				
				// Array strategy: convert values list to '["value1", "value2", ...]'
				if (processingStrategy == 'array') {
					parameters[name] = '["' + parameters[name].join('", "') + '"]';
				}
			});
			
			// If the layer requires that query fields are prefixed with a namespace, prefix each fieldname
			if (_layerConfig[layerId].parameterNamespace) {
				var parametersNamespaced = {};
				$.each(parameters, function (field, value) {
					field = _layerConfig[layerId].parameterNamespace + field;
					parametersNamespaced[field] = value;
				});
				parameters = parametersNamespaced;
			}
			
			// Add in boundary data if drawn; this will override bbox (added later)
			if (_settings.enableDrawing) {
				//var boundary = $('form#data #drawing :input').val();
				var boundary = $('form #drawing :input').val();
				if (boundary) {
					parameters.boundary = boundary;
				}
			}
			
			// Return the parameters
			return parameters;
		},
		
		
		// Function to manipulate the map based on form interactions
		getData: function (layerId, parameters)
		{
			// End if the layer has been disabled (as the event handler from _map.on('moveend', ...) may still be firing)
			if (!_layers[layerId]) {return;}
			
			// If a minimum zoom is specified, end if the zoom is too low
			if (_layerConfig[layerId].minZoom) {
				if (_map.getZoom () < _layerConfig[layerId].minZoom) {return;}
			}
			
			// If the layer is a tile layer rather than an API call, add it and end
			if (_layerConfig[layerId].tileLayer) {
				layerviewer.addTileLayer (_layerConfig[layerId].tileLayer, layerId, parameters);
				return;		// No further action, e.g. API calls
			}
			
			// Start API data parameters
			var apiData = layerviewer.assembleBaseApiData (layerId);
			
			// If required for this layer, reformat a drawn boundary, leaving it unchanged for other layers
			if (parameters.boundary) {
				if (_layerConfig[layerId].hasOwnProperty('apiBoundaryFormat')) {
					parameters.boundary = layerviewer.reformatBoundary (parameters.boundary, _layerConfig[layerId].apiBoundaryFormat);
				}
			}
			
			// Determine which retrieval strategy is needed - bbox (default) or lat/lon
			var retrievalStrategy = _layerConfig[layerId].retrievalStrategy || 'bbox';
			
			// Unless a boundary is drawn in, supply a bbox or lat/lon
			if (!parameters.boundary) {
				
				// For bbox, get the bbox, and reduce the co-ordinate accuracy to avoid over-long URLs
				if (retrievalStrategy == 'bbox') {
					var bbox = _map.getBounds();
					parameters.bbox = bbox.getWest() + ',' + bbox.getSouth() + ',' + bbox.getEast() + ',' + bbox.getNorth();
					parameters.bbox = layerviewer.reduceBboxAccuracy (parameters.bbox);
				}
				
				// For poly, convert map extents to a boundary listing
				if (retrievalStrategy == 'polygon') {	// As lat1,lon1:lat2,lon2:...
					var sw = _map.getBounds().getSouthWest();
					var se = _map.getBounds().getSouthEast();
					var ne = _map.getBounds().getNorthEast();
					var nw = _map.getBounds().getNorthWest();
					parameters.boundary = sw.lat + ',' + sw.lng + ':' + se.lat + ',' + se.lng + ':' + ne.lat + ',' + ne.lng + ':' + nw.lat + ',' + nw.lng + ':' + sw.lat + ',' + sw.lng;
				}
			}
			
			// If required, rename the boundary field, as some APIs use a different fieldname to 'boundary'
			if (parameters.boundary) {
				if (_layerConfig[layerId].apiBoundaryField) {
					var apiBoundaryField = _layerConfig[layerId].apiBoundaryField;
					parameters[apiBoundaryField] = parameters.boundary;
					delete parameters.boundary;
				}
			}
			
			// Send zoom if required
			var sendZoom = layerviewer.glocalVariable ('sendZoom', layerId);
			if (sendZoom) {
				apiData.zoom = parseInt (_map.getZoom ());
			}
			
			// Add in the parameters from the form
			$.each(parameters, function (field, value) {
				apiData[field] = value;
			});
			
			// Add beta flag if enabled
			if (_betaMode) {
				apiData['beta'] = 1;
			}
			
			// If no change (e.g. map move while boundary set, and no other changes), avoid re-requesting data
			// This also means that KML and other static datasets will not get re-requested
			var requestSerialised = $.param(apiData);
			if (_requestCache[layerId]) {
				if (requestSerialised == _requestCache[layerId]) {
					return;
				}
			}
			_requestCache[layerId] = requestSerialised;     // Update cache
			
			// Set/update a cookie containing the full request state
			layerviewer.setStateCookie ();
			
			// Determine the API URL to use
			var apiUrl = _layerConfig[layerId].apiCall;
			if (! (/https?:\/\//).test (apiUrl)) {
				apiUrl = _settings.apiBaseUrl + apiUrl;
			}

			// If there is a region selected in the dropdown, and there is a space for a token in the apiUrl, swap it out
			if (_settings.regionsSubstitutionToken) {
				if (apiUrl.includes(_settings.regionsSubstitutionToken)) {
					var selectedOption = $('#regionswitcher option:selected').val();
					if (!selectedOption) {
						selectedOption = $($('#regionswitcher option')[1]).val()
					}
					var region = (selectedOption == null ? $('#regionswitcher option').first().val() : selectedOption);
					apiUrl = apiUrl.replace(_settings.regionsSubstitutionToken, region);
				}
			}

			// If an outstanding layer request is still active, cancel it
			if (_xhrRequests[layerId] != null) {
				_xhrRequests[layerId].abort();
				_xhrRequests[layerId] = null;
			}
			
			// Start data loading spinner for this layer
			var dataLoadingSpinnerSelector = layerviewer.parseSettingSelector ('dataLoadingSpinnerSelector', layerId);
			$(dataLoadingSpinnerSelector).show();
			
			// Set the data type
			var dataType = (_layerConfig[layerId].dataType ? _layerConfig[layerId].dataType : (layerviewer.browserSupportsCors () ? 'json' : 'jsonp'));		// Fall back to JSON-P for IE9
			
			// KML: use XML for data type
			if (_layerConfig[layerId].dataType && _layerConfig[layerId].dataType == 'kml') {
				dataType = 'xml';
			}
			
			// Fetch data
			_xhrRequests[layerId] = $.ajax({
				url: apiUrl,
				dataType: dataType,
				crossDomain: true,	// Needed for IE<=9; see: https://stackoverflow.com/a/12644252/180733
				data: apiData,
				error: function (jqXHR, error, exception) {
					
					// Deregister from the request registry
					_xhrRequests[layerId] = null;
					
					// Stop data loading spinner for this layer
					$(dataLoadingSpinnerSelector).hide();
					
					/* Commented out as can be obtrusive if an API endpoint is slow/down
					// Catch cases of being unable to access the server, e.g. no internet access; avoids "Unexpected token u in JSON at position 0" errors
					if (jqXHR.status == 0) {
						vex.dialog.alert ('Error: Could not contact the server; perhaps your internet connection is not working?');
						return;
					}
					*/
					
					// Show error, unless deliberately aborted
					if (jqXHR.statusText != 'abort') {
						var data = $.parseJSON(jqXHR.responseText);
						vex.dialog.alert ('Error: ' + data.error);
					}
				},
				success: function (data, textStatus, jqXHR) {
					
					// Deregister from the request registry
					_xhrRequests[layerId] = null;
					
					// Stop data loading spinner for this layer
					$(dataLoadingSpinnerSelector).hide();
					
					// Determine error handling UI mode
					var errorNonModalDialog = layerviewer.glocalVariable ('errorNonModalDialog', layerId);
					
					// Show API-level error if one occured
					// #!# This is done here because the API still returns Status code 200
					if (data.error) {
						layerviewer.removeLayer (layerId);
						var errorMessage = (_layerConfig[layerId].name ? _layerConfig[layerId].name : layerId) + ' layer: ' + data.error;
						if (errorNonModalDialog) {
							_message.show (errorMessage);
						} else {
							vex.dialog.alert (errorMessage);
						}
						return {};
					} else {
						if (errorNonModalDialog) {
							_message.hide ();
						}
					}
					
					// Return the data successfully
					return layerviewer.showCurrentData (layerId, data, apiData, requestSerialised);
				}
			});
		},


		// Function to assemble the base API data by reading the apiCallFixedParameters from the layer definitions
		// @param apiCallId: boolean. The function will attempt to use apiCallId properties instead
		assembleBaseApiData (layerId, apiCallId = false) 
		{
			var apiData = {};
	
			// Add the key, unless disabled
			var sendApiKey = (_layerConfig[layerId].hasOwnProperty ('apiKey') ? _layerConfig[layerId].apiKey : true);
			if (sendApiKey) {
				apiData.key = _settings.apiKey;
			}
	
			// Add fixed parameters if present
			if (apiCallId) {
				if (_layerConfig[layerId].apiCallId.apiFixedParameters) {
					$.each(_layerConfig[layerId].apiCallId.apiFixedParameters, function (field, value) {
						apiData[field] = value;
					});
				}
			} else {
				if (_layerConfig[layerId].apiFixedParameters) {
					$.each(_layerConfig[layerId].apiFixedParameters, function (field, value) {
						apiData[field] = value;
					});
				}
			}
			return apiData;
		},


		// Function to parse a setting for a dynamic layerId
		parseSettingSelector: function (setting, layerId)
		{
			return (_settings[setting].replace ('{layerId}', layerId));
		},
		
		
		// Function to add a tile layer
		addTileLayer: function (tileLayerAttributes, layerId, parameters)
		{
			// Make changes on the tile layer attributes without modifying the original
			tileLayerAttributes = $.extend (true, {}, tileLayerAttributes);
			
			// Substitute placeholder values, e.g. style switcher
			if (parameters) {
				var placeholder;
				$.each (parameters, function (field, value) {
					placeholder = '{%' + field + '}';
					tileLayerAttributes.tiles = tileLayerAttributes.tiles.replace (placeholder, value);
				});
			}
			
			// Construct the ID, namespaced to avoid clashes with background layers, incorporating any parameters to ensure uniqueness
			var id = 'overlay-' + layerId + '-' + jQuery.param (parameters);	// E.g. overlay-abc-style=blue
			
			// Leave current setup in place if already present, with the same style options
			if (_tileOverlayLayer == id) {
				return;
			}
			
			// If an existing layer is already present, e.g. with different style options, remove it
			if (_tileOverlayLayer) {
				layerviewer.removeTileLayer ();
			}
			
			// Register to the cache
			_tileOverlayLayer = id;
			
			// Add to the map
			var layer = layerviewer.defineRasterLayer (tileLayerAttributes, id);
			_map.addSource (id, layer.sources[id]);
			_map.addLayer (layer.layers[0]);
			// #!# Max zoom on layer doesn't actually seem to work
			_map.setLayerZoomRange (id, 0, (tileLayerAttributes.maxZoom ? tileLayerAttributes.maxZoom : 20));
		},
		
		
		// Function to remove a tile layer
		removeTileLayer: function ()
		{
			// Remove the layer and the source, and reset the layer value
			_map.removeLayer (_tileOverlayLayer);
			_map.removeSource (_tileOverlayLayer);
			_tileOverlayLayer = false;
		},
		
		
		// Function to determine the value of a variable settable globally and/or locally
		glocalVariable: function (variableName, layerId)
		{
			// Default to global value
			var value = _settings[variableName];
			
			// Layer-specific setting can override global
			if (_layerConfig[layerId].hasOwnProperty(variableName)) {
				value = _layerConfig[layerId][variableName];
			}
			
			// Return the value
			return value;
		},
		
		
		// Details dialog box handler
		detailsOverlayHandler: function (triggerElement, layerId)
		{
			// Register a handler; note that the HTML in bindPopup doesn't exist yet, so $(triggerElement) can't be used; instead, this listens for click events on the map element which will bubble up from the tooltip, once it's created and someone clicks on it; see: https://stackoverflow.com/questions/13698975/
			$('#map').on('click', triggerElement, function (e) {
				
				// Load the data, using the specified data-id attribute set in the popup HTML dynamically
				var apiUrl = $(this).attr('data-url') + '&key=' + _settings.apiKey;
				$.get(apiUrl, function (data) {
					
					// Access the data
					var feature = data.features[0];
					
					// Render the data into the overlay template
					var template = (_layerConfig[layerId].overlayHtml ? _layerConfig[layerId].overlayHtml : false);
					var html = layerviewer.renderDetailsHtml (feature, template, layerId);
					
					// Create the dialog box and its contents
					var divId = layerId + 'details';
					html = '<div id="' + divId + '">' + html + '</div>';
					vex.dialog.buttons.YES.text = 'Close';
					vex.dialog.alert ({unsafeMessage: html, showCloseButton: true, className: 'vex vex-theme-plain wider'});
				});
				
				e.preventDefault ();
			});
		},
		
		
		// Helper function to enable fallback to JSON-P for older browsers like IE9; see: https://stackoverflow.com/a/1641582
		browserSupportsCors: function ()
		{
			return ('withCredentials' in new XMLHttpRequest ());
		},
		
		
		// Function to reduce co-ordinate accuracy of a bbox string
		reduceBboxAccuracy: function (bbox)
		{
			// Split by comma
			var coordinates = bbox.split(',');
			
			// Reduce accuracy of each coordinate
			coordinates = layerviewer.reduceCoordinateAccuracy (coordinates);
			
			// Recombine
			bbox = coordinates.join(',');
			
			// Return the string
			return bbox;
		},
		
		
		// Function to reduce co-ordinate accuracy to avoid pointlessly long URLs
		reduceCoordinateAccuracy: function (coordinates)
		{
			// Set 0.1m accuracy; see: https://en.wikipedia.org/wiki/Decimal_degrees
			var accuracy = 6;
			
			// Reduce each value
			var i;
			for (i = 0; i < coordinates.length; i++) {
				coordinates[i] = parseFloat(coordinates[i]).toFixed(accuracy);
			}
			
			// Return the modified set
			return coordinates;
		},
		
		
		// Function to reformat the boundary data for a specific layer
		reformatBoundary: function (boundary, format)
		{
			// For latlon-comma-colons format, order as lat,lon pairs, separated by colons
			if (format == 'latlon-comma-colons') {
				var boundaryUnpacked = JSON.parse(boundary);
				var boundaryPoints = [];
				var i;
				for (i = 0; i < boundaryUnpacked.length; i++) {
					boundaryPoints[i] = boundaryUnpacked[i][1] + ',' + boundaryUnpacked[i][0];	// lat,lon
				}
				boundary = boundaryPoints.join(':');
				return boundary;
			}
		},
		
		
		// Function to set/update a cookie containing the full request state
		setStateCookie: function ()
		{
			Cookies.set ('state', _requestCache, {expires: 14});
		},
		
		
		// Function to construct the popup/overlay content HTML
		renderDetailsHtml: function (feature, template /* optional */, layerId)
		{
			// If template is an object, get the HTML
			if (template.popupHtmlSelector) {
				template = $(template.popupHtmlSelector).prop ('outerHTML');
			}
			
			// Use a template if this has been defined in the layer config
			var html;
			if (template) {
				
				// Define a path parser, so that the template can define properties.foo which would obtain feature.properties.foo; see: https://stackoverflow.com/a/22129960
				Object.resolve = function(path, obj) {
					return path.split('.').reduce(function(prev, curr) {
						return (prev ? prev[curr] : undefined);
					}, obj || self);
				};

				// Convert data-src into src
				if (template.indexOf ('data-src') >= 0) {
					var templateElement = $.parseHTML (template);
					var dataSrcElements = $('[data-src]', templateElement);
					
					var elementOriginalStr;
					var templatisedString;
					$.each (dataSrcElements, function (indexInArray, element) { 
						// Make a copy of the string of the original element
						elementOriginalStr = $(element)[0].outerHTML;
						
						// Using jQuery to convert the string into a element, replace the src with data-src
						$(element).prop ('src', $(element).data ('src'));
						
						// Convert this element into a string
						templatisedString = $(element)[0].outerHTML;
						
						// Find the original string in the template, and replace it with the templatised string
						template = template.replace(elementOriginalStr, templatisedString);
					});
				}
				
				// Convert Street View macro
				if (template.indexOf ('{%streetview}') >= 0) {
					template = template.replace ('{%streetview}', layerviewer.streetViewTemplate (feature));
				}
				
				
				// If any property is null, show '?' instead
				$.each (feature.properties, function (key, value) {
					if (value === null) {
						feature.properties[key] = '<span class="unknown">?</span>';
					}
				});
				
				// Replace template placeholders; see: https://stackoverflow.com/a/378000
				template = template.replace (/\{[^{}]+\}/g, function (path){
					var resolvedPlaceholderText = Object.resolve (path.replace(/[{}]+/g, '') , feature);
					if (resolvedPlaceholderText == undefined && _layerConfig[layerId].hasOwnProperty ('emptyPlaceholderText')) {
						return _layerConfig[layerId].emptyPlaceholderText;
					} else {
						return resolvedPlaceholderText;
					}
				});
				
				// Convert OSM edit link macro
				if (template.indexOf ('{%osmeditlink}') >= 0) {
					var centroid = layerviewer.polygonCentroid (feature);
					var zoom = 19;	// #!# Need equivalent of getBoundsZoom, to replace this fixed value
					var osmEditUrl = 'https://www.openstreetmap.org/edit#map=' + zoom + '/' + centroid.lat.toFixed(5) + '/' + centroid.lng.toFixed(5);
					template = template.replace (/{%osmeditlink}/g, '<a class="edit" target="_blank" href="' + osmEditUrl + '">Add in OSM</a>');
				}

				html = template;
				
				// Support 'yearstable' macro, which generates a table of fields for each year, with parameters: first year, last year, fieldslist split by semicolon, labels for each field split by semicolon
				var matches = html.match (/\[macro:yearstable\((.+), (.+), (.+), (.+)\)\]/);
				if (matches) {
					html = html.replace (matches[0], layerviewer.macroYearstable (matches, feature));
				}
				
			// Otherwise, create a simple key/value pair HTML table dynamically
			} else {
				
				html = '<table>';
				var fieldLabel;
				$.each (feature.properties, function (key, value) {
					
					// Skip if value is an array/object
					if ($.type (value) === 'array')  {return; /* i.e. continue */}
					if ($.type (value) === 'object') {return; /* i.e. continue */}
					
					// Skip if icon field
					if (_layerConfig[layerId].iconField) {
						if (key == _layerConfig[layerId].iconField) {return; /* i.e. continue */}
					}
					
					// Key
					fieldLabel = key;
					if (_layerConfig[layerId].popupLabels) {
						if (_layerConfig[layerId].popupLabels[key]) {
							fieldLabel = _layerConfig[layerId].popupLabels[key];
						}
					}
					
					// Value
					if (key == 'thumbnailUrl') {
						if (feature.properties.hasPhoto) {
							html += '<p><img src="' + value + '" /></p>';
						}
					}
					if (value === null) {
						value = '[null]';
					}
					if (typeof value == 'string') {
						value = value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
					}
					
					// Apply number_format (if numeric)
					value = layerviewer.number_format (value);
					
					// Convert TRUE to tick
					if (value == 'TRUE') {value = '&#10004;';}
					
					// If a callback formatter, use that instead, ignoring other changes
					if (_layerConfig[layerId].popupFormatters) {
						if (_layerConfig[layerId].popupFormatters[key]) {
							value = _layerConfig[layerId].popupFormatters[key] (feature.properties[key], feature);
						}
					}

					// Compile the HTML
					html += '<tr><td>' + fieldLabel + ':</td><td><strong>' + value + '</strong></td></tr>';
				});
				html += '</table>';
				
				// Add images if enabled
				if (_layerConfig[layerId].popupImagesField) {
					var popupImagesField = _layerConfig[layerId].popupImagesField;
					if (feature.properties[popupImagesField]) {
						$.each (feature.properties[popupImagesField], function (index, imageUrl) {
							html += '<a href="' + imageUrl + '" target="_blank"><img src="' + imageUrl + '" width="140" /> ';
						});
					}
				}
			}
			
			// Return the content
			return html;
		},
		
		
		// Street View container template
		streetViewTemplate: function (feature)
		{
			// Determine the lon/lat values
			var longitude;
			var latitude;
			switch (feature.geometry.type) {
				case 'Point':
					longitude = feature.geometry.coordinates[0];
					latitude = feature.geometry.coordinates[1];
					break;
				case 'LineString':	// Take the centre-point
					longitude = ((feature.geometry.coordinates[0][0] + feature.geometry.coordinates[1][0]) / 2);
					latitude = ((feature.geometry.coordinates[0][1] + feature.geometry.coordinates[1][1]) / 2);
					break;
				default:
					// Geometry type not yet supported
			}

			// Assemble and return the HTML
			return '<iframe id="streetview" src="/streetview.html?latitude=' + latitude + '&longitude=' + longitude + '">Street View loading &hellip;</div></td></tr></table></div></iframe>';
		},
		
		
		// Helper function to process a macro
		macroYearstable: function (matches, feature)
		{
			// Extract the matches
			var minYear = matches[1];
			var maxYear = matches[2];
			var fields = matches[3].split (';');
			var labels = matches[4].split (';');
			
			// Create a year range
			var years = layerviewer.range (parseInt(minYear), parseInt(maxYear));
			
			// Build the table, starting with the headings, representing the years
			var html = '<table>';
			html += '<tr>';
			html += '<th>Year:</th>';
			$.each (fields, function (fieldIndex, field) {
				html += '<th>' + labels[fieldIndex] + '</th>';
			});
			html += '</tr>';
			
			// Index the fields by field then year index
			var fieldsByYear = [];
			$.each (fields, function (fieldIndex, field) {
				fieldsByYear[field] = feature.properties[field].split(',');
			});
			
			// Add each field's data row
			$.each (years, function (yearIndex, year) {
				html += '<tr>';
				html += '<td><strong>' + year + ':</strong></td>';
				$.each (fields, function (fieldIndex, field) {
					var value = fieldsByYear[field][yearIndex];
					html += '<td>' + (layerviewer.isNumeric (value) ? Number(value).toLocaleString() : value) + '</td>';
				});
				html += '</tr>';
			});
			html += '</table>';
			
			// Return the table HTML
			return html;
		},
		
		
		// Helper function to create a number range; see: https://stackoverflow.com/a/3746752
		range: function (start, end)
		{
			if (start > end) {return [];}	// Prevent accidental infinite iteration
			var range = [];
			for (var i = start; i <= end; i++) {
				range.push(i);
			}
			return range;
		},
		
		
		// Helper function to check if a value is numeric; see: https://stackoverflow.com/a/9716515
		isNumeric: function (value)
		{
			return !isNaN (parseFloat (value)) && isFinite (value);
		},
		
		
		// Function to show the data for a layer
		showCurrentData: function (layerId, data, requestData, requestSerialised)
		{
			// Convert using a callback if required
			if (_layerConfig[layerId].convertData) {
				data = _layerConfig[layerId].convertData (data);
				//console.log(data);
			}
			
			// Convert from flat JSON to GeoJSON if required
			if (_layerConfig[layerId].flatJson) {
				data = GeoJSON.parse(data, {Point: _layerConfig[layerId].flatJson});
				//console.log(data);
			}
			
			// Convert from KML to GeoJSON if required; see: https://github.com/mapbox/togeojson
			if (_layerConfig[layerId].dataType && _layerConfig[layerId].dataType == 'kml') {
				data = toGeoJSON.kml (data);
			}
			
			// Determine line colour field and stops
			var lineColourField = layerviewer.sublayerableConfig ('lineColourField', layerId, requestData);
			var lineColourStops = layerviewer.sublayerableConfig ('lineColourStops', layerId, requestData);
			
			// Fix up data
			// #!# Fix GeoJSON feed upstream
			$.each (data.features, function (index, feature) {
				
				// Ensure data is numeric for the line colour field, to enable correct comparison
				if (lineColourField) {
					data.features[index].properties[lineColourField] = Number (feature.properties[lineColourField]);
				}
				
				// Ensure numeric data is numeric for the line width field, to enable correct comparison
				if (!isNaN (data.features[index].properties[_layerConfig[layerId].lineWidthField])) {
					data.features[index].properties[_layerConfig[layerId].lineWidthField] = Number (feature.properties[_layerConfig[layerId].lineWidthField]);
				}
				
				// Workaround to fix up string "null" to null for popups; see: https://github.com/mapbox/vector-tile-spec/issues/62
				$.each (feature.properties, function (key, value) {
					if (value === 'null') {
						data.features[index].properties[key] = null;
					}
				});
			});
			
			// Update display of total in the menu and export links
			layerviewer.updateTotals (data.features, layerId, requestSerialised);
			
			// Define the popupHtml template
			var popupHtmlTemplate = layerviewer.sublayerableConfig ('popupHtml', layerId, requestData);
			
			// If this layer already exists, update the data for its source
			// The Leaflet.js approach of take down and redraw does not work for MapboxGL.js, as this would require handler destruction which is impractical to achieve; see: https://gis.stackexchange.com/a/252061/58752
			if (_map.getSource (layerId)) {
				
				// Remove any existing markers and popups, neither of which are technically bound to a feature
				layerviewer.removePopups (layerId);
				layerviewer.removeMarkers (layerId);
				
				// Set the new data
				_map.getSource(layerId).setData(data);
				layerviewer.drawIcons (data, layerId, popupHtmlTemplate);
				
				return;
			}
			
			// Set the legend
			var intervals = layerviewer.sublayerableConfig ('intervals', layerId, requestData);
			layerviewer.setLegend (layerId, intervals, lineColourStops);
			
			// Define the geometry types and their default styles
			var defaultStyles = {
				'Point' : {
					// NB Icons, if present, are also drawn over the points
					type: 'circle',
					layout: {},		// Not applicable
					paint: {
						'circle-radius': 8,
						'circle-color': '#007cbf',
					},
				},
				'LineString': {
					type: 'line',
					layout: {
						'line-cap': 'round',
						'line-join': 'round',
					},
					paint: {
						'line-color': ['case', ['has', 'color'], ['get', 'color'], /* fallback: */ '#888'],
						'line-width': 3
					},
				},
				'Polygon': {
					type: 'fill',
					layout: {},		// Not applicable
					paint: {
						'fill-color': '#888',
						'fill-opacity': 0.4
						// NB Outline line width cannot be changed: https://github.com/mapbox/mapbox-gl-js/issues/3018#issuecomment-240381965
					},
				}
			};
			var styles = $.extend (true, {}, defaultStyles);	// Clone
			
			// Set line colour if required; uses original 'stops' method, see: https://github.com/mapbox/mapbox-gl-js/commit/9ac35b1059ed5f9f7798c37700b52259ce9a815d#diff-bde08934db09c688e8b1d2c0a4d2bce0
			if (lineColourField && lineColourStops) {
				styles['LineString']['paint']['line-color'] = layerviewer.stopsExpression (lineColourField, lineColourStops.slice().reverse());	// Reverse the original definition: https://stackoverflow.com/a/30610528/180733
			}
			
			// Set line width if required
			if (_layerConfig[layerId].lineWidthField && _layerConfig[layerId].lineWidthStops) {
				styles['LineString']['paint']['line-width'] = layerviewer.stopsExpression (_layerConfig[layerId].lineWidthField, _layerConfig[layerId].lineWidthStops.slice().reverse());	// Reverse the original definition: https://stackoverflow.com/a/30610528/180733
			}
			
			// Set polygon style if required
			if (_layerConfig[layerId].polygonStyle) {
				switch (_layerConfig[layerId].polygonStyle) {
					
					// Blue boxes with dashed lines, intended for data that is likely to tessellate, e.g. adjacent box grid
					case 'grid':
						styles['Polygon']['paint']['fill-color'] = ['case', ['has', 'colour'], ['get', 'colour'], /* fallback: */ '#03f'];	// See: https://github.com/mapbox/mapbox-gl-js/issues/4079#issuecomment-385196151 and https://docs.mapbox.com/mapbox-gl-js/example/data-driven-lines/
						//styles['Polygon']['paint']['fill-outline-dasharray'] = [5, 5];
						break;
						
					// Red
					case 'red':
						styles['Polygon']['paint']['fill-outline-color'] = 'darkred';
						styles['Polygon']['paint']['fill-color'] = 'red';
						break;
						
					// Green
					case 'green':
						styles['Polygon']['paint']['fill-outline-color'] = 'green';
						styles['Polygon']['paint']['fill-color'] = '#090';
						break;
						
					// Blue
					case 'blue':
						styles['Polygon']['paint']['fill-outline-color'] = 'darkblue';
						styles['Polygon']['paint']['fill-color'] = '#3388ff';
						break;
				}
			}
			
			// Start from global style if supplied
			// E.g. _settings.style = {LineString: {"line-color": "red";} } will get merged in
			if (!$.isEmptyObject (_settings.style)) {
				$.each (_settings.style, function (geometryType, style) {
					styles[geometryType]['paint'] = style;
				});
			}
			
			// Start from default layer style if supplied
			// E.g. layer.style = {LineString: {"line-color": "red";} } will get merged in
			if (!$.isEmptyObject (_layerConfig[layerId].style)) {
				$.each (_layerConfig[layerId].style, function (geometryType, style) {
					styles[geometryType]['paint'] = style;
				});
			}
			
			// For line style, if hover is enabled, override hover style width in definition
			if (_settings.hover || _layerConfig[layerId].hover) {
				styles['LineString']['paint']['line-width'] = ['case', ['boolean', ['feature-state', 'hover'], false], 12, defaultStyles['LineString']['paint']['line-width'] ];
			}
			
			// For a heatmap, ignore all the above styles and define directly; see: https://docs.mapbox.com/help/tutorials/make-a-heatmap-with-mapbox-gl-js/
			if (_layerConfig[layerId].heatmap) {
				styles = {
					'heatmap': {
						type: 'heatmap',
						paint: layerviewer.heatmapStyles (),
						layout: {}
					}
				}
			}
			
			// Define the data source; rather than use addLayer and specify the source directly, we have to split the source addition and the layer addition, as the layers can have different feature types (point/line/polygon), which need different renderers
			_map.addSource (layerId, {
				type: 'geojson',
				generateId: true,	// NB See: https://github.com/mapbox/mapbox-gl-js/issues/8133
				data: data	// NB Potentially amended during style allocation
			});
			
			// Add renderers for each different feature type; see: https://docs.mapbox.com/mapbox-gl-js/example/multiple-geometries/
			var layer;
			$.each (styles, function (geometryType, style) {
				
				// Determine if there is an icon; if so, the marker has been rendered already, so a render icon is not needed
				if (geometryType == 'Point') {
					var iconUrl = layerviewer.getIconUrl (layerId, null);
					if (iconUrl) {return;}
				}
				
				layer = {
					id: layerId + '_' + geometryType.toLowerCase(),
					source: layerId,
					type: style.type,
					paint: style.paint,
					layout: style.layout,
				}
				if (geometryType != 'heatmap') {
					layer.filter = ['==', '$type', geometryType];
				}
				_map.addLayer (layer);
			});
			
			// Show icons, where Points present
			layerviewer.drawIcons (data, layerId, popupHtmlTemplate);
			
			// Set up handlers to give a cursor pointer over each feature; see: https://docs.mapbox.com/mapbox-gl-js/example/hover-styles/
			$.each (styles, function (geometryType, style) {
				_map.on ('mousemove', layerId + '_' + geometryType.toLowerCase(), function () {
					_map.getCanvas().style.cursor = 'pointer';
				});
				_map.on ('mouseleave', layerId + '_' + geometryType.toLowerCase(), function() {
					_map.getCanvas().style.cursor = '';
				});
			});
			
			// For line style, add hover style if enabled; see: https://docs.mapbox.com/mapbox-gl-js/example/hover-styles/
			if (_settings.hover || _layerConfig[layerId].hover) {
				layerviewer.setHoverState (layerId + '_' + 'linestring', layerId);
			}
			
			// Set a popup handler for when a rendered (i.e. non-icon) feature is clicked on; see: https://docs.mapbox.com/mapbox-gl-js/example/popup-on-click/
			var popup;
			var popupFeatureId = null;
			$.each (styles, function (geometryType, style) {
				_map.on ('click', layerId + '_' + geometryType.toLowerCase(), function (e) {
					var feature = e.features[0];
					
					// Remove the popup if already opened and clicked again (implied close)
					if (popupFeatureId) {
						if (popupFeatureId == feature.id) {
							popup.remove ();
							popupFeatureId = null;
							return;		// End here
						}
					}
					popupFeatureId = feature.id;
					
					// Remove any popup alerady existing for this layer, i.e. enforce single item only
					layerviewer.removePopups (layerId);
					
					// Set the location of the click; for a point, look up the feature's actual location
					var coordinates = e.lngLat;	// Actual lat/lon clicked on
					if (geometryType == 'Point') {
						coordinates = feature.geometry.coordinates.slice();	// https://docs.mapbox.com/mapbox-gl-js/example/popup-on-click/
					}
					
					// Workaround to fix up string "null" to null; see: https://github.com/mapbox/vector-tile-spec/issues/62
					$.each (feature.properties, function (key, value) {
						if (value === 'null') {
							feature.properties[key] = null;
						}
					});
					
					// Workaround to deal with nested images property; see: https://github.com/mapbox/mapbox-gl-js/issues/2434
					// The array has become serialised to a string that looks like an array; this parses out the string back to an array
					if (_layerConfig[layerId].popupImagesField) {
						var popupImagesField = _layerConfig[layerId].popupImagesField;
						feature.properties[popupImagesField] = JSON.parse (feature.properties[popupImagesField]);
					}
					
					// Create the popup
					var popupContentHtml = layerviewer.renderDetailsHtml (feature, popupHtmlTemplate, layerId);
					popup = new mapboxgl.Popup ({className: layerId})
						.setLngLat (coordinates)
						.setHTML (popupContentHtml)
						.addTo (_map);
					
					// Register the marker so it can be removed on redraw
					_popups[layerId].push (popup);
				});
			});
		},
		
		
		// Function to update totals in the interface
		updateTotals: function (features, layerId, requestSerialised)
		{
			// Determine the total number of items in the data
			var totalItems = Object.keys(features).length;
			
			// Update the total count in the menu
			$('#selector li.' + layerId + ' p.total').html(totalItems);
			
			// Add the export link button(s) if not currently present
			if ( $('#sections #' + layerId + ' div.export p a').length == 0) {	// i.e. currently unlinked
				$('#sections #' + layerId + ' div.export p').append(' <span></span>');
				$('#sections #' + layerId + ' div.export .csv').wrap('<a href="#"></a>');
				$('#sections #' + layerId + ' div.export .geojson').wrap('<a href="#"></a>');
				$('#sections #' + layerId + ' div.export p').addClass('enabled');
			}
			
			// Enable/update CSV/GeoJSON export link(s), if there are items, and show the count
			var exportUrlCsv = (_layerConfig[layerId].apiCall.match (/^https?:\/\//) ? '' : _settings.apiBaseUrl) + _layerConfig[layerId].apiCall + '?' + requestSerialised + '&format=csv&export=csv';		// Both parameter types supported
			var exportUrlGeojson = (_layerConfig[layerId].apiCall.match (/^https?:\/\//) ? '' : _settings.apiBaseUrl) + _layerConfig[layerId].apiCall.replace(/.json$/, '.geojson') + '?' + requestSerialised;
			$('#sections #' + layerId + ' div.export p span').text ('(' + totalItems + ')');
			$('#sections #' + layerId + ' div.export .csv').parent('a').attr('href', exportUrlCsv);
			$('#sections #' + layerId + ' div.export .geojson').parent('a').attr('href', exportUrlGeojson);
		},
		
		
		// Function to show icons from dynamic URLs in GeoJSON
		// See: https://docs.mapbox.com/mapbox-gl-js/example/custom-marker-icons/
		// See: https://github.com/mapbox/mapbox-gl-js/issues/4736 and https://github.com/mapbox/mapbox-gl-js/issues/822
		// See: https://stackoverflow.com/questions/50411046/add-custom-marker-to-mapbox-map
		// This approach cannot work as it requires loadImage/addImage pairs to be done before map loading: https://gomasuga.com/blog/switch-from-google-maps-to-mapbox
		drawIcons: function (data, layerId, popupHtmlTemplate)
		{
			// Do not use for heatmap
			if (_layerConfig[layerId].heatmap) {return;}
			
			// Remove any existing markers
			layerviewer.removeMarkers (layerId);
			
			// Determine the field in the feature.properties data that specifies the icon to use
			var iconField = _layerConfig[layerId].iconField;
			
			// If marker importance is defined, define the zIndex offset values for each marker type, to be based on the iconField
			if (_layerConfig[layerId].markerImportance) {
				var markerZindexOffsets = [];
				$.each (_layerConfig[layerId].markerImportance, function (index, iconFieldValue) {
					markerZindexOffsets[iconFieldValue] = 0 + (1 * index);	// NB Need to check for overlap with layer switcher
				});
			}
			
			// Loop through each feature
			$.each (data.features, function (index, feature) {
				
				// Consider only points
				if (feature.geometry.type == 'Point') {
					
					// Generate popupHTML
					var popupContentHtml = layerviewer.renderDetailsHtml (feature, popupHtmlTemplate, layerId);

					// Initiate the popup
					var popup = new mapboxgl.Popup ({className: layerId})
						.setHTML (popupContentHtml);
					
					// Determine whether to use a local fixed icon, a local icon set, or an icon field in the data, or no marker at all (if no iconUrl)
					var iconUrl = layerviewer.getIconUrl (layerId, feature);
					
					// End if no icon
					if (!iconUrl) {return false;}	/* i.e. break */
					
					// Determine icon size
					var iconSize = layerviewer.getIconSize (layerId, feature);
					
					// Construct the icon
					var marker = layerviewer.createIconDom (iconUrl, iconSize);
					
					// Set the icon zIndexOffset if required
					if (_layerConfig[layerId].markerImportance) {
						var fieldValue = feature.properties[iconField];
						marker.style.zIndex = markerZindexOffsets[fieldValue];
					}
					
					// Add the marker to the map
					if (marker) {
						marker = new mapboxgl.Marker (marker)
							.setLngLat (feature.geometry.coordinates)
							.setPopup (popup)
							.addTo (_map);
					}
					
					// If we have a callback, store each marker's popupHtml 
					if (_layerConfig[layerId].hasOwnProperty ('popupCallback')) 
					{	
						// Create a marker property __popupHTML, unofficially overloading the published data structure
						var template = _layerConfig[layerId].popupHtml;
						marker.__popupHtml = layerviewer.renderDetailsHtml (feature, template, layerId);

						// Add a custom click listener, which will ignore the default popup action
						marker.getElement().addEventListener('click', function (event) {
							_layerConfig[layerId].popupCallback (marker.__popupHtml);
							
							event.preventDefault ();
							event.stopImmediatePropagation ();
						});
					}
					
					// Register the marker so it can be removed on redraw
					_markers[layerId].push (marker);
				}
			});
		},


		
		// Function to determine the iconUrl for a feature
		getIconUrl: function (layerId, feature /* may be set to null if checking layer-only definitions */)
		{
			// Use layer fixed icon, if set
			if (_layerConfig[layerId].iconUrl) {
				return _layerConfig[layerId].iconUrl;
			}
			
			// Obtain the field in the feature.properties data that specifies the icon to use
			var iconField = _layerConfig[layerId].iconField;
			
			// If there is a feature, use iconField
			if (feature) {
				
				// Select from layer icon set, if set
				if (_layerConfig[layerId].icons) {
					return _layerConfig[layerId].icons[feature.properties[iconField]];
				}
				
				// Else use feature properties directly
				if (feature.properties[iconField]) {
					return feature.properties[iconField];
				}
			} else {
				
				// If no feature, but an iconField is set, an iconUrl can be deemed to exist
				if (iconField) {
					return true;
				}
			}
			
			// Otherwise use global icon, if set
			return _settings.iconUrl;
		},
		
		
		// Determine icon size
		getIconSize: function (layerId, feature /* may be set to null if checking layer-only definitions */)
		{
			// Use the global setting by default
			var iconSize = _settings.iconSize;
			
			// If a layer-specific value is set, use that
			if (_layerConfig[layerId].iconSize) {
				iconSize = _layerConfig[layerId].iconSize;
			}
			
			// Dynamic icon size based on feature properties
			if (feature) {
				if (_layerConfig[layerId].iconSizeField && !$.isEmptyObject (_layerConfig[layerId].iconSizes)) {
					var dataValue = feature.properties[_layerConfig[layerId].iconSizeField];
					if (_layerConfig[layerId].iconSizes.hasOwnProperty (dataValue)) {
						iconSize = _layerConfig[layerId].iconSizes[dataValue];
					}	// Otherwise default to the above, e.g. if property not present or not in the list
				}
			}
			
			// Return the icon size
			return iconSize;
		},
		
		
		// Construct the DOM representation for an icon
		// See: https://docs.mapbox.com/mapbox-gl-js/example/custom-marker-icons/
		// This all has to be done manually in the DOM, unfortunately, as Mapbox GL JS has no support for native dynamically-defined markers
		createIconDom: function (iconUrl, iconSize)
		{
			// Create the marker
			var marker = document.createElement ('img');
			marker.setAttribute ('src', iconUrl);
			marker.className = 'marker';
			marker.style.width = iconSize[0] + 'px';
			marker.style.height = iconSize[1] + 'px';
			marker.style.cursor = 'pointer';
			
			// Return the marker
			return marker;
		},
		
		
		// Function to remove any existing markers for a layer; see: https://docs.mapbox.com/mapbox-gl-js/api/#marker#remove
		removeMarkers: function (layerId)
		{
			if (_markers[layerId]) {
				var totalMarkers = _markers[layerId].length;
				for (var i = 0; i < totalMarkers; i++) {
					_markers[layerId][i].remove ();		// Remove the actual item, not a copy
				};
			}
			_markers[layerId] = [];
		},
		
		
		// Function to remove any existing popups for a layer
		removePopups: function (layerId)
		{
			if (_popups[layerId]) {
				var totalPopups = _popups[layerId].length;
				for (var i = 0; i < totalPopups; i++) {
					_popups[layerId][i].remove ();		// Remove the actual item, not a copy
				};
			}
			_popups[layerId] = [];
		},
		
		
		// Function to render a stops expression; see: https://github.com/mapbox/mapbox-gl-js/commit/9ac35b1059ed5f9f7798c37700b52259ce9a815d#diff-bde08934db09c688e8b1d2c0a4d2bce0
		stopsExpression: function (property, stops)
		{
			// Start the expression
			var expression = [
				'interpolate',
				['linear'],
				['get', property]
			];
			
			// Loop through each pair of the stops
			$.each (stops, function (key, value) {
				expression.push (value[0], value[1]);
			});
			
			// Return the completed expression
			return expression;
		},
		
		
		// Function to define heatmap styles
		heatmapStyles: function ()
		{
			// Define and return the styles
			return {
				
				// Increase weight as diameter breast height increases
				'heatmap-weight': {
					property: 'dbh',
					type: 'exponential',
					stops: [
						[1, 0],
						[62, 1]
					]
				},
				
				/*
				// Increase intensity as zoom level increases
				'heatmap-intensity': {
					stops: [
						[11, 1],
						[15, 3]
					]
				},
				*/
				
				// Assign color values be applied to points depending on their density
				'heatmap-color': [
					'interpolate',
					['linear'],
					['heatmap-density'],
					0, 'rgba(236,222,239,0)',
					0.1, 'blue',
					0.2, 'cyan',
					0.3, 'lime',
					0.6, 'yellow',
					1, 'red'
				],
				
				// Increase radius as zoom increases
				'heatmap-radius': {
					stops: [
						[11, 15],
						[15, 18]
					]
				}
			};
		},
		
		
		// Function to obtain a value from a sublayerable configuration parameter
		sublayerableConfig: function (field, layerId, requestData)
		{
			var value = false;
			if (_layerConfig[layerId][field]) {
				
				// If enabled, select settings dependent on the value of a parameter in the request
				if (_layerConfig[layerId].sublayerParameter) {
					if (requestData[_layerConfig[layerId].sublayerParameter]) {
						var sublayerValue = requestData[_layerConfig[layerId].sublayerParameter];
						
						// Allocate the values
						value = _layerConfig[layerId][field][sublayerValue];
					}
				} else {
					value = _layerConfig[layerId][field];
				}
			}
			
			// Return the value
			return value;
		},
		
		
		// Function to remove a layer
		removeLayer: function (layerId)
		{
			// Remove the layerId from the _requestCache object
			// This is performing a similar task to the requestSerialised block in getData
			if (_requestCache.hasOwnProperty (layerId)) {
				delete _requestCache[layerId];
			}

			// Cache this deletion
			layerviewer.setStateCookie ();

			// If the layer is a tile layer rather than an API call, remove it and end
			if (_layerConfig[layerId].tileLayer) {
				if (_tileOverlayLayer) {
					layerviewer.removeTileLayer ();
				}
				
				// No further action, e.g. API calls
				return;
			}
			
			// Remove any existing markers and popups, neither of which are technically bound to a feature
			layerviewer.removePopups (layerId);
			layerviewer.removeMarkers (layerId);
			
			// Remove the layer(s) and source, checking first to ensure each exists
			var geometryTypes = ['point', 'linestring', 'polygon', 'heatmap'];
			$.each (geometryTypes, function (index, geometryType) {
				var geometryTypeId = layerId + '_' + geometryType;
				if (_map.getLayer (geometryTypeId)) {
					_map.removeLayer (geometryTypeId);
				}
			});
			if (_map.getSource (layerId)) {	// See: https://github.com/mapbox/mapbox-gl-js/issues/4466#issuecomment-288177042
				_map.removeSource (layerId);
			}
			
			// Remove the total count
			$('#selector li.' + layerId + ' p.total').html('');
			
			// Remove/reset the export link, and its count
			if ($('#sections #' + layerId + ' div.export p a').length) {	// i.e. currently linked
				$('#sections #' + layerId + ' div.export p a').contents().unwrap();
				$('#sections #' + layerId + ' div.export p').removeClass('enabled');
				$('#sections #' + layerId + ' div.export span').remove();
			}
		},
		
		
		// Drawing functionality, wrapping mapbox-gl-draw
		drawing: function (targetField, fragmentOnly, defaultValueString)
		{
			// Disable drawing on mobile, as it interferes with popups, pending workaround for https://github.com/mapbox/mapbox-gl-draw/issues/617
			if (_isTouchDevice) {return;}
			
			// Define drawing styles; based on https://github.com/NYCPlanning/labs-factfinder/blob/a617955c652b05dd81308e8d4158cfd76c01d1e2/app/layers/draw-styles.js
			var styles = [
				// Polygon fill
				{
					id: 'gl-draw-polygon-fill',
					type: 'fill',
					paint: {
						'fill-color': '#D20C0C',
						'fill-outline-color': '#D20C0C',
						'fill-opacity': 0.1,
					},
				},
				// Polygon outline stroke
				{
					id: 'gl-draw-polygon-stroke-active',
					type: 'line',
					layout: {
						'line-cap': 'round',
						'line-join': 'round',
					},
					paint: {
						'line-color': '#D96B27',
						'line-dasharray': [0.2, 2],
						'line-width': 4,
					},
				},
				// Vertex point halos
				{
					id: 'gl-draw-polygon-and-line-vertex-halo-active',
					type: 'circle',
					filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point']],
					paint: {
						'circle-radius': 7,
						'circle-color': '#FFF',
					},
				},
				// Vertex points
				{
					id: 'gl-draw-polygon-and-line-vertex-active',
					type: 'circle',
					filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point']],
					paint: {
						'circle-radius': 6,
						'circle-color': '#D96B27',
					},
				}
			];
			
			// See example at: https://docs.mapbox.com/mapbox-gl-js/example/mapbox-gl-draw/
			// See also support for circle drawing (potential future feature) at: https://medium.com/nyc-planning-digital/building-a-custom-draw-mode-for-mapbox-gl-draw-1dab71d143ee
			var draw = new MapboxDraw ({
				displayControlsDefault: false,
				styles: styles
			});
			_map.addControl (draw);
			
			// Register handlers for data creation/update
			_map.on ('draw.create', updateArea);
			_map.on ('draw.update', updateArea);
			
			// Add default value if supplied; currently only polygon type supplied; see: https://github.com/mapbox/mapbox-gl-draw/blob/master/docs/API.md#addgeojson-object--arraystring
			if (defaultValueString) {	// E.g. '[[-0.106355,51.510595],[-0.106709,51.51082],[-0.105666,51.511347],[-0.106355,51.510595]]'
				
				// Convert the string to an array of lat,lon values
				var polygonPoints = JSON.parse (defaultValueString);
				
				// Construct the feature
				var defaultPolygonFeature = {type: 'Polygon', coordinates: [polygonPoints]};
				
				// Add the polygon
				draw.add (defaultPolygonFeature);
			}
			
			// Enable the polygon drawing when the button is clicked
			$('.draw.area').click(function() {
				
				// Clear any existing features - allow only a single polygon at present
				// #!# Remove this when the server-side allows multiple polygons
				draw.deleteAll ();
				
				// Start drawing
				draw.changeMode ('draw_polygon');
			});
			
			// Handle created polygons
			function updateArea (e) {
				
				// Capture the data, which will be GeoJSON
				var geojsonValue = draw.getAll ();
				
				// Reduce coordinate accuracy to 6dp (c. 1m) to avoid over-long URLs
				var coordinates = geojsonValue.features[0].geometry.coordinates[0];
				var accuracy = 6;	// Decimal points; gives 0.1m accuracy; see: https://en.wikipedia.org/wiki/Decimal_degrees
				var i;
				var j;
				for (i = 0; i < coordinates.length; i++) {
					for (j = 0; j < coordinates[i].length; j++) {
						coordinates[i][j] = +coordinates[i][j].toFixed(accuracy);
					}
				}
				geojsonValue.features[0].geometry.coordinates[0] = coordinates;
				
				// If required, send only the coordinates fragment
				if (fragmentOnly) {
					geojsonValue = coordinates;
				}
				
				// Send to receiving input form
				$(targetField).val(JSON.stringify(geojsonValue));
				
				// Trigger jQuery change event, so that .change() behaves as expected for the hidden field; see: https://stackoverflow.com/a/8965804
				// #!# Note that this fires twice for some reason - see notes to the answer in the above URL
				$(targetField).trigger('change');
			};
			
			// Cancel button clears drawn polygon and clears the form value
			$('.edit-clear').click(function() {
				draw.trash ();
				$(targetField).val('');
			
				// Trigger jQuery change event, so that .change() behaves as expected for the hidden field; see: https://stackoverflow.com/a/8965804
				$(targetField).trigger('change');
			});
			
			// Undo button; not yet implemented: https://github.com/mapbox/mapbox-gl-draw/issues/791
			/*
			$('.edit-undo').click(function() {
				//
			});
			*/
		},
		
		
		// Region switcher
		regionSwitcher: function ()
		{
			// End if not enabled
			if (!_settings.regionsFile || !_settings.regionsField) {return;}

			// Load the GeoJSON file
			$.ajax ({
				url: _settings.regionsFile,
				dataType: (layerviewer.browserSupportsCors () ? 'json' : 'jsonp'),		// Fall back to JSON-P for IE9
				error: function (jqXHR, error, exception) {
					vex.dialog.alert ('Error: could not load regions list file.');
				},
				success: function (data, textStatus, jqXHR) {
					
					// Parse the areas to centre-points
					var regions = layerviewer.regionsToList (data);
					
					// Order list
					var names = [];
					$.each (regions, function (name, bounds) {
						names.push (name);
					});
					names.sort();
					
					// Create a droplist
					var html = '<select>';
					html += '<option value="">Move to area:</option>';
					$.each (names, function (index, name) {
						html += '<option value="' + layerviewer.htmlspecialchars (name) + '">' + layerviewer.htmlspecialchars (layerviewer.ucfirst (name)) + '</option>';
					});
					html += '</select>';
					
					// Add to the map
					layerviewer.createControl ('regionswitcher', _settings.regionSwitcherPosition, 'info');
					$('#regionswitcher').html (html);
					
					// Add a handler
					$('#regionswitcher select').change (function () {
						if (this.value) {
							var selectedRegion = this.value;
							_map.fitBounds (regions[selectedRegion]);
						}
						
						// #!# IE bug workaround: need to move the focus to something else, otherwise change works first time but not after that
						if (navigator.appVersion.indexOf('Trident/') !== -1) {
							$('.regionswitcher select').focus();
						}
					});
				}
			});
		},
		
		
		/* private */ regionsToList: function (data)
		{
			// Start a list of regions
			var regions = {};
			
			// Ensure basic GeoJSON structure
			if (!data.type) {return regions;}
			if (data.type != 'FeatureCollection') {return regions;}
			if (!data.features) {return regions;}
			
			// Parse each feature for name and location
			var name;
			var bounds;
			$.each (data.features, function (index, feature) {
				
				// Get the name, or skip if not present
				if (!feature.properties[_settings.regionsField]) {return false;}
				name = feature.properties[_settings.regionsField];
				
				// Get location; see: https://github.com/mapbox/geojson-extent
				bounds = geojsonExtent (feature);
				
				// Register region
				regions[name] = bounds;
			});
			
			// Return the list
			return regions;
		},
		
		
		// Function to make data entity-safe
		htmlspecialchars: function (string)
		{
			if (typeof string !== 'string') {return string;}
			return string.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
		},
		
		
		// Function to make first character upper-case; see: https://stackoverflow.com/a/1026087/180733
		ucfirst: function (string)
		{
			if (typeof string !== 'string') {return string;}
			return string.charAt(0).toUpperCase() + string.slice(1);
		},
		
		
		// Feedback box and handler
		feedbackHandler: function ()
		{			
			$('.wizard.feedback .action.forward').click (function () {
				// Feedback URL; re-use of settings values is supported, represented as placeholders {%apiBaseUrl}, {%apiKey}
				var feedbackApiUrl = layerviewer.settingsPlaceholderSubstitution (_settings.feedbackApiUrl, ['apiBaseUrl', 'apiKey']);
				
				// Locate the form
				var form = $('.feedback form');

				// Send the feedback via AJAX
				$.ajax({
					url: feedbackApiUrl,
					type: form.attr('method'),
					data: form.serialize()
				}).done (function (result) {
					// Detect API error
					if ('error' in result) {
						$('.feedback-submit.error p').text (result.error);
						cyclestreetsui.switchPanel ('.panel', '.feedback-submit.error');
					
					// Normal result; NB result.id is the feedback number
					} else {
						cyclestreetsui.switchPanel ('.panel', '.feedback-submit.submitted');
						$('.feedback-submit.submitted p').text ('Your feedback has been submitted as number ' + result.id + '.');
					}
					
				}).fail (function (failure) {
					if (failure.responseJSON.error) {
						$('.feedback-submit.error p').text (failure.responseJSON.error);
					}
					cyclestreetsui.switchPanel ('.panel', '.feedback-submit.error');
				});
			});
		},
		
		
		// Embed dialog box handler
		embedHandler: function ()
		{
			// Add a click handler for the embed link
			$('a.embed').click (function (e) {
				
				// Construct the embed URL
				var url  = window.location.href;
				url = url.replace ('/#', '/embed/#');
				url += '/' + _currentStyleId;
				
				// Compile the iframe code
				var iframeHtml = '<iframe src="' + url + '" width="100%" height="650" title="CycleStreets Bikedata map" frameborder="0"></iframe>';
				
				// Compile the HTML
				var html  = '<div id="embedbox">';
				html += '<h2>Embed this map in your website</h2>';
				html += '<p>To use this on your website, add the following code to any page:</p>';
				html += '<p><tt>' + layerviewer.htmlspecialchars (iframeHtml) + '</tt></p>';
				html += '<p>The currently-enabled layers, map position and map style are all captured in this link.</p>';
				html += '</div>';
				
				// Create a dialog
				vex.dialog.alert ({unsafeMessage: html, showCloseButton: true, className: 'vex vex-theme-plain'});
				
				// Prevent normal submit
				event.preventDefault ();
			});
		},
		
		
		// Page dialog handler
		pageDialog: function (contentDivId)
		{
			// Read in the HTML
			var html = $('#' + contentDivId).html();
			
			// Create the handler to launch a dialog box
			$('a[href="#' + contentDivId + '"]').click (function (event) {
				vex.dialog.alert ({unsafeMessage: html, showCloseButton: true, className: 'vex vex-theme-plain page'});
				return false;
			});
		},
		
		
		// Number formatting; see: http://phpjs.org/functions/number_format/
		number_format: function (number, decimals, dec_point, thousands_sep)
		{
			// End if not actually numeric
			if (number == null || !isFinite (number)) {
				return number;
			}
			
			// Strip all characters but numerical ones
			number = (number + '').replace(/[^0-9+\-Ee.]/g, '');
			var n = !isFinite(+number) ? 0 : +number;
			var prec = !isFinite(+decimals) ? 0 : Math.abs(decimals);
			var sep = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep;
			var dec = (typeof dec_point === 'undefined') ? '.' : dec_point;
			var s = '';
			var toFixedFix = function (n, prec) {
				var k = Math.pow(10, prec);
				return '' + Math.round(n * k) / k;
			};
			// Fix for IE parseFloat(0.55).toFixed(0) = 0;
			s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.');
			if (s[0].length > 3) {
				s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
			}
			if ((s[1] || '').length < prec) {
				s[1] = s[1] || '';
				s[1] += new Array(prec - s[1].length + 1).join('0');
			}
			return s.join(dec);
		}
	};
} (jQuery));
