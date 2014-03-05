// stop loading of the page
//window.stop();
$('html').hide();

self.port.on('allow', function () {
	$('html').show();
});

self.port.on('deny', function () {
	window.stop();
	// replace page content and title
	document.documentElement.innerHTML = '<div class="container" style="margin-top:20%"><div class="jumbotron"><h1>&#9785; Sorry, you are not allowed here!</h1></div></div>';
	document.title = 'Forbidden website';
	$('html').show();

	// set favicon to null
	var link = document.createElement('link');
	link.type = 'image/x-icon';
	link.rel = 'shortcut icon';
	link.href = '';
	document.getElementsByTagName('head')[0].appendChild(link);
});
