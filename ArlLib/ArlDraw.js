//ARL Drawing Library
//v2
//useful functions for drawing and graphical effects

//requires libraries: arletc, arlmath

var ArlDraw = new (function() {
	//hidden reference to self 
	//that is maintained after the constructor is called
	var library = this;

	//FUNCTIONS
	this.clearCanvas = function(canvas) {
		canvas.width = canvas.width; //JS hack - come up with another method?
	}

	this.rainbowLerp = function(delta) {
		var hue = delta*360;
		return "hsl(" + hue.toString() + ",100%,50%)";
	};

	this.colorLerp = function(r1, g1, b1, a1, r2, g2, b2, a2, delta) {
		var r = (r1*(1-delta)) + (r2*delta);
		var g = (g1*(1-delta)) + (g2*delta);
		var b = (b1*(1-delta)) + (b2*delta);
		var a = (a1*(1-delta)) + (a2*delta);
		return "rgba(" + Math.floor(r).toString() + "," + 
					Math.floor(g).toString() + "," + 
					Math.floor(b).toString() + "," + 
					(a).toString() + ")";
	};

	/*
	this.drawCircle = function(context, circle, color) {
		//trace path of circle
		context.beginPath();
		context.arc(circle.center.x, circle.center.y, circle.radius, 0, Math.PI*2, false);
		context.closePath();
		//fill with color
		context.fillStyle = color.toHTML();
		context.fill();
	};
	*/

	this.drawLine = function(context, x1, y1, x2, y2, width, color) {
		//trace path
		context.beginPath();
		context.moveTo(x1, y1);
		context.lineTo(x2, y2);
		context.closePath();
		//stroke with color
		context.strokeStyle = color.toHTML();
		context.lineWidth = width;
		context.stroke();
	}

	this.drawPath = function(context, pointArray, width, color) {
		//trace path
		context.beginPath();
		if (pointArray.length > 0) {
			context.moveTo(pointArray[0].x, pointArray[0].y);
		}
		for (var i = 1; i < pointArray.length; i++) {
			context.lineTo(pointArray[i].x, pointArray[i].y);
		}
		//stroke with color
		context.strokeStyle = color.toHTML();
		context.lineWidth = width;
		context.stroke();
	}

	this.drawRect = function(context, x, y, w, h, color) {
		context.fillStyle = color.toHTML();
		context.fillRect(x, y, w, h);
	}

	this.drawCircle = function(context, x, y, r, color) {
		//trace path of circle
		context.beginPath();
		context.arc(x, y, r, 0, Math.PI*2, false);
		context.closePath();
		//fill with color
		context.fillStyle = color.toHTML();
		context.fill();
	};

	this.drawCircleOutline = function(context, x, y, r, width, color) {
		//trace path of circle
		context.beginPath();
		context.arc(x, y, r, 0, Math.PI*2, false);
		context.closePath();
		//stroke with color
		context.strokeStyle = color.toHTML();
		context.strokeWidth = width;
		context.stroke();
	}

	this.clipCircle = function(context, x, y, r, drawFunction) {
		//set clipping circle
		context.save(); //save the current drawing context
		context.beginPath();
		context.arc(x, y, r, 0, Math.PI*2, false);
		context.clip();

		//call the draw method (put all drawing that should be clipped inside here)
		drawFunction();

		//end the clipping circle
		context.restore(); //returns to the original context
	}

	//OBJECT CONSTRUCTORS & PROTOTYPES
	this.TextBox = function(x, y, width, fontsize, message, color) {
		this.pos = new ArlMath.Point(x, y);
		this.width = width;
		this.fontsize = fontsize; //percent
		this.height = fontsize; //placeholder, the true height gets recalculated later
		this.message = message;
		this.color = color;
	};
	this.TextBox.prototype = {
		collidesWith: function(pos) {
			return (pos.x < this.pos.x + this.width && 
					pos.x > this.pos.x && 
					pos.y < this.pos.y + this.height && 
					pos.y > this.pos.y);
		},
		draw: function(context) {
			var CurX = this.pos.x;
			var CurY = this.pos.y;
			var CurString = "";
			var CurWord = "";
			var CurLine = "";

			context.font = fontsize.toString() + "px sans-serif"; //TODO allow different fonts
			context.textBaseline = "top";
			context.fillStyle = this.color;

			for (var i = 0; i < this.message.length; i++) {
				CurWord += this.message.charAt(i); //build word

				if (this.message.charAt(i) == " " || i >= this.message.length-1) { //end of word
					if (context.measureText(CurLine + CurWord).width > this.width) {
						context.fillText(CurLine, CurX, CurY); //print current line
						//set up next line
						CurY += fontsize;
						CurLine = CurWord;
					} else {
						CurLine += CurWord; //add to current line
					}
					CurWord = "";
				}

				//make sure end of text gets printed
				if (i >= this.message.length-1) {
					context.fillText(CurLine, CurX, CurY); //print current line
				}
			}

			//update height
			this.height = CurY + fontsize - this.pos.y;
		}
	};

	this.Color = function(r, g, b, a){
		this.r = r;
		this.g = g;
		this.b = b;
		this.a = a;
	};
	this.Color.prototype = {
		toHTML: function() {
			return "rgba(" + Math.floor(this.r).toString() + "," + 
					Math.floor(this.g).toString() + "," + 
					Math.floor(this.b).toString() + "," + 
					(this.a).toString() + ")";		
		},
		lerp: function(otherColor, delta) {
			var lerpColor = new library.Color(
					(this.r*(1-delta)) + (otherColor.r*delta),
					(this.g*(1-delta)) + (otherColor.g*delta),
					(this.b*(1-delta)) + (otherColor.b*delta),
					(this.a*(1-delta)) + (otherColor.a*delta)
				);
			return lerpColor;
		}
	};

	this.ColorPalette = function(colorArray) { 
		this.colorArray = colorArray; //NOTE: you can just put (new Array(x)) if you want to start with an empty array
	};
	this.ColorPalette.prototype = {
		transition: function(otherPalette, delta) {
			return this.transitionSection(otherPalette, 0, this.colorArray.length, delta);
		},
		//transition only a single section of a palette
		//QUESTION: is this really necessary??? TODO
		transitionSection: function(otherPalette, indexStart, indexEnd, delta) {
			var transitionPalette = new library.ColorPalette(new Array(this.colorArray.length));
			for (var i = 0; i < this.colorArray.length; i++) {
				if (i >= indexStart && i < indexEnd) {
					//in the range: Lerp between the two palette's colors
					transitionPalette.colorArray[i] = this.colorArray[i].lerp(otherPalette.colorArray[i], delta); 
				} else {
					//out of the range: copy the original palette's color
					transitionPalette.colorArray[i] = new library.Color(this.colorArray[i].r,this.colorArray[i].g,this.colorArray[i].b,this.colorArray[i].a);
				}
			}
			return transitionPalette;
		}		
	};


	this.PaletteManager = function() {
		//NOTES: 
		//the palette manager allows easy creation and transitioning between palettes
		//I'm worried that it might be a little too complicated; I should take note
		//of which parts of it I use so I can cut out the fat later 
		//also, I'm worried that using strings to search for palettes
		//and colors might get slow ---arl

		//data
		this.curPalette = new library.ColorPalette(new Array(0)); //the current palette
		this.paletteArray = new Array(); //a list of all the palettes

		//nametags
		this.paletteNames = new Array();
		this.colorNames = new Array();

		//sections
		this.colorSections = new Array();

		//swapping palettes
		this.transTimer = null; //stores the timer to determine how long a palette swap should take
		this.curPaletteIndex = 0;
		this.nextPaletteIndex = 0;
		this.tranSection = null; //section of the palette to change
	};
	this.PaletteManager.prototype = {
		//functions
		addPalette: function(name) {
			//add a new palette of the same length as the current palette 
			//(in theory all palettes should stay the same length (we're screwed if that's not the case))
			var newPalette = new library.ColorPalette(new Array(this.curPalette.colorArray.length));
			this.paletteArray.push(newPalette);
			//add the name to the name list (this should be at the some position (we certainly hope so))
			this.paletteNames.push(name);
			//start of our palette with all black (just for fun)
			for (var i = 0; i < newPalette.colorArray.length; i++) {
				newPalette.colorArray[i] = new library.Color(0,0,0,1); //black, not transparent
			}
		},
		addColor: function(name, r, g, b, a) {
			//add the starting version of this color to every palette
			for (var i = 0; i < this.paletteArray.length; i++) {
				this.paletteArray[i].colorArray.push(new library.Color(r, g, b, a));
			}
			//add the name of the color to the name list (so you can find it by name rather than index)
			this.colorNames.push(name);
			//keep the curPalette up to date as well
			this.curPalette.colorArray.push(new library.Color(r, g, b, a));
		},
		addSection: function(name, startIndex, endIndex) {
			this.colorSections.push( {Name : name, Start : startIndex, End : endIndex} );
		},
		getPaletteIndex: function(name) {
			for (var i = 0; i < this.paletteNames.length; i++) {
				if (name === this.paletteNames[i]) {
					return i;
				}
			}
			return null; //nothing found
		},
		getColorIndex: function(name) {
			for (var i = 0; i < this.colorNames.length; i++) {
				if (name === this.colorNames[i]) {
					return i;
				}
			}
			return null; //nothing found
		},
		getSectionByName: function(name) {
			for (var i = 0; i < this.colorSections.length; i++) {
				if (name == this.colorSections[i].Name) {
					return this.colorSections[i];
				}
			}
			return null; //nothing found
		},
		getCurColor: function(name) {
			return this.curPalette.colorArray[this.getColorIndex(name)];
		},
		getColor: function(paletteIndex, colorIndex) {
			return this.paletteArray[paletteIndex].colorArray[colorIndex];
		},
		getColorByName: function(paletteName, colorName) {
			return this.getColor(this.getPaletteIndex(paletteName), this.getColorIndex(colorName));
		},
		getPalette: function(name) {
			return this.paletteArray[this.GetPaletteIndex(name)];
		},
		setCurPalette: function(paletteIndex) {
			this.curPaletteIndex = paletteIndex;
			this.curPalette = this.paletteArray[this.curPaletteIndex];
		},
		transitionPalette: function(paletteName1, paletteName2, time) {
			this.transTimer = new ArlEtc.Timer(time);
			this.curPaletteIndex = this.getPaletteIndex(paletteName1);
			this.nextPaletteIndex = this.getPaletteIndex(paletteName2);
			this.transSection = null; //no specific section: transition the whole palette
		},
		transitionSection: function(sectionName, paletteName1, paletteName2, time) {
			this.transTimer = new ArlEtc.Timer(time);
			this.curPaletteIndex = this.getPaletteIndex(paletteName1);
			this.nextPaletteIndex = this.getPaletteIndex(paletteName2);
			this.transSection = this.getSectionByName(sectionName);
		},
		update: function() {
			if (this.transTimer != null && !this.transTimer.isDone()) {
				if (this.transSection == null) {
					this.curPalette = this.paletteArray[this.curPaletteIndex].transition(
										this.paletteArray[this.nextPaletteIndex], 
										this.transTimer.percentDone());
				} else {
					this.curPalette = this.paletteArray[this.curPaletteIndex].transitionSection(
										this.paletteArray[this.nextPaletteIndex],
										this.transSection.Start, this.transSection.End,
										this.transTimer.percentDone());
				}
			}
		}
	};
})();