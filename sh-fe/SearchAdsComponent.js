app.directive( 'searchAds', [ '$rootScope', 'appConfig', '$compile', '$parse', '$q', '$timeout',
	'$location', '$analytics', '$filter', 'typeaheadParser', 'utility', 'sessionManager',
	'baseRestService', 'COUNTRIES_INDEX', 'FilterEvent', '$document',
	function ( $rootScope, appConfig, $compile, $parse, $q, $timeout, $location, $analytics,
	           $filter, typeaheadParser, utility, sessionManager, baseRestService,
	           COUNTRIES_INDEX, FilterEvent, $document ) {

		// map modes
		var modes = {
			INACTIVE: 'inactive',
			ACTIVE: 'active',
			SELECTED: 'selected'
		};

		function link ( scope, element, attrs ) {

			// === SUPPORTED ATTRIBUTES (OPTIONS) WITH DEFAULT VALUES === //

			scope.options = {
				suggestionString: $filter( 'i18n' )( '_AllAds_' ),
				placeholder: $filter( 'i18n' )( '_SearchAds_' ),
				limit: 100,
				minLength: 1,
				waitMs: 250
			};

			angular.forEach( scope.options, function ( option, key ) {
				if ( attrs[ key ] )
					scope.options[ key ] = attrs[ key ] || scope.options[ key ];
			} );

			// === INTERNAL VARIABLES === //

			var brs = new baseRestService();
			var requestExtraParameters = {
				withCampaigns: true
			};
			var modelCtrl = element.find( '#typeahead-ads' ).controller( 'ngModel' );
			var timeoutPromise;

			scope.mode = modes.INACTIVE;
			scope.query = '';
			scope.isOpened = false;
			scope.requestsCounter = 0;

			function resetMatches () {
				scope.groups = {};
				scope.activeIdx = -1;
			}

			resetMatches();

			scope.getData = function ( pattern ) {
				return brs.getAutoComplete( 'ads', pattern, scope.options.limit, requestExtraParameters ).then( function ( response ) {
					console.info( '%c Typeahead, request response: ', 'color: green', 'ads', response );
					return response.data[ 'ads' ];
				} );
			};

			function groupByCampaignId ( matches ) {
				scope.groups = {};

				scope.activeIdx = 1;  // 0 is the default
				scope.groups.length = 1;

				angular.forEach( matches, function ( match ) {
					match.campaign = match.campaign || { name: $filter( 'i18n' )( '_NotLinkedToCampaign_' ) };

					match.campaign.advertiser = match.advertiser;

					var id = match.campaign && match.campaign.id || -1;

					scope.groups[ id ] = scope.groups[ id ] || [];
					scope.groups[ id ].push( match );
				} );

			}

			function getMatches ( inputValue, requestIndex ) {
				scope.isLoading = true;
				scope.getData( inputValue ).then( function ( matches ) {
					// it might happen that several async queries were in progress if a user were typing fast,
					// but we are interested only in responses that correspond to the current view value
					if ( requestIndex === scope.requestsCounter ) {
						if ( matches.length > 0 ) {
							groupByCampaignId( matches );
						} else {
							resetMatches();
						}
					}
					scope.isLoading = false;
				}, function () {
					resetMatches();
					scope.isLoading = false;
				} );
			}

			scope.$watch( 'query', function ( newValue ) {
				var query = ( newValue && newValue.length >= scope.options.minLength ) ? newValue : '';

				if ( scope.options.waitMs > 0 ) {
					if ( timeoutPromise ) $timeout.cancel( timeoutPromise );
					timeoutPromise = $timeout( function () {
						getMatches( query, ++scope.requestsCounter );
					}, scope.options.waitMs );
				} else {
					getMatches( query, ++scope.requestsCounter );
				}
			} );

			// === Selecting partner from menu === //
			$rootScope.$on( FilterEvent.FILTER_PARTNER_SELECTED, function ( event, partner, serviceType ) {
				var queryString = $location.search();
				if ( scope.$parent &&
				     $location.path() !== '/custom-reports-ranking-master' &&
				     $location.path() !== '/custom-reports' )
				{
					if ( queryString.hasOwnProperty( 'adName' ) )
						scope.$parent.placeholder = queryString.adName;
					else if ( queryString.hasOwnProperty( 'campaignName' ) )
						scope.$parent.placeholder = queryString.campaignName;
				}
				requestExtraParameters.serviceType = serviceType;
				requestExtraParameters.partner = partner;
			} );

			// Eventing the selected value so that the controllers can update and re-request Insight
			function eventSelectedValue ( model ) {
				model = model || {};

				var filterValue = {
					adId: model.filter && model.filter.split( '~' )[ 1 ] || undefined
				};
				if ( !model.filter ) filterValue.campaignId = undefined;

				// add search params to url
				if ( !scope.disableShareUrl ) {
					if ( model.filter ) {
						$location.search( 'adId', filterValue[ 'adId' ] );
						if ( model.title ) {
							$location.search( 'adName', model.title );
						}
					}
					else {
						$location.search( 'adName', null );
						$location.search( 'adId', null );
					}
					$location.search( 'campaignName', null );
					$location.search( 'campaignId', null );

					if ( filterValue.startDate )
						$location.search( 'startDate', filterValue.startDate );
					if ( filterValue.endDate )
						$location.search( 'endDate', filterValue.endDate );
				}

				scope.$parent.$emit( FilterEvent.FILTERS_UPDATE_MODEL, filterValue );

				filterValue.adTitle = model.title;
				scope.$parent.$emit( 'ADS_FILTER_SELECTED', filterValue );
			}

			function analyticsEvent ( label ) {
				$analytics.eventTrack( 'ads Filter Selection', {
					category: $location.$$path.slice( 1 ),
					label: label
				} );
			}

			scope.selectGroup = function ( campaign ) {
				modelCtrl.$setValidity( 'editable', true );

				scope.query = campaign.name;
				scope.mode = modes.SELECTED;
				scope.isOpened = false;

				// Reset $location.search
				$location.search( 'adName', null );
				$location.search( 'adId', null );
				$location.search( 'campaignId', campaign.publicId );
				$location.search( 'campaignName', campaign.name );

				var filterValue = {
					campaignId: campaign.publicId,
					adId: undefined
				};
				scope.$parent.$emit( FilterEvent.FILTERS_UPDATE_MODEL, filterValue );
			};

			scope.selectItem = function ( groupIdx, activeIdx ) {
				var item = scope.groups[ groupIdx ][ activeIdx ];

				modelCtrl.$setValidity( 'editable', true );

				scope.query = item.title;
				scope.mode = modes.SELECTED;
				scope.isOpened = false;

				eventSelectedValue( item );
				analyticsEvent( item.title );
			};

			scope.selectAllAds = function () {
				scope.mode = modes.SELECTED;
				scope.isOpened = false;
				scope.query = '';

				eventSelectedValue( { label: scope.options.suggestionString } );
				analyticsEvent( '' );
			};

			// click to determine if clicked in the popup or outside
			var clickHandler = function ( event ) {
				// click outside
				if ( event.target === element[ 0 ] ||
				     utility.elementMatches( event.target, element.find( event.target.tagName ) ) )
				{
					scope.mode = modes.ACTIVE;
					scope.isOpened = true;
				} else {
					if ( scope.mode !== modes.SELECTED ) scope.mode = modes.INACTIVE;
					scope.isOpened = false;
				}
				scope.$digest();
			};

			$document.bind( 'click', clickHandler );

			scope.$on( '$destroy', function () {
				$document.unbind( 'click', clickHandler );
			} );
		}

		return {
			restrict: 'E',
			replace: true,
			scope: {
				filterIndex: '@filterIndex',
				suggestionString: '@suggestionString',
				placeholder: '@placeholder',
				limit: '@limit',
				minLength: '@minLength',
				waitMs: '@waitMs',
				disabledFilter: '=?disabled',
				disableShareUrl: '=?disableShareUrl'
			},
			templateUrl: appConfig.templates + 'components/autocomplete/search-ads.html',
			link: link
		};

	}

] );
