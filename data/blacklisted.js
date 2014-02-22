// stop loading of the page
//window.stop();
$('html').hide();

self.port.on('allow', function () {
	$('html').show();
});

self.port.on('deny', function () {
	// replace page content and title
	document.documentElement.innerHTML = '<h1>This page is blacklisted. Go away!</h1>';
	document.title = 'Forbidden website';
	$('html').show();

	// set favicon to null
	var link = document.createElement('link');
	link.type = 'image/x-icon';
	link.rel = 'shortcut icon';
	link.href = '';
	document.getElementsByTagName('head')[0].appendChild(link);
});