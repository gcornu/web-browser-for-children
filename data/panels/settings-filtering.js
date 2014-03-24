$(function () {
	/**
	 * Handle filtering options clicks
	 */
	$("input:radio[name=filteringOptions]").click(function () {
		var val = $(this).val();
		self.port.emit("filter", val); //val can be none, wlist or blist
	});
});

// external events listeners
self.port.on('current_filter', function (value) {
	if(!value) {
		value = 'none';
	}
	$('#filtering-tab input[name="filteringOptions"][value="' + value + '"]').prop('checked', true);
});

self.port.on('filter_save_success', function () {
	inform(self.options.filter_set, 'success', 3000);
});