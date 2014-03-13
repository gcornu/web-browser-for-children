$(function () {
	$('div').click(function () {
		var id = $(this).attr('id');
		self.port.emit(id);
	});

	self.port.on('activated', function() {
		$('#activate').html('Deactivate FfC');
		$('#activate').attr('id', 'deactivate');
	});

	self.port.on('deactivated', function() {
		$('#deactivate').html('Activate FfC');
		$('#deactivate').attr('id', 'activate');
	});
});