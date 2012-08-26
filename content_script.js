// TODO: Add a keyboard shortcut to toggle the focusser on the current page...
// TODO: Handle non-HTML pages gracefully...
// TODO: Mechanism to block a domain / single-page
// TODO: Opacity controller slider
// TODO: Feedback Tool + Take a screenshot

var VisualLayer = {
	focus_article: function(article) {
	
		// TODO: This logic doesn't work good when article.length > 1
		if(article.length != 1) return;
		
		for(var i = 0; i < article.length; i++) {
			var node = $(article[i]);
			var parent = node.parent();
			
			node.addClass("__focussed_content"); // Add a class for all article nodes for easy reference later..

			while(node.length > 0 && parent.length > 0) {
				parent.children().not(node).addClass("__focussed_unfocus");
				node = parent;
				parent = node.parent();
			}
		}
	},
	
	garbage: function(elem) {
		elem.addClass("__focussed_unfocus");
	},
	
	finalize: function() {
		// Add stylesheet..
		var sheet = document.createElement("style");
			sheet.type = "text/css";
			sheet.id = "__focussed";
			sheet.innerHTML = "@media screen {.__focussed_unfocus {opacity: 0.25; }}";
		
		(document.head || document.documentElement).appendChild(sheet);
	},
	
	toggle: function() {
		var style_node = document.getElementById("__focussed");
		if(style_node)
			style_node.disabled = !style_node.disabled;
	}
};

/**
 * @interface
 */
function Focusser() {};
Focusser.prototype.focus = function() {};
Focusser.prototype.garbage = function() {};

/**
 * Handler for Wikipedia pages
 * @constructor
 * @implements {Focusser}
 */
function WikipediaHandler() {};

WikipediaHandler.prototype.focus = function() {
	var article = $("#content");
	VisualLayer.focus_article(article);
};

WikipediaHandler.prototype.garbage = function() {
	var pattern = ".noprint,.editsection,.navbox,.metadata,.articleFeedback,.catlinks";
	VisualLayer.garbage( $(pattern) );
	$(document).on("DOMNodeInserted", ".articleFeedback", function(){ VisualLayer.garbage( $(this) );});
	// Handle - See also, Notes, References, External Links - A very hacky solution... 
	this.removeSectionType("#External_links");
	this.removeSectionType("#Further_reading");
	this.removeSectionType("#See_also");
	
	VisualLayer.garbage($("#References,.references,.seealso,.refbegin"));
	VisualLayer.garbage($(".references"));
};

/**
 * @param {string} Id based selector
 * @private
 */
WikipediaHandler.prototype.removeSectionType = function(selector) {
	var node = $(selector);
	if(node.length > 0) {
		var heading_node = node.parent();
		node = heading_node.next();
		var nodename = node.get(0).nodeName.toLowerCase();
		var count = 0;
		while(nodename !== "ol" && nodename !== "ul" && count < 3) {
			node = node.next();
			nodename = node.get(0).nodeName.toLowerCase();
			count++;
		}
		
		if(nodename === "ol" || nodename === "ul") {
			VisualLayer.garbage(node);
		}
		VisualLayer.garbage(heading_node);
	}
};

/**
 * Handler for Techcrunch.com pages
 * @constructor
 * @implements {Focusser}
 */
function TechcrunchHandler() {};
 
TechcrunchHandler.prototype.focus = function() {
	var article = $(".left-container");
	VisualLayer.focus_article(article);
};

TechcrunchHandler.prototype.garbage = function() {
	var pattern = "#comments,#post-share-widget,.lazy-share-widget,.top-featured-posts,.module-sponsored-ads";
	VisualLayer.garbage( $(pattern) );
};

// TODO: HTML5 semantic handler...

// TODO: Readability "Article Publishing Guidelines" ...

/**
 * Handler for all other pages
 * @constructor
 * @implements {Focusser}
 */
function GenericHandler() {}
 
GenericHandler.prototype.focus = function() {
	var article = $(".content");
	
	if(article.length !== 1) article = $(".yom-art-content");
	if(article.length !== 1) article = $("#content");
	
	if(article.length == 1)
		VisualLayer.focus_article(article);
}

GenericHandler.prototype.garbage = function() {
	var pattern = ".robots-nocontent,#disqus_thread";
	VisualLayer.garbage( $(pattern) );
}

var __focussed = {
	process: function() {
		if(__focussed.processed) return;
		
		var host = window.location.host;
		/** @type {Focusser} */
		var handler 
			= (host === "techcrunch.com")	? new TechcrunchHandler()
			: (host === "en.wikipedia.org")	? new WikipediaHandler()
			: new GenericHandler();
		
		if(handler) {
			handler.focus();
			handler.garbage();
			VisualLayer.finalize();
		}
		
		__focussed.processed = true;
	},
	
	processed: false
};

chrome.extension.sendMessage({}, function(response) {
	if(response.auto_start === true)
		__focussed.process();
});

window.addEventListener("keypress", function(event) {
	if(event.shiftKey && event.keyCode === 126)
		if(!__focussed.processed) 
			__focussed.process();
		else
			VisualLayer.toggle();
}, false);
