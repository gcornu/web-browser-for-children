/**
 * This function shows the presentation tour after first startup
 */
function showTour() {
	$('body').prepend($('<div>', {'id': 'tour-filter'}));
	$('#tour-filter').height(Math.max($('body').outerHeight(), window.height));

	// construct the panel
	var panel = $('<div>', {'id': 'tour-panel', 'class': 'panel panel-default', 'data-tour-step': 0})
					.append($('<div>', {'class': 'panel-body', 'text': 'Would you like a short presentation of what you can do here?'})
						.prepend($('<h3>', {'text': 'Congratulations!'}))
						.append($('<div>', {'id': 'tour-button-accept', 'class': 'btn btn-success pull-left', 'text': 'Yes'}))
						.append($('<div>', {'id': 'tour-button-deny', 'class': 'btn btn-danger pull-right', 'text': 'No'})));
	$('#tour-filter').append(panel);
	$('#tour-filter').append($('<div>', {'id': 'tour-end', 'class': 'btn btn-danger btn-xs pull-right', 'text': 'End tour'}).hide())

	// attach event handlers
	$('#tour-button-accept').click(nextTourStep);

	$('#tour-button-deny, #tour-end').click(endTour);
	$('body').on('click', '#tour-next-step', nextTourStep);
}

function nextTourStep() {
	var content = '';
	var element = null;
	var placement = 'top';
	var buttonLabel = 'Next »';
	var clickElement = false;

	// get the current step
	var step = parseInt($('*[data-tour-step]').attr('data-tour-step'));
	// remove previous popover
	if(step === 0) {
		$('#tour-panel').remove();
		$('#tour-end').show();
	} else {
		$('*[data-tour-step]').popover('destroy');
		$('div.popover').remove();
	}
	// clean the previous popovered element
	$('*[data-tour-step]').css('z-index', 'initial').removeAttr('data-tour-step');

	// define variables depending on the step
	switch(step) {
		case 0:
			element = $('#pass');
			clickElement = true;
			content = 'In the \'Password\' section, you can change the password of the application'; 
			break;
		case 1:
			element = $('#filtering');
			clickElement = true;
			content = 'In the \'Filter\' section, you can choose what kind of filter use';
			break;
		case 2:
			element = $('#filteringOptionsBlack').next();
			content = 'Blacklist forbids a list of websites to be visited';
			placement = 'right';
			break;
		case 3:
			element = $('#filteringOptionsWhite').next();
			content = 'Whitelist only allows websites which are in a list';
			placement = 'right';
			break;
		case 4:
			element = $('#filteringOptionsNone').next();
			content = 'If you don\'t want to use any filtering on visited websites, use this option';
			placement = 'right';
			break;
		case 5:
			element = $('#lists');
			displayDropdown('lists');
			content = 'In the \'Lists management\' section, you can control the content of the black and white lists';
			break;
		case 6:
			displayDropdown('lists');
			element = $('#default-blacklist');
			showList('default-blacklist');
			content = 'The default blacklist is automatically updated. You can remove some elements from this list, but you cannot add you own elements.';
			placement = 'right';
			break;
		case 7:
			displayDropdown('lists');
			element = $('#custom-blacklist');
			showList('custom-blacklist');
			content = 'In the custom blacklist, you can add all the elements you want in the blacklist that aren\'t in the default blacklist.';
			placement = 'right';
			break;
		case 8:
			displayDropdown('lists');
			element = $('#default-whitelist');
			showList('default-whitelist');
			content = 'The default whitelist contains verified websites that are safe for our children. You can remove some elements from this list, but you cannot add you own elements.';
			placement = 'right';
			break;
		case 9:
			displayDropdown('lists');
			element = $('#custom-whitelist');
			showList('custom-whitelist');
			content = 'As in the custom blacklist, you can add in the custom whitelist all the elements you want in the whitelist that aren\'t in the default whitelist.';
			placement = 'right';
			break;
		case 10:
			$('#lists').removeClass('open').css('z-index', 'initial');
			element = $('#reports');
			displayDropdown('reports');
			content = 'In the \'Reports\' section, you can track the actions done by your children';
			break;
		case 11:
			displayDropdown('reports');
			element = $('#login');
			showReport('login');
			content = 'The \'Login\' section displays all the login attempts (successes and fails) made with the extension.';
			placement = 'right';
			break;
		case 12:
			displayDropdown('reports');
			element = $('#history');
			showReport('history');
			content = 'In the \'History\' section, you can see all the websites visited by your children while the safe navigation is activated.';
			placement = 'right';
			break;
		case 13:
			displayDropdown('reports');
			element = $('#time');
			showReport('time');
			content = 'In the \'Time\' section, you can see the time spent on each category of website by your children. Categories are defined in the custom whitelist panel (even if you are not using the whitelist filtering).';
			placement = 'right';
			break;
		case 14:
			$('#reports').removeClass('open').css('z-index', 'initial');
			element = $('#limit_time');
			clickElement = true;
			content = 'In the \'Time limits\' section, you can limit the time spent by your children on each websites category. These categories are defined in the custom whitelist section, even if you are not using the whitelist filtering.';
			placement = 'bottom';
			buttonLabel = 'End';
			break;
		default:
			$('#filtering').click();
			endTour();
	}

	content = $('<div>', {'text': content}).append($('<div>', {'id': 'tour-next-step', 'class': 'btn btn-link pull-right', 'text': buttonLabel}));

	// attach the new popover
	element.css('z-index', 101).attr('data-tour-step', step + 1);
	if(clickElement) {
		element.click();
	}
	element.popover({
		animate: false,
		html: true,
		placement: placement,
		trigger: 'manual',
		content: content,
		container: 'body',
	}).popover('show');

	// Adjust filter height to newly diplayed element
	$('#tour-filter').height(Math.max($('body').outerHeight(), window.height));
}

/**
 * Display the dropdown associated to the given id
 *
 * @param {string} id of the container of the dropdown
 */
function displayDropdown(id) {
	// why doesn't it work without the setTimeout ? No idea...
	setTimeout(function () {
		$('#' + id).addClass('open').css('z-index', 101);
	}, 1);
}

/**
 * This function ends tour presentation by removing all of its elements
 */
function endTour() {
	$('div[id^="tour-"]').remove();
	$('div.popover').remove();
}