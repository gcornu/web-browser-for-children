$(function () {
	$('div').click(function () {
		var id = $(this).attr('id');
		self.port.emit(id);
	});

	self.port.on('activated', function() {
		$('#addBlacklist, #addWhitelist').hide();
		$('#activate').attr('id', 'deactivate');
		$('#activate').html('Deactivate FfC');
	});

	self.port.on('deactivated', function() {
		$('#addBlacklist, #addWhitelist').show();
		$('#deactivate').attr('id', 'activate');
		$('#deactivate').html('Activate FfC');
	});
});