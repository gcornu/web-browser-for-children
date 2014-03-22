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