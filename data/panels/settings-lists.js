$(function () {
	$('#custom-blacklist-categories select, #custom-whitelist-categories select').attr('title', self.options.no_category);

	$('#default-blacklist-search-form').submit(function (e) {
		e.preventDefault();
		if($('#default-blacklist-search-term').val().length < 3) {
			$('#default-blacklist-search-form .help-block').css('visibility', 'visible');
			$('#default-blacklist-search-form').addClass('has-error');
		} else {
			$('#default-blacklist-search-term, #default-blacklist-search-button').attr('disabled', 'disabled');
			$('#default-blacklist-search-button #search-icon').hide();
			$('#default-blacklist-search-button #search-loader').show();
			self.port.emit('default_blacklist_search', $('#default-blacklist-search-term').val());
		}
	});

	$('#default-blacklist-search-term').on('change keyup paste', function () {
		if($(this).val().length > 2) {
			$('#default-blacklist-search-form').removeClass('has-error');
			$('#default-blacklist-search-form .help-block').css('visibility', 'hidden');
		}
	});

	var idHandledButtons =	'#remove-default-blacklist, ' +
							'#add-default-blacklist, ' +
							'#remove-default-whitelist, ' +
							'#add-default-whitelist, ' +
							'#remove-custom-blacklist, ' +
							'#remove-custom-whitelist';

	$(idHandledButtons).click(function () {
		var self = this;
		var paramArray = $(self).attr('id').split('-');
		listsButtonHandler.apply(null, paramArray);
	});

	$('#add-custom-blacklist, #add-custom-whitelist').click(function () {
		var listName = $(this).attr('id').split('-').pop();
		var uri = window.prompt(self.options.url_add_prompt + ' ' + self.options[listName] + ':');
		if(uri) {
			var category = $('#custom-' + listName + '-categories select option:selected').val();
			if(category) {
				self.port.emit('add_custom_' + listName, uri, category);
			} else {
				inform(self.options.no_category_error, 'error', 5000);
			}
		}
	});

	$('#add-custom-blacklist-category, #add-custom-whitelist-category').click(function () {
		var category = window.prompt(self.options.new_category);
		if(category) {
			var id = $(this).attr('id').split('-');
			id.pop();
			var listName = id.pop();
			var select = $('#custom-' + listName + '-categories select');
			// check if this category doesn't already exists
			if(select.find('option[value="' + category.replace(' ', '_') + '"]').length === 0) {
				$('#custom-' + listName + '-inner').append($('<div>', {'id': 'custom-' + listName + '-category-' + category.replace(' ', '_')}));
				select.append(createOption(category).prop('selected', 'selected'));
				select.change();
				self.port.emit('add_custom_' + listName + '_category', category.replace(' ', '_'));
			}
		}
	});

	$('#remove-custom-blacklist-category, #remove-custom-whitelist-category').click(function () {
		var id = $(this).attr('id').split('-');
		id.pop();
		var listName = id.pop();
		var select = $('#custom-' + listName + '-categories select');
		var selectedOption = select.find('option:selected');
		var category = selectedOption.val();
		selectedOption.remove();
		select.change();
		self.port.emit('remove_custom_' + listName + '_category', category);
	});
});

// external events listeners
self.port.on('blacklist_initialized', function (removedDefaultBlacklistElements) {
	$('#default-blacklist-categories select').selectpicker();
});

self.port.on('default_blacklist_search_response', function (matches, removedMatchesElements) {
	$('#default-blacklist-search-term, #default-blacklist-search-button').removeAttr('disabled');
	$('#default-blacklist-search-button #search-loader').hide();
	$('#default-blacklist-search-button #search-icon').show();

	if(Object.keys(matches).length === 0) {
		$('#default-blacklist-inner').append($('<h4>', {'text': self.options.no_match}));
	} else {
		fillListDivs(matches, removedMatchesElements, 'blacklist', 'default');
	}
});

self.port.on('whitelist_initialized', function (defaultWhitelist, removedDefaultBlacklistElements) {
	fillListDivs(defaultWhitelist, removedDefaultBlacklistElements, 'whitelist', 'default');
});

self.port.on('custom_blacklist_initialized', function (list) {
	fillListDivs(list, null, 'blacklist', 'custom');
});

self.port.on('custom_whitelist_initialized', function (list) {
	fillListDivs(list, null, 'whitelist', 'custom');
});

self.port.on('blacklist_custom_added', function (host, category) {
	addCustomListListener('blacklist', host, category);
});

self.port.on('whitelist_custom_added', function (host, category) {
	addCustomListListener('whitelist', host, category);
});

self.port.on('error_null_category', function () {
	inform(self.options.no_category_error, 'error', 5000);
});

self.port.on('malformed_url', function() {
	inform(self.options.malformed_url, 'error', 5000);
});

self.port.on('host_already_added', function() {
	inform(sefl.options.already_present_url, 'error', 5000);
});

/**
 * Event handler when the 'add' button is clicked for custom lists
 *
 * @param {blacklist|whitelist} name of the list 
 */
function addCustomListHandler(listName) {
	var uri = window.prompt(self.options.add_url + ' ' + self.options[listName] + ':');
	if(uri) {
		var category = $('#custom-' + listName + '-categories select option:selected').val();
		self.port.emit('add_custom_' + listName, uri, category);
	}
}

/**
 * Event listener when an entry is added in the custom lists
 *
 * @param {blacklist|whitelist} listName
 * @param {string} host
 * @param {string} category of the added host
 */
function addCustomListListener(listName, host, category) {
	if(host) {
		var divId = 'custom-' + listName + '-category-' + category;
		if($('#' + divId).length === 0) {
			var div = $('<div>', {'id': divId});
			$('#custom-' + listName + '-inner').append(div);
		}
		var div = $('#' + divId);
		div.append(createCheckbox(host));

		addInputChangeHandler(div);
	} else {
		inform(self.options.host_not_added + ' ' + self.options[listName] + self.options.check_syntax, 'error');
	}
}

/**
 * This function fills the correct divs when lists are initialized
 *
 * @param {object} defaultList list of default elements
 * @param {object} removedList list of removed elements (may be empty)
 * @param {blacklist|whitelist} name of the list to be filled
 * @param {default|custom} type of the list
 */
function fillListDivs(defaultList, removedList, name, type) {
	var prefix = type + '-' + name,
		removedPrefix = '';
	fillListsDivsHelper(defaultList, prefix);
	if(removedList !== null) {
		removedPrefix = 'removed-' + prefix;
		fillListsDivsHelper(removedList, removedPrefix);
	}

	fillMenu(defaultList, prefix, removedPrefix);
}

/**
 * This function is a helper for fillListsDivs function
 * This function shouldn't be used by any other function than fillListsDivs
 *
 * @param {object} list of elements to add
 * @param {string} prefix of id of elements
 */
function fillListsDivsHelper(list, prefix) {
	$('#' + prefix + '-inner').empty();

	Object.keys(list).forEach(function (category) {
		var div = $('<div>', {'id': prefix + '-category-' + category});
		list[category].forEach(function (elem) {
			div.append(createCheckbox(elem));
		});

		addInputChangeHandler(div);

		$('#' + prefix + '-inner').append(div);
	});
	$('#' + prefix + '-inner > div:not(:first)').hide();
}

/**
 * This function is a helper for fillListsDivs function.
 * It fills the menu with the categories in the given list and handles category changes
 *
 * @param {object} list of added elements
 * @param {string} prefix of id of elements
 * @param {string} prefix of the removed elements divs
 */
function fillMenu(list, prefix, removedPrefix) {
	$('#' + prefix + '-categories select').empty();

	var categories = Object.keys(list);
	var select = $('#' + prefix + '-categories select');

	if(categories.length > 0) {
		categories.forEach(function (category) {
			select.append(createOption(category));
		});
		select.first('option').prop('selected', 'selected');
		select.prop('disabled', false);
		select.selectpicker('refresh');
	} else {
		select.prop('disabled', true);
		select.selectpicker('refresh');
	}

	select.change(function () {
		$('#' + prefix + '-inner > div').hide();
		$('#' + prefix + '-category-' + $(this).val()).show();
		$('#' + prefix + '-category-' + $(this).val() + ' input').change();
	}).change();

	if(prefix.indexOf('custom') !== -1) {
		$('#' + prefix + '-categories select').change(function () {
			if($(this).find('option').length == 0) {
				$(this).prop('disabled', true);
			} else {
				$(this).prop('disabled', false);
			}
			if($(this).find('option:selected').length == 0) {
				$('#add-' + prefix).attr('disabled', 'disabled');
			} else {
				$('#add-' + prefix).removeAttr('disabled');
			}
			$(this).selectpicker('refresh');
		}).change();
	}
	
	if(removedPrefix) {
		select.change(function () {
			$('#' + removedPrefix + '-inner > div').hide();
			$('#' + removedPrefix + '-category-' + $(this).val()).show();
		}).change();
	}
}

/**
 * Event handler for lists actions
 * 
 * @param {add|remove} event type
 * @param {default|custom} list type
 * @param {blacklist|whitelist} list name
 */
function listsButtonHandler(eventType, listType, listName) {
	var prefixOrigin = '',
		prefixDest = '',
		checked_elements = [],
		category = '',
		label,
		br;

	if(eventType) {
		prefixOrigin = eventType === 'add' ? 'removed-' : '';
		prefixDest = prefixOrigin === 'removed-' ? '' : 'removed-';
	}

	category = $('#' + listType + '-' + listName + '-categories option:selected').val();

	$('#' + prefixOrigin + listType + '-' + listName + '-inner input:checked').each(function(index, element) {
		checked_elements.push(element.id);
		if(listType === 'default') {
			$(element).attr('checked', false).change();
			$('#' + prefixDest + listType + '-' + listName + '-category-' + category).append($(element).parent().parent());

			$(element).unbind('change');
			addInputChangeHandler($(element).parent().parent().parent());
		} else {
			var containingDiv = $(element).parent().parent().parent();
			$(element).parent().parent().remove();
			containingDiv.find('input').change();
			/*if($('#' + listType + '-' + listName + '-category-' + category + ' input').length == 0) {
				$('#' + listType + '-' + listName + '-categories option:selected').remove();
				$('#' + listType + '-' + listName + '-categories select').change().selectpicker('refresh');
				$('#remove-' + listType + '-' + listName).attr('disabled', 'disabled');
			}*/
		}
	});

	self.port.emit(eventType + '_' + listType + '_' + listName, checked_elements, category);
}

/**
 * This function creates a checkbox with everything around it
 *
 * @param {string} id and text of the checkbox
 */
function createCheckbox(label) {
	return $('<div>', {'class': 'checkbox'}).append($('<label>', {'text': label}).append($('<input>', {'type': 'checkbox', 'id': label})));
}

/**
 * This function creates option element for selects in lists
 *
 * @param {string} label of the option
 */
function createOption(label) {
	return $('<option>', {'value': label.replace(' ', '_'), 'text': label.replace('_', ' ')});
}

/**
 * This function adds change event handlers on every input element of the div on order to activate or deactivate buttons
 *
 * @param {Object} div containing input elements
 */
function addInputChangeHandler(div) {
	div.find('input').change(function () {
		var prefix = div.parent().attr('id').replace('-inner', '').replace('removed', 'add');
		if(!prefix.startsWith('add')) {
			prefix = 'remove-' + prefix;
		}
		var localDiv = div;

		if(localDiv.find('input:checked').length === 0) {
			$('#' + prefix).attr('disabled', 'disabled');
		} else {
			$('#' + prefix).removeAttr('disabled');
		}
	});
}