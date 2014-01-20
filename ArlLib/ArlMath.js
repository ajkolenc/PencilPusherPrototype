//ARL Math Library
//v2
//linear algebra, vector math, etcetera

//requires: ArlDraw - this might not be a good idea but we'll see for now

var ArlMath = new (function() {
	//hidden reference to self 
	//that is maintained after the constructor is called
	var library = this;

	//FUNCTIONS
	this.radianToVector = function(radian) { //helper function for constructing vectors from radians
		return new library.Vector( Math.cos(radian), Math.sin(radian) );
	};

	this.randomPositionWithinCircle = function(center, radius) {
		var pos = new library.Point(center.x, center.y);
		pos = pos.translate(library.RadianToVector(Math.PI * 2 * Math.random()).multiply(radius * Math.random()));
		return pos;
	};

	this.randomRange = function(min, max) {
		return Math.random() * (max - min) + min;
	};

	this.randomChoice = function(choiceList) {
		return choiceList[Math.floor(library.randomRange(0,choiceList.length))];
	};

	this.degreesToRadians = function(degrees) {
		return (degrees / 180) * Math.PI;
	};

	this.radiansToDegrees = function(radians) {
		return (radians / Math.PI) * 180;
	};

	this.pathLength = function(pointArray) {
		var totalDistance = 0;
		for (var i = 1; i < pointArray.length; i++) {
			totalDistance += pointArray[i-1].distance(pointArray[i]);
		}
		return totalDistance;
	};

	//OBJECT CONSTRUCTORS & PROTOTYPES
	this.Point = function(x, y) {
		this.x = x;
		this.y = y;
	};
	this.Point.prototype = {
		distance: function(point) {
			return Math.sqrt(Math.pow(point.x - this.x,2) + Math.pow(point.y - this.y,2));
		},
		translate: function(vector) {
			return new library.Point(this.x + vector.x, this.y + vector.y);
		},
		vectorTo: function(point) {
			return new library.Vector(point.x - this.x, point.y - this.y);
		},
		midpoint: function(point) {
			return this.translate(this.vectorTo(point).divide(2));
		},
		vectorFromOrigin: function() { //a silly function that maintains the separation between Vectors and Points
			return new library.Vector(this.x - 0, this.y - 0);
		}
	};
	this.origin = new this.Point(0, 0); //the origin point (useful to have)


	this.Vector = function(x, y) {
		this.x = x;
		this.y = y;
	};
	this.Vector.prototype = {
		multiply: function(num) {
			return new library.Vector(this.x*num, this.y*num);
		},
		divide: function(num) {
			return new library.Vector(this.x/num, this.y/num);
		},
		add: function(vector) {
			return new library.Vector(this.x+vector.x, this.y+vector.y);
		},
		subtract: function(vector) {
			return new library.Vector(this.x-vector.x, this.y-vector.y);
		},
		magnitude: function() {
			return Math.sqrt(Math.pow(this.x,2) + Math.pow(this.y,2));
		},
		unit: function() {
			if (this.magnitude() == 0) {
				return new Vector(0, 0);
			} else {
				return this.divide(this.magnitude());
			}
		},
		perp: function() {
			return new library.Vector(-this.y, this.x);
		},
		dot: function(vector) {
			return (this.x * vector.x) + (this.y * vector.y);
		},
		cross: function(vector) {
			return this.perp().dot(vector);
		}
	};

	this.Basis = function(A, B) { //creates a basis from a line between two points A and B
		this.O = new library.Point(A.x, A.y); //the origin
		this.I = A.vectorTo(B); //the local x axis
		this.J = this.I.perp(); //the local y axis
	};
	this.Basis.prototype = {
		globalToLocal: function(point) { //translates a point from the global x/y coords to coords relative to the basis
			var OP = this.O.vectorTo(point);
			var x = OP.cross(this.J) / this.I.cross(this.J);
			var y = OP.cross(this.I) / this.J.cross(this.I);
			return new library.Point(x, y);
		},
		localToGlobal: function(point) { //translates a point from this basis to global x/y coords
			return this.O.translate(this.I.multiply(point.x).add(this.J.multiply(point.y)));
		}
		//NOTE: I actually think the "global" mentioned above might be a misnomer, especially if you define a basis
		//in terms of another basis - ("global" might just be the basis "above" the current one in the chain)
	}

	this.Circle = function(x, y, r) {
		this.center = new library.Point(x, y);
		this.radius = r;
	};
	this.Circle.prototype = {
		draw: function(context, color) {
			ArlDraw.drawCircle(context, this.center.x, this.center.y, this.radius, color);
		}
	}

	this.Rect = function(x, y, w, h) {
		this.center = new library.Point(x, y);
		this.topLeft = new library.Point(x-(w/2), y-(h/2));
		this.width = w;
		this.height = h;
	};

	this.Line = function(pointA, pointB) {
		this.pointA = pointA;
		this.pointB = pointB;
		this.midpoint = this.interpolate(0.5);
	};
	this.Line.prototype = {
		interpolate: function(delta) { //return a point between A and B, delta = 0 to 1
			return this.pointA.translate( this.pointA.vectorTo(this.pointB).multiply(delta) );
		},
		length: function() {
			return Math.sqrt( Math.pow(this.pointA.x - this.pointB.x, 2) + Math.pow(this.pointA.y - this.pointB.y, 2) );
		},
		closestPointOnLine: function(pointC) {
			var vectorAB = this.pointA.vectorTo(this.pointB);
			var vectorAC = this.pointA.vectorTo(pointC);
			var distanceAlongLine = vectorAC.dot(vectorAB.unit());

			if (distanceAlongLine < 0) {
				return this.pointA;
			} else if (distanceAlongLine > this.length()) {
				return this.pointB;
			} else {
				return this.interpolate(distanceAlongLine / this.length());
			}
		},
		closestPointOnLineInfinite: function(pointC) {
			var vectorAB = this.pointA.vectorTo(this.pointB);
			var vectorAC = this.pointA.vectorTo(pointC);
			var distanceAlongLine = vectorAC.dot(vectorAB.unit());
			return this.interpolate(distanceAlongLine / this.length());
		},
		slope: function() {
			return (this.pointB.y - this.pointA.y) / (this.pointB.x - this.pointA.x);
		}
	};

	this.NevilleCurve = function(pointA, pointB, pointC) {
		this.line1 = new Line(pointA, pointB);
		this.line2 = new Line(pointB, pointC);
	};
	this.NevilleCurve.prototype = {
		interpolate: function(delta) { //return a point on the curve, delta = 0 to 1
			var point1 = this.line1.interpolate(delta*2); //0 to 2
			var point2 = this.line2.interpolate((delta*2) - 1) //-1 to 1
			var crossLine = new library.Line(point1, point2);
			return crossLine.interpolate(delta);
		}
	};

	this.PointCurve = function(pointArray) {
		this.pointArray = pointArray;
		this.startPoint = pointArray[0];
		this.endPoint = pointArray[pointArray.length-1];
	};
	this.PointCurve.prototype = {
		subdivide: function() {
			var newPointArray = new Array();
			if (this.pointArray.length <= 1) {
				//if we only have 1 point, just double it - that will preserve the fact that this "curve" is essentially a point
				newPointArray.push(new library.Point(this.startPoint.x, this.startPoint.y));
				newPointArray.push(new library.Point(this.startPoint.x, this.startPoint.y));
			} else if (this.pointArray.length == 2) {
				//with two points, create two points - one a third of the way towards the second point, one two thirds
				var A = new library.Point(this.startPoint.x, this.startPoint.y);
				var D = new library.Point(this.endPoint.x, this.endPoint.y);
				var AD = new library.Line(A,D);
				var B = AD.interpolate(0.33);
				var C = AD.interpolate(0.66);
				newPointArray.push(A);
				newPointArray.push(B);
				newPointArray.push(C);
				newPointArray.push(D);
			} else {
				//the real subdivision algorithm (requires at least three points)
				var curCurve, prevCurve;

				//first points
				newPointArray.push(new library.Point(this.pointArray[0].x, this.pointArray[0].y));
				curCurve = new library.NevilleCurve(this.pointArray[0], this.pointArray[1], this.pointArray[2]);
				newPointArray.push(curCurve.interpolate(0.25));

				//middle points
				for (var i = 1; i < this.pointArray.length-2; i++) {
					newPointArray.push(new library.Point(this.pointArray[i].x,this.pointArray[i].y));

					prevCurve = curCurve;
					curCurve = new library.NevilleCurve(this.pointArray[i],this.pointArray[i+1],this.pointArray[i+2]);

					newPointArray.push(prevCurve.interpolate(0.75).midpoint(curCurve.interpolate(0.25)));
				}

				//end points
				newPointArray.push(new library.Point(this.pointArray[this.pointArray.length-2].x, this.pointArray[this.pointArray.length-2].y));
				newPointArray.push(curCurve.interpolate(0.75));
				newPointArray.push(new library.Point(this.pointArray[this.pointArray.length-1].x, this.pointArray[this.pointArray.length-1].y));
			}
			return new library.PointCurve(newPointArray);
		},
		tuck: function(delta) {
			//moves all points a percentage delta toward the midpoints of their neighbors
			var newPointArray = new Array();
			for (var i = 0; i < this.pointArray.length; i++) {
				if (i == 0 || i == (this.pointArray.length-1)) {
					newPointArray.push(new library.Point(this.pointArray[i].x, this.pointArray[i].y));
				} else {
					var prevPoint = this.pointArray[i-1];
					var curPoint = this.pointArray[i];
					var nextPoint = this.pointArray[i+1];
					var midPoint = prevPoint.midpoint(nextPoint);
					var tuckedPoint = curPoint.translate(curPoint.vectorTo(midPoint).multiply(delta));
					newPointArray.push(tuckedPoint);
				}
			}
			return new library.PointCurve(newPointArray);
		},
		smoothen: function(x) {
			//smooths the curve by tucking and untucking X number of times
			var smoothedCurve = new library.PointCurve(this.pointArray.slice(0));
			for (var i = 0; i < x; i++) {
				smoothedCurve = smoothedCurve.tuck(0.5).tuck(-0.5);
			}
			return smoothedCurve;
		}
	};
})();