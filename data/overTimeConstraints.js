// stop loading of the page
window.stop();

// replace page content and title
if($('body').length === 0) {
	$('html').append($('<body>'));
}
$('body').empty();
$('body').append($('<div>', {'class': 'container', 'style': 'margin-top:20%'})
			.append($('<div>', {'class': 'jumbotron'})
				.append($('<h1>', {'text': String.fromCharCode('9785') + ' ' + self.options.message}))));

document.title = self.options.title;

// set favicon to null
var link = document.createElement('link');
link.type = 'image/x-icon';
link.rel = 'shortcut icon';
link.href = '';
document.getElementsByTagName('head')[0].appendChild(link);