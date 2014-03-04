// stop loading of the page
window.stop();

// replace page content and title

document.documentElement.innerHTML = '<div class="container" style="margin-top:20%"><div class="jumbotron"><h1>&#9785; Sorry, you exceeded your time limit for this category of websites!</h1></div></div>';
document.title = 'Time limit exceeded';

// set favicon to null
var link = document.createElement('link');
link.type = 'image/x-icon';
link.rel = 'shortcut icon';
link.href = '';
document.getElementsByTagName('head')[0].appendChild(link);

var css = document.createElement('link');
css.type = "text/css";
css.rel = "stylesheet";
css.href = "//netdna.bootstrapcdn.com/bootstrap/3.1.1/css/bootstrap.min.css";
document.getElementsByTagName('head')[0].appendChild(css);