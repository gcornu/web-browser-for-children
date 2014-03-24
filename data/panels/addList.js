$(function() {
	$("#add").html(self.options.addTo + ' ' + self.options.listName);

	$('#new_category').click(function () {
		var category = window.prompt(self.options.newCategoryPrompt);
		if(category) {
			var select = $('select');
			if(select.find('option[value="' + category.replace(' ', '_') + '"]').length === 0) {
				select.append(createOption(category).prop('selected', 'selected'));
				select.prop('disabled', false);
			} else {
				inform(self.options.alreadyExists, 'danger', 5000);
			}
		}
	});

	$("#add").click(function () {
		var category = $('select option:selected').val();
		if(!category) {
			inform(self.options.selectCategory, 'danger', 5000);
		} else {
			self.port.emit('add_' + self.options.listType, category);
		}
	});
});

self.port.on('categories', function (categories) {
	var select = $('select');

	select.empty();
	if(categories.length > 0) {
		categories.forEach(function (category) {
			select.append(createOption(category));
		});
	} else {
		select.prop('disabled', true);
	}
});

/**
 * This function creates option element for selects in lists
 *
 * @param {string} label of the option
 */
function createOption(label) {
	return $('<option>', {'value': label.replace(' ', '_'), 'text': label.replace('_', ' ')});
}

function inform(message, alertClass, timeout) {
	$('#message_container').append($('<div>', {'id': 'inform', 'style': 'height: 30px; padding-top: 5px; padding-bottom: 5px;', 'class': 'alert alert-' + alertClass})
									.append($('<small>', {'text': message})));

	if(timeout) {
		setTimeout(function () {
			$('#message_container #inform').fadeOut(500, function () {
				$('#message_container #inform').remove();
			});
		}, timeout);
	}
}