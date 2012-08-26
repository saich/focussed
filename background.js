chrome.extension.onMessage.addListener(function(request, sender, sendResponse){
	sendResponse({auto_start: true});
});