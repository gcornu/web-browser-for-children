//define options to be used for pager
var pagerOptions = {

	// target the pager markup - see the HTML block below
	container: $(".ts-pager"),

	// target the pager page select dropdown - choose a page
	cssGoto  : ".pagenum",
	cssNext: '.next', // next page arrow
	cssPrev: '.prev', // previous page arrow
	cssFirst: '.first', // go to first page arrow
	cssLast: '.last', // go to last page arrow

	// remove rows from the table to speed up the sort of large tables.
	// setting this to false, only hides the non-visible rows; needed if you plan to add/remove rows with the pager enabled.
	removeRows: false,

	// output string - default is '{page}/{totalPages}';
	// possible variables: {page}, {totalPages}, {filteredPages}, {startRow}, {endRow}, {filteredRows} and {totalRows}
	output: '{startRow} - {endRow} / {filteredRows} ({totalRows})'

};

$(function () {
	$('#table-history .pagesize').attr('title', self.options.page_size_title);
	$('#table-history .pagenum').attr('title', self.options.page_num_title);

	$('#clear_login_log, #clear_history_log, #clear_time_log').click(function () {
		var localThis = this;
		var logType = $(localThis).attr('id').split('_')[1];
		self.port.emit('clear_log', logType);
	});
	
	// ------ jQuery Tablesorter plugin------------
	$.extend($.tablesorter.themes.bootstrap, {
		// these classes are added to the table. To see other table classes available,
		// look here: http://twitter.github.com/bootstrap/base-css.html#tables
		table      : 'table table-bordered',
		caption    : 'caption',
		header     : 'bootstrap-header', // give the header a gradient background
		footerRow  : '',
		footerCells: '',
		icons      : '', // add "icon-white" to make them white; this icon class is added to the <i> in the header
		sortNone   : 'bootstrap-icon-unsorted',
		sortAsc    : 'icon-chevron-up glyphicon glyphicon-chevron-up',     // includes classes for Bootstrap v2 & v3
		sortDesc   : 'icon-chevron-down glyphicon glyphicon-chevron-down', // includes classes for Bootstrap v2 & v3
		active     : '', // applied when column is sorted
		hover      : '', // use custom css here - bootstrap class may not override it
		filterRow  : 'form-control', // filter row class
		even       : '', // odd row zebra striping
		odd        : ''  // even row zebra striping
	});
	// call the tablesorter plugin and apply the uitheme widget
	$("#table-history").tablesorter({
		// this will apply the bootstrap theme if "uitheme" widget is included
		// the widgetOptions.uitheme is no longer required to be set
		theme : "bootstrap",

		widthFixed: true,

		headerTemplate : '{content} {icon}', // new in v2.7. Needed to add the bootstrap icon!

		// widget code contained in the jquery.tablesorter.widgets.js file
		// use the zebra stripe widget if you plan on hiding any rows (filter widget)
		widgets : [ "uitheme", "filter", "zebra" ],

		widgetOptions : {
			// using the default zebra striping class name, so it actually isn't included in the theme variable above
			// this is ONLY needed for bootstrap theming if you are using the filter widget, because rows are hidden
			zebra : ["even", "odd"],

			// reset filters button
			filter_reset : ".reset"

			// set the uitheme widget to use the bootstrap theme class names
			// this is no longer required, if theme is set
			// ,uitheme : "bootstrap"
		}
	}).tablesorterPager(pagerOptions);
});

// external events listeners
self.port.on('login_log_read', function (events) {
	fillLoginReport(events);
});

self.port.on('history_log_read', function (visits) {
	fillHistoryReport(visits);
});

self.port.on('time_log_read', function (times) {
	fillTimeReport(times);
});

/**
 * Fill login report panel
 *
 * @param {string} events of the login report
 */
function fillLoginReport(events) {
	$('#login-pane #events').empty();
	
	if(events.length !== 1 || events[0] !== '') {
		$('#login-pane #no-event').hide();
		events.forEach(function (eventElement) {
			if(eventElement) {
				var eventSplit = eventElement.split(' : ');
				var timestamp = $('<b>', {'text': eventSplit[0] + ' : '});
				var br = $('<br>');
				var line = $('<div>', {'text': self.options[eventSplit[1]]}).prepend(timestamp).append(br);
				$('#login-pane #events').append(line);
			}
		});
	} else {
		$('#login-pane #no-event').show();
	}
}

/**
 * Fill history report panel
 *
 * @param array visits from the history log
 */
function fillHistoryReport(visits) {
	$('#history-pane tbody').empty();
	$('#table-history').trigger('destroy.pager');
	$("#table-history").trigger("update"); //trigger an update after emptying
	//pad(number) function adds zeros in front of number, used to get consistent date / time display. 
	function pad (number) {
		return ("00" + number).slice(-2);
	}

	if(visits.length === 0) {
		$('#history-pane #visits').hide();
		$('#history-pane #no-visit').show();
	} else {
		$('#history-pane #no-visit').hide();
		$('#history-pane #visits').show();
		//for each visit found in the log add a row to the table
		visits.forEach(function (visitElement) {
			if(visitElement) {
				//prepare the data for display
				var visit = {};
				
				var visitDate = new Date(+visitElement.timestamp);
				visit.date = visitDate.getFullYear() + "-"+ 
							pad((visitDate.getMonth()+1))+ "-" +
							pad(visitDate.getDate())+" "+
							pad(visitDate.getHours())+":"+
							pad(visitDate.getMinutes());

				visit.title = decodeURI(visitElement.title);
				//visit.url = $('<a>', {'href': visitElement.url, 'text': removeUrlPrefix(visitElement.url)});
				//visit.url.attr("target","_blank");

				//create a row that will hold the data
				var line = $('<tr>'); 
				
				//for each attribute of the visit, create a table data element and put it in the row
				for (var name in visit) {
					if (visit.hasOwnProperty(name)) {
						line.append($('<td>', {'text': visit[name]}));
					}
				}
				var url_cell=$('<td>').append($('<a>', {'href': decodeURI(visitElement.url), 'text': decodeURI(removeUrlPrefix(visitElement.url)), 'target':"_blank"}));
				line.append(url_cell);
				
				//append the line to the table
				$('#table-history')
					.find('tbody').append(line)
					.trigger('addRows',[$(line)]);
			}
		});
		$('#table-history').tablesorterPager(pagerOptions);
		$("#table-history").trigger("update"); //trigger update so that tablesorter reloads the table
		$(".tablesorter-filter").addClass("form-control input-md");
	}
}

/**
 * Fill time report panel
 *
 * @param array times spent on each category
 */
function fillTimeReport(times) {
	var tableBody = $('#time-pane tbody');

	tableBody.empty();

	var categories = Object.keys(times);
	if(categories.length > 0) {
		$('#time-pane #no-categories').hide();
		$('#time-pane #categories').show();

		var oneMinute = 60,
			oneHour = oneMinute*60,
			oneDay = oneHour*24;

		categories.forEach(function (category) {
			var line = $('<tr>');
			var categoryCell = $('<td>', {'text': category.replace('_', ' ')});

			var timeSpent = times[category].duration;

			var days = Math.floor(timeSpent/oneDay),
				hours = Math.floor((timeSpent%oneDay)/oneHour),
				minutes = Math.floor((timeSpent%oneDay)%oneHour/oneMinute),
				seconds = Math.floor(((timeSpent%oneDay)%oneHour)%oneMinute);

			var daysString = days>0 ? days + ' day' + (days>1 ? 's ' : ' ') : '',
				hoursString = hours>0 ? hours + ' hour' + (hours>1 ? 's ' : ' ') : '',
				minutesString = minutes>0 ? minutes + ' minute' + (minutes>1 ? 's ' : ' ') : '',
				secondsString = seconds>0 ? seconds + ' second' + (seconds>1 ? 's' : '') : '';

			var timeString = daysString + hoursString + minutesString + secondsString;
			if(timeString === '') {
				timeString = self.options.no_time_spent;
			}

			var timeSpentCell = $('<td>', {'text': timeString});

			line.append(categoryCell).append(timeSpentCell);
			tableBody.append(line);
		});
	} else {
		$('#time-pane #categories').hide();
		$('#time-pane #no-categories').show();
	}
}

/**
 * Removes the URL prefix of the given URL
 *
 * @param {string} the URL to clean
 */
function removeUrlPrefix(url) {
	prefix = /(^https?:\/\/|www\.|\/$)/g;
	// remove any prefix
	url = url.replace(prefix, "");
	//url = url.replace(/www\/./, "");
	return url;
}