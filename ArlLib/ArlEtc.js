//ARL Etcetera Library
//v2
//miscellaneous useful functions

var ArlEtc = new (function() {
	//hidden reference to self
	//that is maintained after the constructor is called
	var library = this;

	//OBJECT CONSTRUCTORS & PROTOTYPES
	this.Timer = function(timerLength) {//give a time in seconds until the timer should be done
		this.startTime = Date.now(); //milliseconds
		this.timerLength = timerLength * 1000; //translate from seconds to milliseconds
	};
	this.Timer.prototype = {
		isDone: function() {
			return Date.now() > this.startTime + this.timerLength; 
		},
		reset: function() {
			this.startTime = Date.now();
		},
		percentDone: function() {
			return Math.min( (Date.now() - this.startTime)  / this.timerLength, 1.0);
		},
		deltaTime: function() {
			return (Date.now() - this.startTime) / 1000; 
		}
	};
})();