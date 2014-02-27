$(function () {
	$('div').click(function () {
		var id = $(this).attr('id');
		self.port.emit(id);
	});

	self.port.on('activated', function() {
		$('#addBlacklist, #addWhitelist').hide();
		$('#activate').html('Deactivate FfC');
		$('#activate').attr('id', 'deactivate');
	});

	self.port.on('deactivated', function() {
		$('#addBlacklist, #addWhitelist').show();
		$('#deactivate').html('Activate FfC');
		$('#deactivate').attr('id', 'activate');
	});
});