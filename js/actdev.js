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
			apiCall: 'https://raw.githubusercontent.com/cyipt/actdev/main/data-small/{site_name}/dartboard-1-3-6km.geojson',
			retrievalStrategy: 'none',
			apiKey: false,
			polygonColourField: 'busyness',
			polygonColourStops: [
				[0.8, '#2fd987'],
				[0.6, '#aec993'],
				[0.4, '#fc7753'],
				[0.2, '#9d0208'],
				[0, '#6a040f'],
			],
			legend: 'range',
			fillOpacity: 0.6
		},
		
		studyarea: {
			apiCall: 'https://raw.githubusercontent.com/cyipt/actdev/main/data-small/{site_name}/small-study-area.geojson',
			retrievalStrategy: 'none',
			apiKey: false,
			popupHtml: ''
				+ '<h3>Study area: {properties.site_name}</h3>'
				+ '<p id="simulation"><a target="_blank" href="/abstreet/?--actdev={properties.site_name}">Open travel simulation <br />in A/B Street</a></p>',
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
			fieldLabelsCsv: 'https://raw.githubusercontent.com/cyipt/actdev/main/data-small/jts-lsoas-data-dictionary.csv',
			fieldLabelsCsvField: 'names'
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
		
		planningapplications: {
			apiCall: '/v2/planningapplications.locations',
			apiFixedParameters: {
				limit: 250
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

