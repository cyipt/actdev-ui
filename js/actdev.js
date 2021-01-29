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
		defaultTileLayer: 'mapboxstreets',
		
		// Default layers ticked
		defaultLayers: ['sites', 'studyarea', 'routes', 'buildings'],
		
		// Icon size, set globally for all layers
		iconSize: [38, 42],
		
		// Geolocation position
		geolocationPosition: 'top-left',
		
		// Enable scale bar
		enableScale: true,
		
		// First-run welcome message
		firstRunMessageHtml: '<p>Welcome to Actdev (Alpha UI), Active travel provision and potential in planned and proposed development sites.</p><p><strong>Please choose a region</strong> in the top-right to begin.</p>',
		
		// Region switcher, with areas defined as a GeoJSON file
		regionsFile: 'https://raw.githubusercontent.com/cyipt/actdev/main/data-small/all-sites.geojson',
		regionsField: 'site_name',
		regionsSubstitutionToken: '{site_name}',
		regionSwitcherNullText: 'Go to development',
		
		// Initial view of all regions; will use regionsFile
		initialRegionsView: true,
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
		},

		/*
		desireLinesFew: {
			apiCall: 'https://raw.githubusercontent.com/cyipt/actdev/main/data-small/{site_name}/desire-lines-few.geojson',
			retrievalStrategy: 'none',
			apiKey: false,
			polygonStyle: 'blue',
		},

		desireLinesMany: {
			apiCall: 'https://raw.githubusercontent.com/cyipt/actdev/main/data-small/{site_name}/desire-lines-many.geojson',
			retrievalStrategy: 'none',
			apiKey: false,
			polygonStyle: 'blue',
		},
		*/

		routes: {
			apiCall: 'https://raw.githubusercontent.com/cyipt/actdev/main/data-small/{site_name}/routes-fast.geojson',
			retrievalStrategy: 'none',
			apiKey: false,
			lineColourField: 'all_commute_base',
			lineColourStops: [
				[9999, '#5E2612'],
				[50, '#8B2500'],
				[25, '#CD5B45'],
				[12, '#EE8262'],
			],
			lineWidthField: 'all_commute_base',
			// #!# Not working yet - possibly bug in library
			lineWidthStops: [
				[50, 30],
				[32, 20],
				[10, 10],
				[5, 5],
				[3, 4],
				[0, 3],
			],
		},
		
		studyarea: {
			apiCall: 'https://raw.githubusercontent.com/cyipt/actdev/main/data-small/{site_name}/small-study-area.geojson',
			retrievalStrategy: 'none',
			apiKey: false,
			style: {
				Polygon: {
					"fill-outline-color": "red",
					"fill-color": "rgba(0,0,0, 0.05)",
				}
				
			}
		},

		buildings: {
			apiCall: 'https://raw.githubusercontent.com/cyipt/actdev/main/data-small/{site_name}/buildings_od.geojson',
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
			polygonStyle: 'green',
		},
		
		// https://www.cyclestreets.net/api/v2/mapdata/
		cycleability: {
			apiCall: '/v2/mapdata',
			apiFixedParameters: {
				limit: 400,
				types: 'way',
				wayFields: 'name,ridingSurface,id,cyclableText,quietness,speedMph,speedKmph,pause,color'
			},
			lineColourField: 'quietness',
			lineColourStops: [
				[100, '#1D658B'],
				[90, '#42A3D7'],
				[80, '#3B92B1'],
				[70, '#1F739E'],
				[60, '#66B8E1'],
				[50, '#D9EDF7'],
				[40, '#F8E4E8'],
				[30, '#E292A4'],
				[20, '#D45C76'],
				[10, '#E15D6B'],
				[0, '#D62839']
			],
			sendZoom: true,
			popupHtml:
				  '<table>'
				+ '<tr><td>Name:</td><td><strong>{properties.name}</strong></td></tr>'
				+ '<tr><td>Type:</td><td>{properties.ridingSurface}</td></tr>'
				+ '<tr><td>Cyclable?:</td><td>{properties.cyclableText}</td></tr>'
				+ '<tr><td>Quietness:</td><td><strong>{properties.quietness}%</strong></td></tr>'
				+ '<tr><td>Speed (max achievable):</td><td><strong>{properties.speedMph} mph</strong><br />({properties.speedKmph} km/h)</td></tr>'
				+ '<tr><td>Pause:</td><td>{properties.pause}</td></tr>'
				+ '<tr><td>Full details:</td><td>OSM #<a href="https://www.openstreetmap.org/way/{properties.id}" target="_blank" title="[Link opens in a new window]">{properties.id}</a></td></tr>'
				+ '</table>'
				+ '<p>{%osmeditlink}</p>'
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
		
		planningapplications: {
			apiCall: 'https://www.planit.org.uk/api/applics/geojson',
			apiFixedParameters: {
				pg_sz: 100,
				limit: 100
			},
			apiKey: false,
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
				+ '<p>Size of development: <strong>{properties.app_size}</strong><br />'
				+ 'Type of development: <strong>{properties.app_type}</strong><br />'
				+ 'Status: <strong>{properties.app_state}</strong></p>'
				+ '<p>Reference: <a href="{properties.url}">{properties.uid}</a><br />'
				+ 'Local Authority: {properties.authority_name}<br />'
				+ 'Date: {properties.start_date}</p>'
				+ '<p><a href="{properties.url}"><img src="/images/icons/bullet_go.png" /> <strong>View full details</a></strong></p>'
		},
	};
	
	
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
		}
	};
	
} (jQuery));

