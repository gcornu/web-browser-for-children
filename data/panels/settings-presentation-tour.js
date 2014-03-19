/**
 * This function shows the presentation tour after first startup
 */
function showTour() {
	$('body').prepend($('<div>', {'id': 'tour-filter'}));
	$('#tour-filter').height(Math.max($('body').outerHeight(), window.height));

	// construct the panel
	var panel = $('<div>', {'id': 'tour-panel', 'class': 'panel panel-default', 'data-tour-step': 0})
					.append($('<div>', {'class': 'panel-body', 'text': self.options.step0})
						.prepend($('<h3>', {'text': 'Congratulations!'}))
						.append($('<div>', {'id': 'tour-button-accept', 'class': 'btn btn-success pull-left', 'text': self.options.yes}))
						.append($('<div>', {'id': 'tour-button-deny', 'class': 'btn btn-danger pull-right', 'text': self.options.no})));
	$('#tour-filter').append(panel);
	$('#tour-filter').append($('<div>', {'id': 'tour-end', 'class': 'btn btn-danger btn-xs pull-right', 'text': self.options.end_tour}).hide())

	// attach event handlers
	$('#tour-button-accept').click(nextTourStep);

	$('#tour-button-deny, #tour-end').click(endTour);
	$('body').on('click', '#tour-next-step', nextTourStep);
}

function nextTourStep() {
	var content = '';
	var element = null;
	var placement = 'top';
	var buttonLabel = self.options.next + ' »';
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
	step++;

	// clean the previous popovered element
	$('*[data-tour-step]').css('z-index', 'initial').removeAttr('data-tour-step');

	// define variables depending on the step
	switch(step) {
		case 1:
			element = $('#pass');
			clickElement = true;
			content = self.options.step1; 
			break;
		case 2:
			element = $('#filtering');
			clickElement = true;
			content = self.options.step2;
			break;
		case 3:
			element = $('#filteringOptionsBlack').next();
			content = self.options.step3;
			placement = 'right';
			break;
		case 4:
			element = $('#filteringOptionsWhite').next();
			content = self.options.step4;
			placement = 'right';
			break;
		case 5:
			element = $('#filteringOptionsNone').next();
			content = self.options.step5;
			placement = 'right';
			break;
		case 6:
			element = $('#lists');
			displayDropdown('lists');
			content = self.options.step6;
			break;
		case 7:
			displayDropdown('lists');
			element = $('#default-blacklist');
			showList('default-blacklist');
			content = self.options.step7;
			placement = 'right';
			break;
		case 8:
			displayDropdown('lists');
			element = $('#custom-blacklist');
			showList('custom-blacklist');
			content = self.options.step8;
			placement = 'right';
			break;
		case 9:
			displayDropdown('lists');
			element = $('#default-whitelist');
			showList('default-whitelist');
			content = self.options.step9;
			placement = 'right';
			break;
		case 10:
			displayDropdown('lists');
			element = $('#custom-whitelist');
			showList('custom-whitelist');
			content = self.options.step10;
			placement = 'right';
			break;
		case 11:
			$('#lists').removeClass('open').css('z-index', 'initial');
			element = $('#reports');
			displayDropdown('reports');
			content = self.options.step11;
			break;
		case 12:
			displayDropdown('reports');
			element = $('#login');
			showReport('login');
			content = self.options.step12;
			placement = 'right';
			break;
		case 13:
			displayDropdown('reports');
			element = $('#history');
			showReport('history');
			content = self.options.step13;
			placement = 'right';
			break;
		case 14:
			displayDropdown('reports');
			element = $('#time');
			showReport('time');
			content = self.options.step14;
			placement = 'right';
			break;
		case 15:
			$('#reports').removeClass('open').css('z-index', 'initial');
			element = $('#limit_time');
			clickElement = true;
			content = self.options.step15;
			placement = 'bottom';
			buttonLabel = self.options.end;
			break;
		default:
			$('#filtering').click();
			endTour();
	}

	content = $('<div>', {'text': content}).append($('<div>', {'id': 'tour-next-step', 'class': 'btn btn-link pull-right', 'text': buttonLabel}));

	// attach the new popover
	element.css('z-index', 101).attr('data-tour-step', step);
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