//ARL Game Library
//v2
//provides the basic framework for a game:
//main loop, time step, initialization, input
//by Adam Ross Le Doux

//NOTES
//requires these functions to be added to the body in the HTML:
//<body onload="this.InitGame()" onresize="this.Resize()">
//also requires a canvas with the id="thiscanvas":
//<canvas id="thiscanvas"></canvas>
//requires the following libraries to be loaded:
//arlmath.js

var ArlGame = new (function() {
	//hidden reference to self 
	//that is maintained after the constructor is called
	var library = this;

	//VARIABLES
	//time
	this.then = null;
	this.now = null;
	this.deltaTime = null;

	//cursor (mouse & touch)
	this.isCursorDown = false;
	this.cursorPos = null;

	//drawing canvas
	this.canvasId = "ArlGameCanvas";
	this.gameCanvas = null;
	this.context = null;

	//debug
	this.debugFPS = false;

	//EVENT STUB FUNCTIONS (fill in for each specific game)
	this.events = {
		resize: function() {},
		onCursorDown: function() {},
		onCursorMove: function() {},
		onCursorUp: function() {},
		init: function() {},
		mainLoop: function() {}
	};

	//FUNCTIONS
	this.resize = function() {
		library.events.resize();
	};

	this.updateCursorPosition = function(e) {
		//get the mouse position on the page
		if (e.pageX != undefined && e.pageY != undefined) {
			library.cursorPos.x = e.pageX;
			library.cursorPos.y = e.pageY;
		} else { 
			//some wonky stuff because mouse events are implemented differently in different browsers
			library.cursorPos.x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
			library.cursorPos.y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
		}
		//and adjust for the canvas's position
		library.cursorPos.x -= library.gameCanvas.offsetLeft;
		library.cursorPos.y -= library.gameCanvas.offsetTop;
	};

	this.onCursorDown = function(e) {
		e.preventDefault();
		library.updateCursorPosition(e);
		library.isCursorDown = true;

		library.events.onCursorDown();
	};

	this.onCursorMove = function(e) {
		e.preventDefault();
		library.updateCursorPosition(e);

		library.events.onCursorMove();
	};

	this.onCursorUp = function(e) {
		e.preventDefault();
		library.updateCursorPosition(e);
		library.isCursorDown = false;

		library.events.onCursorUp();
	};

	this.init = function() {
		//grab the canvas and context
		library.gameCanvas = document.getElementById(library.canvasId);
		//library.findCanvas();
		library.context = library.gameCanvas.getContext("2d");

		//if this is a touchscreen object, use touch events; otherwise, mouse events
		var supportsTouch = (typeof Touch == "object");
		if (supportsTouch) {	
			//set touch listeners
			library.gameCanvas.addEventListener("touchstart", library.onCursorDown);
			library.gameCanvas.addEventListener("touchmove", library.onCursorMove);
			library.gameCanvas.addEventListener("touchend", library.onCursorUp);
		} else {
			//set mouse listeners
			library.gameCanvas.addEventListener("mousedown", library.onCursorDown);
			library.gameCanvas.addEventListener("mousemove", library.onCursorMove);
			library.gameCanvas.addEventListener("mouseup", library.onCursorUp);
		}

		//init cursor
		this.cursorPos = new ArlMath.Point(0,0);

		library.events.init();

		//start main loop going as fast as possible
		library.then = Date.now();
		setInterval(library.mainLoop,1);
	};

	this.findCanvas = function() {
		library.gameCanvas = document.getElementById(library.canvasId);
		library.context = library.gameCanvas.getContext("2d");
		//if this is a touchscreen object, use touch events; otherwise, mouse events
		var supportsTouch = (typeof Touch == "object");
		if (supportsTouch) {	
			//set touch listeners
			library.gameCanvas.addEventListener("touchstart", library.onCursorDown);
			library.gameCanvas.addEventListener("touchmove", library.onCursorMove);
			library.gameCanvas.addEventListener("touchend", library.onCursorUp);
		} else {
			//set mouse listeners
			library.gameCanvas.addEventListener("mousedown", library.onCursorDown);
			library.gameCanvas.addEventListener("mousemove", library.onCursorMove);
			library.gameCanvas.addEventListener("mouseup", library.onCursorUp);
		}
	}

	//the main loop
	this.mainLoop = function() {
		//calculate time between this frame and the previous frame
		library.now = Date.now(); //in milliseconds
		library.deltaTime = (library.now - library.then) / 1000; //in seconds

		if (library.debugFPS) {
			console.log((1/library.deltaTime).toString() + " fps");
		}

		library.events.mainLoop();

		//keep track of time intervals
		library.then = library.now;
	};

	this.getCanvasCenter = function() {
		return new ArlMath.Point(library.gameCanvas.width*0.5, library.gameCanvas.height*0.5);
	};
})();