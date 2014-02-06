$(function() {
	$("#submit").val('Add to whitelist');

	$('#new_category').click(function() {
		var category = window.prompt('Name of the new category:');
		if(category) {
			var select = $('select');
			if(select.find('option[value="' + category.replace(' ', '_') + '"]').length === 0) {
				var option = $('<option>').attr('value', category.replace(' ', '_')).html(category);
				select.append(option);
				option.prop('selected', 'selected');
				select.change();
			}
		}
	});

	//Cannot use jQuery's "submit()" as if I wrap in a <form> element, firefox tries to save the password and throws error because it is not a browser window...
	$("#submit").click(function() {
		var category = $('select option:selected').val();
		if(!category) {
			alert('Please select a category.');
		} else {
			self.port.emit('add_whitelist', category);
		}
	});
});

self.port.on('categories', function(categories) {
	$('select').empty();
	if(categories) {
		categories.forEach(function(category) {
			var option = $('<option>').attr('value', category).html(category.replace('_', ' '));
			$('select').append(option);
		});
	}
});
