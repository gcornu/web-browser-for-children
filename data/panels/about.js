$(function () {
	setTimeout(function () {
		$('#flipbox').flip({
			direction: 'lr',
			content: $('#main-content'),
			color: '#FFFFFF',
		});
		$('body').click(function () {
			$('#flipbox').revertFlip();
		});
	}, 2500);
});