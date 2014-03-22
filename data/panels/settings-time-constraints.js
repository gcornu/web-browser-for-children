$(function () {
	var overallTimeLimit, timeLimits;
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
	$('#hour_constraints-pane .slider-morning').slider({
		range: true,
		min: 0,
		max: 840,
		step: 15,
		values: [480, 720],
		slide: updateTooltip
	});

	$('#hour_constraints-pane .slider-afternoon').slider({
		range: true,
		min: 720,
		max: 1440,
		step: 15,
		values: [840, 1140],
		slide: updateTooltip
	});

	$('#hour_constraints').click(function () {
		// init sliders tooltips
		var sliders = $('#hour_constraints-pane .slider');
		sliders.each(function (index, slider) {
			var slider = $(this);
			var handles = slider.find('.ui-slider-handle');
			slider.slider('option', 'slide')(null, { value: slider.slider('values', 0), handle: handles[0] });
			slider.slider('option', 'slide')(null, { value: slider.slider('values', 1), handle: handles[1] });
		});
	});

	$('#hour-constraints-table input:checkbox').change(function () {
		var slider = $('#' + $(this).attr('id').replace('checkbox', 'slider'));
		if($(this).is(':checked')) {
			slider.slider('enable');
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
	$('#limit_time-pane input[name="limit-time-type-options"][value="' + value + '"]').prop('checked', true);
	handleLimitTimeOptionClick(value);
});

self.port.on('limit_time_type_save_success', function () {
	inform(self.options.time_limit_type_set, 'success', 3000);
});

self.port.on('time_limit_initialized', function (categories, overallTimeLimit) {
	fillTimeLimitSelect(categories, overallTimeLimit);
});

self.port.on('time_limit_set', function () {
	inform(self.options.time_limit_set, 'success', 3000);
});

self.port.on('hour_constraints_type', function (value) {
	if(!value) {
		value = 'overall';
	}
	$('#hour_constraints-pane input[name="hour-constraints-type-options"][value="' + value + '"]').prop('checked', true);
	handleHourConstraintsOptionClick(value);
});

self.port.on('hour_constraints_type_save_success', function () {
	inform(self.options.hour_constraints_type_set, 'success', 3000);
});

/*
 * Fill the select for the time limitation
 *
 * @param {array} categories to be added to the select element
 */
function fillTimeLimitSelect (timeLimitsParam, overallTimeLimitParam) {
	timeLimits = timeLimitsParam;
	overallTimeLimit = overallTimeLimitParam;
	var categories = Object.keys(timeLimits);
	var select = $('#limit_time-pane select');
	select.empty();
	if(categories.length === 0) {
		if($('#limit-time-categories-radio').is(':checked')) {
			$('#limitTimeOptions').hide();
		}
		$('#limit_time_options_title').hide();
		select.selectpicker('hide');
		$('#limit_time_no_category').show();
	} else {
		$('#limit_time_no_category').hide();
		$('#limitTimeOptions').show();
		$('#limit_time_options_title').show();
		select.empty().selectpicker('show');
		categories.forEach(function (category) {
			select.append(createOption(category));
		});

		select.change(function () {
			var category = select.find('option:selected').val();
			$('#limit_time-pane input[name="limitTimeOptions"][value="' + timeLimits[category].limit + '"]').prop('checked', true);
		}).change();

		$('input:radio[name=limit-time-type-options]').click(function () {
			if($(this).val() === 'overall') {
				$('#limit_time-pane input[name="limitTimeOptions"][value="' + overallTimeLimit + '"]').prop('checked', true);
			} else {
				select.change();
			}
		});

		select.selectpicker('refresh');
	}
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
		if($('#limit_time-pane select option').length === 0) {
			$('#limitTimeOptions').hide();
		}
	} else {
		$('#limitTimeOptions').show();
	}
	$('input:radio[name=limitTimeOptions]').click(function () {
		var category = $('#limit_time-pane select option:selected').val();
		if($('input:radio[name=limit-time-type-options]:checked').val() === 'overall') {
			overallTimeLimit = $(this).val();
		} else {
			timeLimits[category].limit = $(this).val();
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