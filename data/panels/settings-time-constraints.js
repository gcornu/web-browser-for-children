// prevent flickering by hiding elements
$('#hour-constraints-content').hide();

$(function () {
	var overallTimeConstraints, timeConstraints;
	/**
	 * Handle limit time type options clicks
	 */
	$('input:radio[name=limit-time-type-options]').click(function () {
		var val = $(this).val();
		self.port.emit('limit_time_type_set', val); //val can be overall or categories
		handleLimitTimeOptionClick(val);
	});

	/**
	 * Handle hour constraints type options clicks
	 */
	$('input:radio[name=hour-constraints-type-options]').click(function () {
		var val = $(this).val();
		self.port.emit('hour_constraints_type_set', val); //val can be overall or categories
		handleHourConstraintsOptionClick(val);
	});

	/**
	 * Init sliders
	 */
	$('#hour-constraints-pane .slider-morning').slider({
		range: true,
		min: 0,
		max: 840,
		step: 15,
		values: [480, 720],
		slide: updateTooltip,
		stop: saveHourConstraint
	});

	$('#hour-constraints-pane .slider-afternoon').slider({
		range: true,
		min: 720,
		max: 1440,
		step: 15,
		values: [840, 1140],
		slide: updateTooltip,
		stop: saveHourConstraint
	});

	$('#hour-constraints').click(function () {
		// init sliders tooltips
		var sliders = $('#hour-constraints-pane .slider');
		sliders.each(function (index, slider) {
			triggerSlideEvent($(this));
		});
	});

	$('#hour-constraints-use-checkbox').change(function () {
		handleUseHourConstraintsChange($(this).is(':checked'));
		self.port.emit('hour_constraints_use_set', $(this).is(':checked'));
	});

	$('#hour-constraints-table input:checkbox').change(function () {
		var slider = $('#' + $(this).attr('id').replace('checkbox', 'slider'));
		if($(this).is(':checked')) {
			slider.slider('enable');
			handle = slider.find('.ui-slider-handle:first');
			slider.slider('option', 'stop')(null, {value: slider.slider('values', 0), handle: handle});
		} else {
			slider.slider('disable');
		}
	}).change();
});

// external events listeners
self.port.on('limit_time_type', function (value) {
	if(!value) {
		value = 'overall';
	}
	$('#limit-time-pane input[name="limit-time-type-options"][value="' + value + '"]').prop('checked', true);
	handleLimitTimeOptionClick(value);
});

self.port.on('limit_time_type_save_success', function () {
	inform(self.options.time_limit_type_set, 'success', 3000);
});

self.port.on('time_constraints_initialized', function (timeConstraints, overallTimeConstraints) {
	fillTimeLimitSelect(timeConstraints, overallTimeConstraints);
});

self.port.on('time_limit_set', function () {
	inform(self.options.time_limit_set, 'success', 3000);
});

self.port.on('hour_constraints_use', function (value) {
	if(!value) {
		value = false;
	}
	$('#hour-constraints-use-checkbox').prop('checked', value);
	handleUseHourConstraintsChange(value);
});

self.port.on('hour_constraints_type', function (value) {
	if(!value) {
		value = 'overall';
	}
	$('#hour-constraints-pane input[name="hour-constraints-type-options"][value="' + value + '"]').prop('checked', true);
	handleHourConstraintsOptionClick(value);
});

self.port.on('hour_constraints_use_save_success', function () {
	inform(self.options.hour_constraints_use_set, success, 3000);
});

self.port.on('hour_constraints_type_save_success', function () {
	inform(self.options.hour_constraints_type_set, 'success', 3000);
});

self.port.on('hour_constraint_set', function () {
	inform(self.options.hour_constraints_set, 'success', 3000);
});

/**
 * Hides all elements when hour constraints are deactivated
 *
 * @param {boolean} whether the checkbox is checked or not
 */
function handleUseHourConstraintsChange(checked) {
	if(checked) {
		$('#hour-constraints-content').show();
		handleHourConstraintsOptionClick($('#hour-constraints-pane input[name="hour-constraints-type-options"]:checked').val());
	} else {
		$('#hour-constraints-content').hide();
	}
}

/*
 * Fill the select for the time limitation
 *
 * @param {array} categories to be added to the select element
 */
function fillTimeLimitSelect (timeConstraintsParam, overallTimeConstraintsParam) {
	timeConstraints = timeConstraintsParam;
	overallTimeConstraints = overallTimeConstraintsParam;

	var categories = Object.keys(timeConstraints);
	var selects = $('#limit-time-pane select, #hour-constraints-pane select');
	selects.each(function () {
		var select = $(this);
		var prefix = $(this).parent().parent().parent().parent().parent().attr('id').replace('-pane', '');
		select.empty();
		if(categories.length === 0) {
			if($('#' + prefix + '-categories-radio').is(':checked')) {
				$('#' + prefix + '-options').hide();
			}
			$('#' + prefix + '-options-title').hide();
			select.selectpicker('hide');
			$('#' + prefix + '-no-category').show();
		} else {
			$('#' + prefix + '-no-category').hide();
			$('#' + prefix + '-options').show();
			$('#' + prefix + '-options-title').show();
			select.empty().selectpicker('show');
			categories.forEach(function (category) {
				select.append(createOption(category));
			});

			select.selectpicker('refresh');
		}
	});

	// limit time specific management
	$('#limit-time-pane select').change(function () {
		var category = $(this).find('option:selected').val();
		$('#limit-time-pane input[name="limit-time-options"][value="' + timeConstraints[category].limit + '"]').prop('checked', true);
	}).change();

	// hour constraints specific management
	$('#hour-constraints-pane select').change(function () {
		var category = $(this).find('option:selected').val();
		fillHourConstraintsTable(timeConstraints[category].hours);
	}).change();
}

/**
 * Fills the hour constraints table with the values given in hours
 *
 * @param {Object} hours
 */
function fillHourConstraintsTable(hours) {
	Object.keys(hours).forEach(function (day) {
		Object.keys(hours[day]).forEach(function (period) {
			if(hours[day][period] !== null) {
				$('#hour-constraints-' + day + '-' + period + '-checkbox').prop('checked', true);
				$('#hour-constraints-' + day + '-' + period + '-slider').slider('enable');
				$('#hour-constraints-' + day + '-' + period + '-slider').slider('values', hours[day][period]);
				triggerSlideEvent($('#hour-constraints-' + day + '-' + period + '-slider'));
			} else {
				$('#hour-constraints-' + day + '-' + period + '-checkbox').prop('checked', false);
				$('#hour-constraints-' + day + '-' + period + '-slider').slider('disable');
				if($('#hour-constraints-' + day + '-' + period + '-slider').hasClass('slider-morning')) {
					$('#hour-constraints-' + day + '-' + period + '-slider').slider('values', [480, 720]);
				} else {
					$('#hour-constraints-' + day + '-' + period + '-slider').slider('values', [840, 1140]);
				}
				triggerSlideEvent($('#hour-constraints-' + day + '-' + period + '-slider'));
			}
		});
	});
}

/**
 * Performs operations when a choice is made in the limit time panel between overall and per category
 *
 * @param {string} the selected value
 */
function handleLimitTimeOptionClick(val) {
	$('#limit-time-overall-header, #limit-time-categories-header').hide();
	$('#limit-time-' + val + '-header').show();
	if(val === 'categories') {
		if($('#limit-time-pane select option').length === 0) {
			$('#limit-time-options').hide();
		} else {
			$('#limit-time-pane select').change();
		}
	} else {
		$('#limit-time-options').show();
		$('#limit-time-pane input[name="limit-time-options"][value="' + overallTimeConstraints.limit + '"]').prop('checked', true);
	}

	$('input:radio[name=limit-time-options]').click(function () {
		var category = $('#limit-time-pane select option:selected').val();
		if($('input:radio[name=limit-time-type-options]:checked').val() === 'overall') {
			overallTimeConstraints.limit = $(this).val();
		} else {
			timeConstraints[category].limit = $(this).val();
		}
		self.port.emit('limit_time_choice', category, $(this).val());
	});
}

/**
 * Performs operations when a choice is made in the hour constraints panel between overall and per category
 *
 * @param {string} the selected value
 */
function handleHourConstraintsOptionClick(val) {
	$('#hour-constraints-overall-header, #hour-constraints-categories-header').hide();
	$('#hour-constraints-' + val + '-header').show();
	if(val === 'categories') {
		if($('#hour-constraints-pane select option').length === 0) {
			$('#hour-constraints-table').hide();
		} else {
			$('#hour-constraints-pane select').change();
		}
	} else {
		fillHourConstraintsTable(overallTimeConstraints.hours);
		$('#hour-constraints-table').show();
	}
}

/**
 * Adds a 0 at beggining of string if length 1 (for time display)
 *
 * @param {string} to treat
 */
function addZeroFirst(string) {
	if(('' + string).length === 1) {
		return '0' + string;
	} else {
		return string;
	}
}

/**
 * Triggers slide event on the given sliden
 *
 * @param {Node} slider
 */
function triggerSlideEvent(slider) {
	var handles = slider.find('.ui-slider-handle');
	slider.slider('option', 'slide')(null, { value: slider.slider('values', 0), handle: handles[0] });
	slider.slider('option', 'slide')(null, { value: slider.slider('values', 1), handle: handles[1] });
}

/**
 * This function updates the position and the title of the tooltip when the slider changes
 */
function updateTooltip(event, ui) {
	var handle = $(ui.handle);
	var hours = addZeroFirst(parseInt(ui.value/60));
	var minutes = addZeroFirst(ui.value%60);
	var timeString = hours + ':' + minutes;
	if(!handle.next().hasClass('tooltip')) {
		handle.tooltip({
			animation: false,
			placement: 'top',
			trigger: 'manual',
			title: timeString,
		}).tooltip('show');
	} else {
		handle.attr('title', timeString).tooltip('fixTitle').tooltip('show');
	}
	
	var tooltip = handle.next();
	var slider = handle.parent()
	var width =slider.width();
	var min = slider.slider('option', 'min');
	var max = slider.slider('option', 'max');
	var position = (ui.value-min)*width/(max-min) - tooltip.width()/2;
	tooltip.css('left', position);
}

/**
 * Saves the new values of the changed slider
 */
function saveHourConstraint(event, ui) {
	var slider = $(ui.handle).parent();
	var splittedId = slider.attr('id').split('-');
	var category = $('#hour-constraints-pane select option:selected').val();
	if($('input:radio[name=hour-constraints-type-options]:checked').val() === 'overall') {
		overallTimeConstraints.hours[splittedId[2]][splittedId[3]] = slider.slider('values');
	} else {
		timeConstraints[category].hours[splittedId[2]][splittedId[3]] = slider.slider('values');
	}
	self.port.emit('hour_constraint_change', category, splittedId[2], splittedId[3], slider.slider('values'));
}