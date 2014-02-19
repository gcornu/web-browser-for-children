$(function () {
	$('div').click(function () {
		var id = $(this).attr('id');
		self.port.emit(id);
	});

	$('#activate, #deactivate').click(function () {
		var label = $(this).attr('id') == 'activate' ? 'Deactivate' : 'Activate';
		$(this).attr('id', label.toLowerCase());
		$(this).html(label + ' FfC');
	});
});