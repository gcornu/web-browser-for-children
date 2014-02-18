$(function () {
	$('div').click(function () {
		var id = $(this).attr('id');
		self.port.emit(id);
	});
});