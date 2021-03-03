// Actdev implementation code

/*jslint browser: true, white: true, single: true, for: true */
/*global $, alert, console, window, osm2geo */

var actdev = (function ($) {
	
	'use strict';
	
	// Settings defaults
	var _settings = {
		
		// CycleStreets API; obtain a key at https://www.cyclestreets.net/api/apply/
		apiBaseUrl: 'https://api.cyclestreets.net',
		apiKey: 'YOUR_API_KEY',
		
		// Mapbox API key
		mapboxApiKey: 'YOUR_MAPBOX_API_KEY',
		
		// Initial lat/lon/zoom of map and tile layer
		defaultLocation: {
			latitude: 53.035,
			longitude: -0.763,
			zoom: 5.82
		},
		defaultTileLayer: 'light',
		
		// Default layers ticked
		defaultLayers: ['sites', 'studyarea', 'routenetwork', 'buildings'],
		
		// Icon size, set globally for all layers
		iconSize: [38, 42],
		
		// Geolocation position
		geolocationPosition: false,
		
		// Enable scale bar
		enableScale: true,

		// Custom selector the for selector
		selector: '.selector',

		// Custom data loading spinner selector for layerviewer. For layer specific spinner, should contain layerId
		//dataLoadingSpinnerSelector: 'empty',
		
		// First-run welcome message
		firstRunMessageHtml: '<p>Welcome to Actdev, Active travel provision and potential in planned and proposed development sites.</p><p><strong>Please choose a region</strong> in the top-right to begin.</p>',
		
		// Region switcher, with areas defined as a GeoJSON file
		regionsFile: 'https://raw.githubusercontent.com/cyipt/actdev/main/data-small/all-sites.geojson',
		regionsField: 'site_name',
		regionsNameField: 'full_name',
		regionsSubstitutionToken: '{site_name}',
		regionSwitcherNullText: 'Go to development',
		regionSwitcherCallback: function (selectedRegion) {actdev.fetchRegionData (selectedRegion);}, // This is called when a region is switched, including startup
		regionSwitcherDefaultRegion: 'great-kneighton', // Default region to load if no region saved in cookie
		
		// Initial view of all regions; will use regionsFile
		initialRegionsView: true,
		initialRegionsViewRemovalClick: false,
		initialRegionsViewRemovalZoom: false,
		
		// Feedback API URL; re-use of settings values represented as placeholders {%apiBaseUrl}, {%apiKey}, are supported
		feedbackApiUrl: '{%apiBaseUrl}/v2/feedback.add?key={%apiKey}',
	};
	
	// Layer definitions
	var _layerConfig = {
		
		sites: {
			apiCall: 'https://raw.githubusercontent.com/cyipt/actdev/main/data-small/{site_name}/site.geojson',
			retrievalStrategy: 'none',
			apiKey: false,
			polygonStyle: 'green',
			fieldLabelsCsv: 'https://raw.githubusercontent.com/cyipt/actdev/main/data-small/site-data-dictionary.csv',
			fieldLabelsCsvField: 'names',
			popupHtml: ''
				+ '<h3>Study area: {properties.site_name}</h3>'
				+ '<p>{properties.dwellings_when_complete} dwellings</p>'
				+ '<hr />'
				+ '<p><strong>Percentage who commute by:</strong></p>'
				+ '<table class="commutepercentages">'
				+ '<tr>'
				+ '<th>Walking</th>'
				+ '<th>Cycling</th>'
				+ '<th>Bus</th>'
				+ '<th>Rail</th>'
				+ '<th>Motorbike/other</th>'
				+ '<th>Driving</th>'
				+ '</tr>'
				+ '<tr>'
				+ '<td>{properties.pwalk}</td>'
				+ '<td>{properties.pcycle}</td>'
				+ '<td>{properties.pbus}</td>'
				+ '<td>{properties.prail}</td>'
				+ '<td>{properties.pother}</td>'
				+ '<td>{properties.pdrive}</td>'
				+ '</tr>'
				+ '</table>'
				+ '<p><strong>Average minimum travel time to:</strong></p>'
				+ '<table class="traveltimes">'
				+ '<tr>'
				+ '<th class="by">By:</th>'
				+ '<th>Walking/public transport:</th>'
				+ '<th>Cycling:</th>'
				+ '<th>Car:</th>'
				+ '</tr>'
				+ '<tr><td>Centres of employment:</td><td>{properties.weightedJobsPTt}</td><td>{properties.weightedJobsCyct}</td><td>{properties.weightedJobsCart}</td></tr>'
				+ '<tr><td>Primary schools:</td><td>{properties.PSPTt}</td><td>{properties.PSCyct}</td><td>{properties.PSCart}</td></tr>'
				+ '<tr><td>Secondary schools:</td><td>{properties.SSPTt}</td><td>{properties.SSCyct}</td><td>{properties.SSCart}</td></tr>'
				+ '<tr><td>Further education colleges:</td><td>{properties.FEPTt}</td><td>{properties.FECyct}</td><td>{properties.FECart}</td></tr>'
				+ "<tr><td>Doctors' surgeries:</td><td>{properties.GPPTt}</td><td>{properties.GPCyct}</td><td>{properties.GPCart}</td></tr>"
				+ '<tr><td>Hospitals:</td><td>{properties.HospPTt}</td><td>{properties.HospCyct}</td><td>{properties.HospCart}</td></tr>'
				+ '<tr><td>Food stores:</td><td>{properties.FoodPTt}</td><td>{properties.FoodCyct}</td><td>{properties.FoodCart}</td></tr>'
				+ '<tr><td>Town centres:</td><td>{properties.TownPTt}</td><td>{properties.TownCyct}</td><td>{properties.TownCart}</td></tr>'
				+ '</table>'
		},
		
		routenetwork: {
			apiCall: 'https://raw.githubusercontent.com/cyipt/actdev/main/data-small/{site_name}/rnet-{%type}.geojson',
			retrievalStrategy: 'none',
			apiKey: false,
			lineColourField: 'busyness',
			lineColourStops: [
				[100, '#5e2612'],
				[10, '#8b2500'],
				[5, '#cd5b45'],
				[1, '#ee8262'],
			],
			lineWidthField: 'cycle_base',
			lineWidthStops: [
				[999999, 30],
				[500, 24],
				[200, 20],
				[100, 16],
				[50, 12],
				[25, 8],
				[10, 4],
				[5, 3],
				[3, 2],
				[0, 1],
			],
			legend: 'range',
			fieldLabelsCsv: 'https://raw.githubusercontent.com/cyipt/actdev/main/data-small/rnet-cycle-data-dictionary.csv',
			fieldLabelsCsvField: 'names',
		},
		
		routes: {
			apiCall: 'https://raw.githubusercontent.com/cyipt/actdev/main/data-small/{site_name}/routes-{%type}.geojson',
			retrievalStrategy: 'none',
			apiKey: false,
			lineColourField: 'mean_busyness',
			lineColourStops: [
				[100, '#5e2612'],
				[10, '#8b2500'],
				[5, '#cd5b45'],
				[1, '#ee8262'],
			],
			lineWidthField: 'cycle_base',
			lineWidthStops: [
				[999999, 30],
				[500, 24],
				[200, 20],
				[100, 16],
				[50, 12],
				[25, 8],
				[10, 4],
				[5, 3],
				[3, 2],
				[0, 1],
			],
			legend: 'range',
			name: 'Route network',
			description: 'Number of people, in each line section',
			fieldLabelsCsv: 'https://raw.githubusercontent.com/cyipt/actdev/main/data-small/routes-cycle-data-dictionary.csv',
			fieldLabelsCsvField: 'names',
		},
		
		desirelines: {
			apiCall: 'https://raw.githubusercontent.com/cyipt/actdev/main/data-small/{site_name}/desire-lines-many.geojson',
			retrievalStrategy: 'none',
			apiKey: false,
			lineWidthField: 'cycle_base',
			lineWidthStops: [
				[999999, 30],
				[500, 24],
				[200, 20],
				[100, 16],
				[50, 12],
				[25, 8],
				[10, 4],
				[5, 3],
				[3, 2],
				[0, 1],
			],
			// legend: 'range',
			fieldLabelsCsv: 'https://raw.githubusercontent.com/cyipt/actdev/main/data-small/desire-line-data-dictionary.csv',
			fieldLabelsCsvField: 'names',
		},
		
		accessibility: {
			apiCall: 'https://raw.githubusercontent.com/cyipt/actdev/main/data-small/{site_name}/dartboard.geojson',
			retrievalStrategy: 'none',
			apiKey: false,
			polygonColourField: 'busyness_cycle_base',
			polygonColourStops: [
				[4, '#2fd987'],
				[3, '#aec993'],
				[2, '#fc7753'],
				[1, '#9d0208'],
				[0, '#6a040f'],
			],
			legend: 'range',
			name: 'Accessibility',
			description: 'Cycleability/walkability of the surrounding area',
			fillOpacity: 0.6,
			fitInitial: true
		},
		
		studyarea: {
			apiCall: 'https://raw.githubusercontent.com/cyipt/actdev/main/data-small/{site_name}/small-study-area.geojson',
			retrievalStrategy: 'none',
			apiKey: false,
			popupHtml: ''
				+ '<h3>Study area: {properties.site_name}</h3>'
				+ '<p id="simulation"><a target="_blank" href="/abstreet/?--actdev={properties.site_name}&--cam={%mapposition}">Open travel simulation <br />in A/B Street</a></p>',
			style: {
				Polygon: {
					"fill-outline-color": "red",
					"fill-color": "rgba(0,0,0, 0.05)",
				}
				
			}
		},
		
		buildings: {
			apiCall: 'https://raw.githubusercontent.com/cyipt/actdev/main/data-small/{site_name}/site_buildings.geojson',
			retrievalStrategy: 'none',
			apiKey: false,
			polygonColourField: 'building',
			polygonStyle: {
				'residential': 'green',
				'retail': 'orange',
				'civic': 'purple',
				'commercial': 'red',
				'office': 'gray',
				'warehouse': 'red',
			}
		},
		
		jts: {
			apiCall: 'https://raw.githubusercontent.com/cyipt/actdev/main/data-small/{site_name}/jts-lsoas.geojson',
			retrievalStrategy: 'none',
			apiKey: false,
			popupsRoundingDP: 1,
			polygonColourField: 'weightedJobsCyct',
			fillOpacity: 0.8,
			polygonColourStops: [
				[60, '#0c204d'],
				[50, '#253e6c'],
				[40, '#565c6d'],
				[30, '#7c7b78'],
				[20, '#a89e75'],
				[10, '#d3c165'],
				[0, '#faea47'],
			],
			legend: 'range',
			name: 'Journey time statistics',
			// description: 'Intro text here',
			fieldLabelsCsv: 'https://raw.githubusercontent.com/cyipt/actdev/main/data-small/jts-lsoas-data-dictionary.csv',
			fieldLabelsCsvField: 'names',
			fitInitial: true
		},
		
		// https://www.cyclestreets.net/api/v2/mapdata/
		cycleability: {
			apiCall: '/v2/mapdata',
			apiFixedParameters: {
				limit: 400,
				types: 'way',
				wayFields: 'name,ridingSurface,id,cyclableText,walkableText,quietness,speedMph,speedKmph,pause,color'
			},
			lineColourField: 'quietness',
			lineColourStops: [
				[100, '#1d658b'],
				[90, '#42a3d7'],
				[80, '#3b92b1'],
				[70, '#1f739e'],
				[60, '#66b8e1'],
				[50, '#d9edf7'],
				[40, '#f8e4e8'],
				[30, '#e292a4'],
				[20, '#d45c76'],
				[10, '#e15d6b'],
				[0, '#d62839']
			],
			legend: 'range',
			sendZoom: true,
			popupHtml: ''
				+ '<h3>{properties.name}</h3>'
				+ '<p>Type: {properties.ridingSurface}</p>'
				+ '<p>Full details: OpenStreetMap #<a href="https://www.openstreetmap.org/way/{properties.id}" target="_blank" title="[Link opens in a new window]">{properties.id}</a></p>'
				+ '<h4>&#x1f6b6;&#x1f3fe; Walkability ratings:</h4>'
				+ '<table>'
				+ '<tr><td>Walkable?:</td><td>{properties.walkableText}</td></tr>'
				+ '<tr><td>Quietness:</td><td><em>We regret this data is not yet available. We hope to add it in a future release.</em></td></tr>'
				+ '</table>'
				+ '<h4>&#x1f6b2; Cycleability ratings:</h4>'
				+ '<table>'
				+ '<tr><td>Cyclable?:</td><td>{properties.cyclableText}</td></tr>'
				+ '<tr><td>Quietness:</td><td><strong>{properties.quietness}%</strong></td></tr>'
				+ '<tr><td>Speed - max achievable:</td><td><strong>{properties.speedMph} mph</strong> ({properties.speedKmph} km/h)</td></tr>'
				+ '<tr><td>Pause:</td><td>{properties.pause}</td></tr>'
				+ '</table>'
		},
		
		collisions: {
			apiCall: '/v2/collisions.locations',
			apiFixedParameters: {
				jitter: '1',
				datetime: 'friendly'
			},
			fullZoom: 17,
			sendZoom: true,	// Needed for jitter support
			iconField: 'severity',
			icons: {
				slight:  '/images/icons/icon_collision_slight.svg',
				serious: '/images/icons/icon_collision_serious.svg',
				fatal:   '/images/icons/icon_collision_fatal.svg'
			},
			markerImportance: ['slight', 'serious', 'fatal'],
			popupHtml:
				  '<p><a href="{properties.url}"><img src="/images/icons/bullet_go.png" /> <strong>View full, detailed report</a></strong></p>'
				+ '<p>Reference: <strong>{properties.id}</strong></p>'
				+ '<p>'
				+ 'Date and time: <strong>{properties.datetime}</strong><br />'
				+ 'Severity: <strong>{properties.severity}</strong><br />'
				+ 'Casualties: <strong>{properties.casualties}</strong><br />'
				+ 'No. of Casualties: <strong>{properties.Number_of_Casualties}</strong><br />'
				+ 'No. of Vehicles: <strong>{properties.Number_of_Vehicles}</strong>'
				+ '</p>'
		},
		
		trafficcounts: {
			apiCall: '/v2/trafficcounts.locations',
			apiFixedParameters: {
				groupyears: '1'
			},
			iconUrl: '/images/icons/icon_congestion_bad.svg',
			lineColourField: 'car_pcu',	// #!# Fixme - currently no compiled all_motors_pcu value
			lineColourStops: [
				[40000, '#ff0000'],	// Colour and line values based on GMCC site
				[20000, '#d43131'],
				[10000, '#e27474'],
				[5000, '#f6b879'],
				[2000, '#fce8af'],
				[0, '#61fa61']
			],
			lineWidthField: 'cycle_pcu',	// #!# Fixme - should be Daily cycles
			lineWidthStops: [
				[1000, 10],
				[500, 8],
				[100, 6],
				[10, 4],
				[0, 2],
			],
			popupHtml:	// Popup code thanks to https://hfcyclists.org.uk/wp/wp-content/uploads/2014/02/captions-html.txt
				  '<p>Count Point {properties.id} on <strong>{properties.road}</strong>, a {properties.road_type}<br />'
				+ 'Located in {properties.wardname} in {properties.boroughname}<br />'
				+ '[macro:yearstable({properties.minyear}, {properties.maxyear}, cycles;p2w;cars;buses;lgvs;mgvs;hgvs;all_motors;all_motors_pcu, Cycles;P2W;Cars;Buses;LGVs;MGVs;HGVs;Motors;Motor PCU)]'
				+ '<p><strong>{properties.maxyear} PCU breakdown -</strong> Cycles: {properties.cycle_pcu}, P2W: {properties.p2w_pcu}, Cars: {properties.car_pcu}, Buses: {properties.bus_pcu}, LGVs: {properties.lgv_pcu}, MGVs: {properties.mgv_pcu}, HGVs: {properties.hgv_pcu}</p>'
				+ '</div>'
		},
		
		photos: {
			apiCall: '/v2/photomap.locations',
			apiFixedParameters: {
				tags: 'actdev',
				fields: 'id,captionHtml,hasPhoto,thumbnailUrl,url,username,licenseName,iconUrl,categoryName,metacategoryName,datetime,apiUrl',
				thumbnailsize: 300,
				datetime: 'friendlydate'
			},
			iconField: 'iconUrl',		// icons specified in the field value
			popupHtml:
				  '<p><a href="/photomap/{properties.id}/" id="details" data-url="{properties.apiUrl}&thumbnailsize=800"><img src="{properties.thumbnailUrl}" /></a></p>'
				+ '<div class="scrollable">'
				+ '<strong>{properties.captionHtml}</strong>'
				+ '</div>'
				+ '<table>'
				+ '<tr><td>Date:</td><td>{properties.datetime}</td></tr>'
				+ '<tr><td>By:</td><td>{properties.username}</td></tr>'
				+ '<tr><td>Category:</td><td>{properties.categoryName} &mdash; {properties.metacategoryName}</td></tr>'
				+ '</table>'
				+ '<p><a href="{properties.url}"><img src="/images/icons/bullet_go.png" /> <strong>View full details</a></strong></p>',
			detailsOverlay: 'apiUrl',
			overlayHtml:
				  '<table class="fullimage">'
				+ '<tr>'
				+ '<td>'
				+ '<p><img src="{properties.thumbnailUrl}" /></p>'
				+ '</td>'
				+ '<td>'
				+ '<p>'
				+ '<strong>{properties.caption}</strong>'
				+ '</p>'
				+ '<table>'
				// + '<tr><td>Date:</td><td>{properties.datetime}</td></tr>'
				+ '<tr><td>By:</td><td>{properties.username}</td></tr>'
				// + '<tr><td>Category:</td><td>{properties.categoryName} &mdash; {properties.metacategoryName}</td></tr>'
				+ '</table>'
				+ '{%streetview}'
				+ '</td>'
				+ '</tr>'
				+ '</table>'
		},
		
		planningapplications: {
			apiCall: '/v2/planningapplications.locations',
			apiFixedParameters: {
				limit: 250,
				size: 'Large'
			},
			iconUrl: '/images/icons/signs_neutral.svg',
			iconSizeField: 'app_size',
			iconSizes: {
				'Small': [24, 24],
				'Medium': [36, 36],
				'Large': [50, 50],
			},
			popupHtml:
				  '<p><strong>{properties.description}</strong></p>'
				+ '<p>{properties.address}</p>'
				+ '<p>Size of development: <strong>{properties.size}</strong><br />'
				+ 'Type of development: <strong>{properties.type}</strong><br />'
				+ 'Status: <strong>{properties.state}</strong></p>'
				+ '<p>Reference: <a href="{properties.url}" target="_blank">{properties.id}</a><br />'
				+ 'Local Authority: {properties.area}<br />'
				+ 'Date: {properties.startdate}</p>'
				+ '<p><a href="{properties.url}"><img src="/images/icons/bullet_go.png" /> <strong>View full details</a></strong></p>'
		},
	};	

	var regionData = {}; // This will be overwritten each time a new region's data is fetched
	var allSitesJsonUrl = 'https://raw.githubusercontent.com/cyipt/actdev/main/data-small/all-sites.geojson';
	var allSitesGeoJson = false;
	var currentRegion = '';
	var currentScenario = 'current';
	var modeSplitCsvData = false;
	var _miniMaps = {};			// Handle to each mini map
	var _miniMapLayers = {};	// Handle to each mini map's layer
	var dataMetricsToShow = [
		{
			name: 'percent_cycle_base',
			full_name: 'cycle',
			percentage: true,
			decimal_points: 0,
			go_active: 'percent_cycle_goactive',
			colour_ramp: [
				[35, '#54ad32'],
				[20, '#f0bb40'],
				[0, '#eb3323']
			]
		}, 
		{
			name: 'percent_walk_base',
			full_name: 'walk',
			percentage: true,
			decimal_points: 0,
			go_active: 'percent_walk_goactive',
			colour_ramp: [
				[35, '#54ad32'],
				[20, '#f0bb40'],
				[0, '#eb3323']
			]
		}, 
		{
			name: 'percent_drive_base',
			full_name: 'driving',
			percentage: true,
			decimal_points: 0,
			go_active: 'percent_drive_goactive',
			colour_ramp: [
				[35, '#eb3323'],
				[25, '#f0bb40'],
				[0, '#54ad32']
			]
		}, 
		{
			name: 'site_cycle_circuity',
			full_name: 'cycle circuity',
			percentage: false,
			decimal_points: 2,
			go_active: false,
			colour_ramp: [
				[2, '#eb3323'],
				[1.6, '#f0bb40'],
				[0, '#54ad32']
			]
		}
	]
	
	
	return {
		
	// Public functions
		
		// Main function
		initialise: function (config)
		{
			// Merge the configuration into the settings
			$.each (_settings, function (setting, value) {
				if (config.hasOwnProperty(setting)) {
					_settings[setting] = config[setting];
				}
			});
			
			// Run the layerviewer for these settings and layers
			layerviewer.initialise (_settings, _layerConfig);
			
			// Initialise ACTDEV UI listeners
			actdev.initUi ();
			
			// Listen to scenario being changed
			actdev.listenForScenarioChange ();
			
		},


		// Initialise general UI handlers
		initUi: function ()
		{
			// Add listener for region selector
			$('#selector ul li label').on ('click', function (e) {
				$(e.target).closest ('li').toggleClass ('active');
			})
			
			// Fetch and store all-sites.geojson
			actdev.fetchAllSites ();
		},


		// Fetch all sites
		fetchAllSites: function ()
		{
			fetch(allSitesJsonUrl)
				.then(response => response.json())
				.then(geojson => {
					allSitesGeoJson = geojson;

					// "Boot the rest of the site"
					actdev.secondInitialisation ();
				});
		},


		// A callback, run after the site has downloaded the initial all-sites.geojson. 
		// Exsentially a second initialisation, or a continuation of the first, equivalent of booting first to 16 then to 32 bit modes.
		secondInitialisation: function ()
		{
			// Load the carousel
			actdev.initialiseCarousel ();
			
			// Add handler for scenario switcher
			actdev.showHideElementsBasedOnScenario ();

			// Add handler for A/B Street external link
			actdev.listenForABStreet ();

			// Initialise tooltips
			actdev.initialiseTooltips ();

		},


		// Listener for toggling of the current/goactive segmented control
		listenForScenarioChange: function ()
		{
			$('.ios-segmented-control').change (function () {
				// Save the new scenario
				actdev.setCurrentScenario ();

				// Generate the graphs
				actdev.addBarChart ();
				
				// Refresh the new stats
				actdev.populateSiteStatistics ();

				// Show or hide the right elements
				actdev.showHideElementsBasedOnScenario ();
			});
		},


		// Fetch site photos (siteName)
		fetchSitePhotos: function (siteName)
		{
			// Clear any existing photos
			actdev.clearCarouselPhotos ();
			
			// Build CycleStreets API response
			var photomapApiUrl = 'https://api.cyclestreets.net/v2/photomap.locations?tags=actdev&fields=id,hasPhoto,thumbnailUrl,license,caption&boundary={%boundary}&key={%apiKey}';
			
			// Get the site boundary
			var siteBoundary = actdev.getSiteBoundary (siteName);
			
			if (!siteBoundary) {
				return;
			}
			
			var stringifiedSiteBoundary = JSON.stringify(siteBoundary[siteBoundary.length-1]); // Don't use .pop() here, as it'll mutate the main dictionary
			
			// Replace boundary and api key url tolens
			photomapApiUrl = photomapApiUrl.replace('{%boundary}', stringifiedSiteBoundary);
			photomapApiUrl = photomapApiUrl.replace('{%apiKey}', _settings.apiKey);
			
			// Fetch the photos
			fetch(photomapApiUrl)
				.then(response => response.json())
				.then(photomapResponse => {
					actdev.populateSitePhotos (photomapResponse);
				});
		},


		// Clear all photos in the carousel
		clearCarouselPhotos: function ()
		{
			var cellElements = $('.carousel').flickity('getCellElements');
			$('.carousel').flickity('remove', cellElements);
		},


		// Initialise carousel
		initialiseCarousel: function ()
		{
		
			$('.carousel').flickity({
				cellAlign: 'center',
				contain: true,
				pageDots: false,
				setGallerySize: false
			});
		},


		// Populate the site photo thumnails
		populateSitePhotos: function (photomapGeojson)
		{			
			var thumbnailHtml = `
				<div class="carousel-cell">
				<img src="{%thumbnailUrl}" />
				</div>
				`

			photomapGeojson.features.map(photoObject => {
				$('.carousel').flickity('append', $(thumbnailHtml.replace('{%thumbnailUrl}', photoObject.properties.thumbnailUrl)));
			});

		},


		// Get site boundary. Returns an array with the boundary or false if no matching site was found
		getSiteBoundary: function (siteName) 
		{
			// Exit if no sites stores
			if (!allSitesGeoJson) {
				return;
			};

			// Iterate through sites until we find a match
			var siteObject = false;
			$.each(allSitesGeoJson.features, function (indexInArray, site) { 
				 if (site.properties.site_name == siteName) {
					siteObject = site; 
					return false;
				 }
			});
			
			if (siteObject) {
				return siteObject.geometry.coordinates;
			} else {
				return siteObject;
			}
		},


		// Show/hide elements based on current or goactive scneario
		showHideElementsBasedOnScenario: function ()
		{
			// If we are currently in go-active mode, reveal the changed stats
			if (actdev.getCurrentScenario () === 'goactive') {
				$('.stat h5').css('visibility', 'visible');
			} else {
				$('.stat h5').css('visibility', 'hidden');
			}

			// Hide or show the corresponding mode-split graphic
			if (actdev.getCurrentScenario () === 'goactive') {
				$('.graph-container .current').hide();
				$('.graph-container .goactive').show();
			} else {
				$('.graph-container .current').show();
				$('.graph-container .goactive').hide();
			}
		},


		// Listen for A/B Street link click, and calculate the right map position/zoom level
		listenForABStreet: function ()
		{
			$('#view-simulation').on ('click', function () {
				// Generate the URL
				var simulationUrl = '/abstreet/?--actdev={%site_name}&--cam={%mapposition}'
				simulationUrl = simulationUrl.replace('{%site_name}', currentRegion);
				
				var _map = layerviewer.getMap ();
				var centre = _map.getCenter ();

				var zoom = _map.getZoom ();
				var mapPosition = zoom.toFixed(1) + '/' + centre.lat.toFixed(5) + '/' + centre.lng.toFixed(5);		// Should be the same as the hash, if the hash exists
				simulationUrl = simulationUrl.replace('{%mapposition}', mapPosition);
				
				window.open(simulationUrl);
			});
		},


		// Initialise the tooltips
		initialiseTooltips: function ()
		{
			tippy('#desirelines-tooltip', {
				content: "View desire lines that show the relative amount of travel from the site to work, retail and F&B sites outside of the perimeter",
			});

			tippy('#routenetwork-tooltip', {
				content: "These represent the route network data along the desire lines (likely fast route).",
			});

			tippy('#accessibility-tooltip', {
				content: "A radar graph that shows levels of accessibility to and from the site.",
			});

			tippy('#studyarea-tooltip', {
				content: "The study area.",
			});

			tippy('#accessibility-tooltip', {
				content: 'This graph displays the mode-split transport data of the site. The data is separated into distance bands, and stacked by mode.'
			})
		},


		// Returns current or goactive
		getCurrentScenario: function ()
		{
			return $('input[name=current-scenario]:checked', '#scenario').val ();
		},


		setCurrentScenario: function ()
		{
			currentScenario = actdev.getCurrentScenario ();
		},


		
		// Callback, triggered when a region gets changed. This also triggers at launch
		fetchRegionData: function (selectedRegion)
		{
			const siteMetricsUrl = 'https://raw.githubusercontent.com/cyipt/actdev/main/data-small/{selectedRegion}/in-site-metrics.csv'.replace('{selectedRegion}', selectedRegion);
			
			// Reset the "cached" numbers used when animating stats
			dataMetricsToShow.map (metric => {
				$('.' + metric.name).find ('h3').first ().prop ('number', '')
			});

			// Stream and parse the CSV file
			Papa.parse (siteMetricsUrl, {
				header: true,
				download: true,
				complete: function (fields) {
					
					// Unpack the parsed data object
					var inSiteMetrics = fields.data.shift();

					// Merge in the mode_split objects
					const siteModeSplit = 'https://raw.githubusercontent.com/cyipt/actdev/main/data-small/{selectedRegion}/mode-split.csv'.replace('{selectedRegion}', selectedRegion);
					Papa.parse (siteModeSplit, {
						header: true,
						download: true,
						complete: function (fields) {
							
							// Unpack the parsed data object
							modeSplitCsvData = fields.data;

							// Merge the mode-split data with the in-site-metrics and overwrite the class property
							regionData = {...inSiteMetrics, ...modeSplitCsvData[0]}; // !FIXME this needs to use a different data source, not only 0-3 band
							
							// Populate the page with the fetched data
							actdev.populateRegionData (selectedRegion);
						}
					});
				}
			});
		},
		
		
		// Function to fetch and generate site statistics
		populateRegionData: function (selectedRegion)
		{	
			// Save the current region as class property
			currentRegion = selectedRegion;

			// Generate the graph
			actdev.addBarChart ();
			
			// Get the site photos
			actdev.fetchSitePhotos (selectedRegion);
			
			// Parse and insert region textual information (title, description)
			actdev.parseRegionTextualInformation (selectedRegion);

			// Fetch and insert the graphs
			actdev.insertSiteMetricsGraph (selectedRegion);
			
			// Populate site statistics
			actdev.populateSiteStatistics ();
			
			// Populate mini-maps
			var regionBounds = layerviewer.getRegionBounds ();
			var miniMaps = ['desirelines', 'routes', 'routenetwork', 'accessibility', 'studyarea', 'jts'];
			var id;
			var url;
			var regionWsen = regionBounds[selectedRegion];
			var regionCentre = [ (regionWsen[1] + regionWsen[3])/2, (regionWsen[0] + regionWsen[2])/2 ];	// lat,lon centre
			$.each (miniMaps, function (index, layerId) {
				id = 'map_' + layerId;
				url = _layerConfig[layerId].apiCall;
				url = url.replace ('{site_name}', selectedRegion);
				url = url.replace ('{%type}', 'fast');
				actdev.miniMap (id, url, regionCentre);
			});
		},

		
		// Parse and populate site statistics
		populateSiteStatistics: function ()
		{
			// Map the array
			dataMetricsToShow.map(metric => {
				if (regionData.hasOwnProperty (metric.name)) {
					// Find the h3 for each statistic
					var element = $('.' + metric.name).find ('h3').first ();

					// Populate element with data-current and data-goactive (if applicable)
					element.data('current', regionData[metric.name]);
					var differenceHtml = '';
					if (metric.go_active) {
						element.data('goactive', regionData[metric.go_active]);
						
						// Populate the h5 elements with the amount of change
						var difference = parseFloat(-regionData[metric.name]) + parseFloat(regionData[metric.go_active]);

						// Add a + symbol if the number is above 0
						if (difference > 0) {
							difference = '+' + difference;
						}
						
						// Save the difference into the element data
						element.data('difference', difference)
						
						// Change the actual stat text
						if (difference > 0) {
							differenceHtml = '<i class="fa fa-arrow-up"></i>' + difference;
						} else if (difference < 0) {
							differenceHtml = '<i class="fa fa-arrow-down"></i>' + difference;
						} else {
							differenceHtml = difference;
						}
						
					} else {
						differenceHtml = '<i class="fa"></i>'; // i.e., empty placeholder
					}
					$('.' + metric.name).find ('h5').first ().html(differenceHtml);
					
					// Calculate the decimal factor
					var decimalFactor = metric.decimal_points === 0 ? 1 : Math.pow (10, metric.decimal_points);
					
					// Get the number
					// If this element doesn't have a different go_active number, keep it the same
					if (!metric.go_active) {
						var number = element.data ('current')
					} else {
						var number = (currentScenario == 'current' ? element.data ('current') : element.data('goactive'));
					}

					// If the number is the same, don't animate it
					if (element.prop('number') != number) {
						
						// Calculate the color
						var colour;
						$.each(metric.colour_ramp, function (indexInArray, keyValueColourPair) { 
							if (number > keyValueColourPair[0]) {// i.e. [25, '#ffffff']
								colour = keyValueColourPair[1];
								return false;
							}
						});
						
						// Animate the number
						element.animateNumber ({
							number: number * decimalFactor,
							color: colour,
					
							numberStep: function(now, tween) {
								var flooredNumber = Math.floor(now) / decimalFactor, target = $(tween.elem);
					
								if (metric.decimal_points > 0) {
									// Force decimal places even if they are 0
									flooredNumber = flooredNumber.toFixed(metric.decimal_points);
								}
						
								// Add a percentage sign if necessary
								if (metric.percentage) {
									flooredNumber = flooredNumber + '%';
								}
								
								// Set text
								target.text(flooredNumber);
							}
						});

						// Set the proper label and colours
						$('.' + metric.name).find ('h4').first ().text(metric.full_name).css('color', colour);
						$('.' + metric.name).find ('h5').first ().css('color', colour);
					}	

					// Set the property of number, so the animation begins from this number next time, as opposed to 0
					element.prop('number', number);
				} else {
					// Set the text as N/A
					$('.' + metric.name).find ('h3').text ('N/A');
					
					// Empty the changed stat part
					$('.' + metric.name).find ('h5').empty();
				}
			});
		},

		
		// Fetch and insert site metrics graph 
		insertSiteMetricsGraph: function (selectedRegion)
		{
			//const metricsImgUrl = 'https://github.com/cyipt/actdev/blob/main/data-small/{selectedRegion}/in-site-metrics.png?raw=true'.replace('{selectedRegion}', selectedRegion);
			const modeSplitCurrentUrl = 'https://github.com/cyipt/actdev/blob/main/data-small/{selectedRegion}/mode-split-base.png?raw=true'.replace('{selectedRegion}', selectedRegion);
			const modeSplitGoActiveUrl = 'https://github.com/cyipt/actdev/blob/main/data-small/{selectedRegion}/mode-split-goactive.png?raw=true'.replace('{selectedRegion}', selectedRegion);
			
			// Add the image
			$('.graph-container img.current').attr ('src', modeSplitCurrentUrl);
			$('.graph-container img.goactive').attr ('src', modeSplitGoActiveUrl);
		},
		
		
		// Function to create a mini-map, using Leaflet.js (which is lightweight and will load quickly)
		miniMap: function (id, geojsonUrl, regionCentre)
		{
			// Initialise map if not already present
			if (!_miniMaps[id]) {
				
				// Define URL for raster basemap; available styles include: streets-v11, dark-v10
				var mapboxUrl = 'https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/256/{z}/{x}/{y}?access_token=' + _settings.mapboxApiKey;
				
				// Create the map
				_miniMaps[id] = L.map (id, {attributionControl: false, zoomControl: false}).setView (regionCentre, 9);
				L.tileLayer (mapboxUrl, {
					tileSize: 256,
					maxZoom: 20
				}).addTo (_miniMaps[id] );
				
				// Disable interaction; see: https://gis.stackexchange.com/a/201470/58752
				_miniMaps[id]._handlers.forEach (function (handler) {
					handler.disable ();
				});
				
			// Otherwise move the map location and clear any layers
			} else {
				_miniMaps[id].setView (regionCentre, 10);
				_miniMaps[id].removeLayer (_miniMapLayers[id]);
			}
			
			// Define the styling/behaviour for the GeoJSON layer
			var stylingBehaviour = {
				style: {
					color: '#888',
					weight: 2,
				}
			};
			
			// Add the GeoJSON layer
			_miniMapLayers[id] = new L.geoJson.ajax (geojsonUrl, stylingBehaviour);
			_miniMapLayers[id].addTo (_miniMaps[id]);
		},
		
		
		// Function to fetch and set region information
		parseRegionTextualInformation: function (selectedRegion)
		{
			const allSitesInfoUrl = "https://raw.githubusercontent.com/cyipt/actdev/main/data-small/all-sites.csv";
			
			// Stream and parse the CSV file
			Papa.parse (allSitesInfoUrl, {
				header: true,
				download: true,
				complete: function (fields) {
					
					// Locate the site in the all_sites object
					let site = fields.data.find (o => o.site_name === selectedRegion);
					
					// Set the title text
					$('h1.site-title').animate({'opacity': 0}, 300, function () {
						$(this).text(site.full_name);
					}).animate({'opacity': 1}, 200);
					
					// Start building the descriptive blurb
					var descriptionText = `This development in ${site.main_local_authority} will contain ` + parseInt (site.dwellings_when_complete).toLocaleString() + ` dwellings when complete.`
					
					// Complete the blurb, based on completion status
					var completionText = '';
					switch (site.is_complete) {
						case 'yes':
								completionText = ' The site has been completed.';
								break;
						case 'yes (partly before 2011)':
								completionText = ' The site has been completed, being partly completed before 2011.';
								break;
						case 'mostly':
							completionText = ' The site is mostly complete.';
							break;
						case 'mostly (partly before 2011)':
								completionText = ' The site is mostly complete, and was partly completed before 2011.';
								break;
						case 'partly':
								completionText = ' The site is partly complete.';
								break;
						case 'partly (partly before 2011)':
							completionText = ' The site is partly complete, and was partly completed before 2011.';
							break;
						case 'no':
							completionText = ' The site is not complete.';
							break;
						default:
							break;
					}

					// Add this to the HTML
					$('.site-description').animate({'opacity': 0}, 300, function () {
						$(this).text(descriptionText + completionText);
					}).animate({'opacity': 1}, 200);

					// Change the planning URL or hide if N/A
					if (site.planning_url != 'NA') {
						$('.planning-url').show();
						$('.planning-url').prop('href', site.planning_url);
					} else {
						$('.planning-url').hide();
					}
				}
			})
		},


		addBarChart: function ()
		{	
			actdev.insertChartIntoCanvas (actdev.generateBarChartDataObject(), actdev.generateBarChartOptionsObject('Mode split transport'));
		},	


		// Generate bar chart data
		generateBarChartDataObject: function ()
		{
			
			var labels = modeSplitCsvData.map(distanceBand => distanceBand.distance_band)
			labels.pop() // Remove the spurious "" that pappa parse leaves
			var datasets = [
				{
					label: 'Walk',
					backgroundColor: '#457b9d',
					data: modeSplitCsvData.map(distanceBand => Number.parseFloat(distanceBand.walk_base))
				},
				{
					label: 'Bike',
					backgroundColor: '#90be6d',
					data: modeSplitCsvData.map(distanceBand => Number.parseFloat(distanceBand.cycle_base))
				}, {
					label: 'Other',
					backgroundColor: '#ffd166',
					data: modeSplitCsvData.map(distanceBand => Number.parseFloat(distanceBand.other_base))
				}, {
					label: 'Car',
					backgroundColor: '#fe5f55',
					data: modeSplitCsvData.map(distanceBand => Number.parseFloat(distanceBand.drive_base))
				},
			]

			var data = {
				labels: labels,
				datasets: datasets,
			};

			return data;
		},


		generateBarChartOptionsObject: function (text)
		{
			return {
				title: {
					display: false,
				},
				legend: {
					position: 'right',
					align: 'middle',
					labels: {
						fontColor: 'white',
						fontSize: 13
					}
				},
				tooltips: {
					mode: 'index',
					intersect: false
				},
				responsive: true,
				scales: {
					xAxes: [{
						stacked: true,
						ticks: {
							fontColor: "#ffffff"
						}
					}],
					yAxes: [{
						stacked: true,
						ticks: {
							fontColor: "#ffffff"
						}
					}]
				},
				indexAxis: 'y',
			}
		},

		
		// Insert graph into canvas
		insertChartIntoCanvas: function (barChartData, barChartOptions) 
		{	
			var ctx = document.getElementById('densityChart').getContext('2d');
			window.myBar = new Chart(ctx, {
				type: 'horizontalBar',
				data: barChartData,
				options: barChartOptions
			});
		},
	};
	
} (jQuery));

