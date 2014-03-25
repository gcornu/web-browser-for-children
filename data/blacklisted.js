// stop loading of the page
$('html').hide();

self.port.on('allow', function () {
	$('html').show();
});

self.port.on('deny', function () {
	window.stop();
	// replace page content and title
	if($('body').length === 0) {
		$('html').append($('<body>'));
	}
	$('body').empty();
	$('body').append($('<div>', {'class': 'container', 'style': 'margin-top:20%'})
				.append($('<div>', {'class': 'jumbotron'})
					.append($('<h1>', {'text': String.fromCharCode('9785') + ' ' + self.options.not_allowed}))));
	document.title = 'Forbidden website';

	var link = document.createElement('link');
	link.rel = 'stylesheet';
	link.href = self.options.bootstrap_url;
	document.getElementsByTagName('head')[0].appendChild(link);

	$('html').show();

	// set favicon to null
	var link = document.createElement('link');
	link.type = 'image/x-icon';
	link.rel = 'shortcut icon';
	link.href = '';
	document.getElementsByTagName('head')[0].appendChild(link);

	
});