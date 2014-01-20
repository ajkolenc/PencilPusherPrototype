//Animation Library
//NOTES
//*refactor update code (new basis, new line, etc)

var ArlAnim = new (function() {
	var library = this;

	//OBJECTS
	this.Frame = function(x1, y1, x2, y2, t){
		this.A = new ArlMath.Point(x1, y1);
		this.B = new ArlMath.Point(x2, y2);
		this.time = t;
	}
	this.Frame.prototype = {
		interpolate: function(frame2, time) {
			var lineA = new ArlMath.Line(this.A, frame2.A);
			var lineB = new ArlMath.Line(this.B, frame2.B);

			var delta = (time - this.time) / (frame2.time - this.time); 
			
			var newA = lineA.interpolate(delta);
			var newB = lineB.interpolate(delta);

			return new library.Frame(newA.x, newA.y, newB.x, newB.y, time);
		}
	}

	this.SkeletonBone = function(x1, y1, x2, y2, parent){
		this.A = new ArlMath.Point(x1, y1);
		this.B = new ArlMath.Point(x2, y2);

		this.parent = parent;
		
		if (this.parent != null) {
			this.localA = this.parent.basis.globalToLocal(this.A);
			this.localB = this.parent.basis.globalToLocal(this.B);

			this.parent.children.push(this);
		} else {
			this.localA = this.A;
			this.localB = this.B;
		}
		
		this.basis = new ArlMath.Basis(this.A, this.B);
		this.line = new ArlMath.Line(this.A, this.B);
		
		this.children = [];
		
		this.isASelected = false;
		this.isBSelected = false;
		
		this.frames = [];
	};
	this.SkeletonBone.prototype = {
		draw: function(context, color) {
			this.drawBone(context, color);
			//this.drawHandles(context, color);
		},
		drawSelected: function(context, color, toolIndex) {
			this.draw(context, color);
			if (toolIndex == 1) {
				this.drawFreeformHandles(context, color);
			} else if (toolIndex == 3) {
				this.drawScaleHandles(context, color);
			} else if (toolIndex == 4) {
				this.drawRotateHandles(context, color);
			} else if (toolIndex == 5) {
				this.drawPivotHandles(context, color);
			}
		},
		drawBone: function(context, color) {
			ArlDraw.drawLine(context, this.A.x, this.A.y, this.B.x, this.B.y, 2, color);
		},
		drawFreeformHandles: function(context, color) {
			ArlDraw.drawCircle(context, this.A.x, this.A.y, 5, color);
			ArlDraw.drawCircle(context, this.B.x, this.B.y, 5, color);
		},
		drawTranslateHandle: function(context, color) {
			ArlDraw.drawCircle(context, this.line.midpoint.x, this.line.midpoint.y, 10, color);
		},
		drawScaleHandles: function(context, color) {
			ArlDraw.drawRect(context, this.A.x - 5, this.A.y - 5, 10, 10, color);
			ArlDraw.drawRect(context, this.B.x - 5, this.B.y - 5, 10, 10, color);
		},
		drawRotateHandles: function(context, color) {
			this.drawFreeformHandles(context, color);
			ArlDraw.drawCircleOutline(context, this.line.midpoint.x, this.line.midpoint.y, this.line.length()/2, 2, color);
		},
		drawPivotHandles: function(context, color) {
			//this.drawFreeformHandles(context, color);
			ArlDraw.drawCircleOutline(context, this.A.x, this.A.y, 5, 2, color);
			ArlDraw.drawCircleOutline(context, this.B.x, this.B.y, 5, 2, color);

			if (this.isASelected) {
				ArlDraw.drawCircleOutline(context, this.B.x, this.B.y, this.line.length(), 2, color);
			} else if (this.isBSelected) {
				ArlDraw.drawCircleOutline(context, this.A.x, this.A.y, this.line.length(), 2, color);
			}
		},
		drawChildren: function(context, color) {
			for (var i = 0; i < this.children.length; i++) {
				this.children[i].drawBone(context, color);
				this.children[i].drawChildren(context, color);
			}
		},
		updateTransformation: function() { //apply to children after changing positions (these names need HELP dude)
			if (this.parent != null) {
				this.A = this.parent.basis.localToGlobal(this.localA);
				this.B = this.parent.basis.localToGlobal(this.localB);
			} else {
				console.log("??");
				this.A = this.localA;
				this.B = this.localB;
			}

			this.basis = new ArlMath.Basis(this.A, this.B);
			this.line = new ArlMath.Line(this.A, this.B);

			for (var i = 0; i < this.children.length; i++) {
				this.children[i].updateTransformation();
			}
		},
		freeformMove: function(pos) {
			if (this.isASelected) {
				this.changePosA(pos);	
			} else if (this.isBSelected) {
				this.changePosB(pos);
			}
		},
		translate: function(pos) {
			var tVector = this.line.midpoint.vectorTo(pos);
			this.A = this.A.translate(tVector);
			this.B = this.B.translate(tVector);
			this.updateBasis();
		},
		scale: function(pos) {
			var scaleVector = this.line.midpoint.vectorTo(this.line.closestPointOnLineInfinite(pos));

			if (this.isASelected) {
				this.A = this.line.midpoint.translate(scaleVector);
				this.B = this.line.midpoint.translate(scaleVector.multiply(-1));
			} else if (this.isBSelected) {
				this.B = this.line.midpoint.translate(scaleVector);
				this.A = this.line.midpoint.translate(scaleVector.multiply(-1));	
			}

			this.updateBasis();
		},
		rotate: function(pos) {
			var rotateVector = this.line.midpoint.vectorTo(pos).unit().multiply(this.line.length()/2);

			if (this.isASelected) {
				this.A = this.line.midpoint.translate(rotateVector);
				this.B = this.line.midpoint.translate(rotateVector.multiply(-1));
			} else if (this.isBSelected) {
				this.B = this.line.midpoint.translate(rotateVector);
				this.A = this.line.midpoint.translate(rotateVector.multiply(-1));	
			}

			this.updateBasis();
		},
		pivot: function(pos) {
			if (this.isASelected) {
				var pivotVector = this.B.vectorTo(pos).unit().multiply(this.B.distance(this.A));
				this.A = this.B.translate(pivotVector);
			} else if (this.isBSelected) {
				var pivotVector = this.A.vectorTo(pos).unit().multiply(this.A.distance(this.B));
				this.B = this.A.translate(pivotVector);
			}

			this.updateBasis();
		},
		handleGrabStart: function(pos) {
			if (pos.distance(this.A) < 5) {
				this.isASelected = true;
			} else if (pos.distance(this.B) < 5) {
				this.isBSelected = true;
			}
		},
		handleGrabEnd: function(pos) {
			this.isASelected = false;
			this.isBSelected = false;
		},
		changePosA: function(pos) {
			this.A = new ArlMath.Point(pos.x, pos.y);
			this.updateBasis();
		},
		changePosB: function(pos) {
			this.B = new ArlMath.Point(pos.x, pos.y);
			this.updateBasis();
		},
		updateBasis: function() { //apply to self after changing positions
			if (this.parent != null) {
				this.localA = this.parent.basis.globalToLocal(this.A);
				this.localB = this.parent.basis.globalToLocal(this.B);	
			} else {
				this.localA = this.A;
				this.localB = this.B;
			}
			this.basis = new ArlMath.Basis(this.A, this.B);
			this.line = new ArlMath.Line(this.A, this.B);
			for (var i = 0; i < this.children.length; i++) {
				this.children[i].updateTransformation();
			}
		},
		collision: function(pos) {
			return this.line.closestPointOnLine(pos).distance(pos) < 5;
		},
		collisionWithHandle: function(pos) {
			return (pos.distance(this.A) < 5) || (pos.distance(this.B) < 5);
		},
		saveFrame: function(time) {
			var newFrame = new library.Frame(this.localA.x, this.localA.y, this.localB.x, this.localB.y, time);

			//find the index to insert the new frame at
			var curTime = 0;
			var insertIndex = 0;
			for (insertIndex = 0; insertIndex < this.frames.length && curTime < time; insertIndex++) {
				curTime = this.frames[insertIndex].time;
				console.log("**");
				console.log(curTime);
				console.log(insertIndex);
			}

			if (this.frames.length > 0) {
				insertIndex--; //hax
			}
			
			console.log("**" + insertIndex);

			console.log(time + "/" + curTime);

			//either insert a new frame, or rewrite an old version as necessary
			if (curTime == time) {
				console.log("rewrite");
				console.log(insertIndex);
				this.frames[insertIndex] = newFrame;
			} else {
				console.log("new");
				this.frames.splice(insertIndex, 0, newFrame);
			}

			console.log(this.frames);
		},
		animate: function(time) {
			//find the frames we're between
			var frameA = this.findFrameBefore(time);
			var frameB = this.findFrameAfter(time);

			if (frameA != null && frameB != null) {
				//interpolate between the two frames
				var newFrame = frameA.interpolate(frameB, time);
				//reposition the bone
				this.moveToFrame(newFrame);
			}
		},
		animateSkeleton: function(time) {
			this.animate(time);

			for (var i = 0; i < this.children.length; i++) {
				this.children[i].animateSkeleton(time);
			}
		},
		moveToFrame: function(frame) {
			this.localA = frame.A;
			this.localB = frame.B;
			this.updateTransformation();
		},
		findFrameAt: function(time) {
			var frame = null;

			for (var i = 0; i < this.frames.length; i++) {
				if (this.frames[i].time == time) {
					frame = this.frames[i];
				}
			}

			return frame;
		},
		findFrameBefore: function(time) {
			var frame = null;

			for (var i = 0; i < this.frames.length; i++) {
				if (this.frames[i].time <= time) {
					frame = this.frames[i];
				}
			}

			return frame;
		},
		findFrameAfter: function(time) {
			var frame = null;

			for (var i = 0; i < this.frames.length && frame == null; i++) {
				if (this.frames[i].time >= time) {
					frame = this.frames[i];
				}
			}

			return frame;
		},
		isRoot: function() {
			return this.parent == null;
		}
	};
})();