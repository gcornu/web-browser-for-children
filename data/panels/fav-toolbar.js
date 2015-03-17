$(function () {
	// listen for favorites send by the addon and add them to the toolbar
	window.addEventListener('message', function (event) {
		var favorite = event.data;

		var link = $('<span>', {'href': favorite.uri});
		var title = $('<span>', {'text': favorite.title})
		var image = $('<img>', {'src': 'http://g.etfv.co/' + favorite.uri});
		var delete_image = $('<img>', {'class': 'delete-favorite', 'src': '../delete-icon.svg', 'style': 'width: 16px; height: 16px'});
		$(link).append(image).append(title).append(delete_image);

		// add click event listener
		[image, title].forEach(function (element) {
			element.click(function () {
				window.parent.postMessage({
					'type': 'fav_element_clicked',
					'href': $(this).parent().attr('href')
				}, '*');
			});
		});

		$('#favorites').append(link);
	}, false);

	// call for existing favorites
	window.parent.postMessage({
		'type': 'init'
	}, '*');

	// add new favorite button
	var image = $('<img>', {'src': '../star-icon.png', 'style': 'width: 16px; height: 16px'});
	var title = $('<span>', {'text': 'Add to favorites'});
	$('#new_favorite').append(image).append(title);

	// add click event listener to this button
	$('#new_favorite').click(function () {
		window.parent.postMessage({
			'type': 'add_favorite'
		}, '*');
	});
});