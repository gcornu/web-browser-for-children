$(function () {
	$('div').click(function () {
		var id = $(this).attr('id');
		self.port.emit(id);
	});

	self.port.on('activated', function() {
		$('#activate').html(self.options.deactivate_ffc);
		$('#activate').attr('id', 'deactivate');
	});

	self.port.on('deactivated', function() {
		$('#deactivate').html(self.options.activate_ffc);
		$('#deactivate').attr('id', 'activate');
	});
});