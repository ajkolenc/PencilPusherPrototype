//ARL Physics Library
//v2
//useful physics related functions
//like collisions and gravity

//required libraries: arlmath
var ArlPhysics = new (function() {
	//hidden reference to self 
	//that is maintained after the constructor is called
	var library = this;

	//FUNCTIONS
	this.pointCircleCollision = function(point, circle) {
		return (point.distance(circle.center) < circle.radius);
	};

	this.pointRectCollision = function(point, rect) {
		return (point.x > rect.topLeft.x && 
				point.x < (rect.topLeft.x + rect.width) &&
				point.y > rect.topLeft.y &&
				point.y < (rect.topLeft.y + rect.height));
	};

	this.circleCollision = function(circle1, circle2) {
		return (circle1.center.distance(circle2.center) < (circle1.radius + circle2.radius));
	};

	this.rectCollision = function(rect1, rect2) {
		return !(	(rect1.topLeft.x > rect2.topLeft.x + rect2.width) ||
					(rect1.topLeft.x + rect1.width < rect2.topLeft.x) ||
					(rect1.topLeft.y > rect2.topLeft.y + rect2.height) ||
					(rect1.topLeft.y + rect1.height < rect2.topLeft.y)		);
	};

	this.newtonianMotion = function(currentPosition, momentum, mass, time) {
		var velocity = momentum.divide(mass); //P = m * V,   so   V = P / m
		var newPosition = currentPosition.translate(velocity.multiply(time)); //D = V * dT
		return {velocity: velocity, pos: newPosition};
	};

	this.elasticCollision = function(pos1, momentum1, pos2, momentum2) {
		//collision normal
		var collisionNormal = pos2.vectorTo(pos1).unit();

		//momentums along the normal
		var momentumAlongNormal1 = collisionNormal.multiply(momentum1.dot(collisionNormal)); // N * P.N
		var momentumAlongNormal2 = collisionNormal.multiply(momentum2.dot(collisionNormal));
		
		//swap momentums and return them both, as well as the normal
		return {momentums: [momentum1.subtract(momentumAlongNormal1).add(momentumAlongNormal2), //P - Pn1 + Pn2
							momentum2.subtract(momentumAlongNormal2).add(momentumAlongNormal1)],
				normal: collisionNormal};
	};

	this.gravity = function(pos1, mass1, pos2, mass2, gravitationalConstant) {
		//initial calculations
		var displacement = pos1.vectorTo(pos2);
		var distance = displacement.magnitude();
		var normal = displacement.unit();

		if (distance != 0) { //avoid dividing by zero
			//calculate magnitude of the gravitational force
			var gravityForce = gravitationalConstant * ( (mass1 * mass2) / Math.pow(distance,2) );

			//calculate and return the forces on both objects
			return [normal.multiply(gravityForce), normal.multiply(-1 * gravityForce)];
		}

		//fallthrough error case: return zero-vectors
		return [new ArlMath.Vector(0, 0), new ArlMath.Vector(0, 0)];
	}

	//OBJECT CONSTRUCTORS & PROTOTYPES
	this.PhysicsBody = function(x, y, r) {
		this.boundingCircle = new ArlMath.Circle(x, y, r);
		this.momentum = new ArlMath.Vector(0, 0);
		this.velocity = new ArlMath.Vector(0, 0);
		this.mass = Math.PI * Math.pow(this.boundingCircle.radius,2);
	};
	this.PhysicsBody.prototype = { 
		getPos: function() {
			return this.boundingCircle.center;
		},
		setPos: function(newCenter) {
			this.boundingCircle.center = newCenter;
		},
		getX: function() {
			return this.boundingCircle.center.x;
		},
		getY: function() {
			return this.boundingCircle.center.y;
		},
		getRadius: function() {
			return this.boundingCircle.radius;
		},
		motion: function(time) {
			var next = library.newtonianMotion(this.getPos(), this.momentum, this.mass, time);
			this.velocity = next.velocity;
			this.setPos(next.pos);
		},
		addForce: function(forceVector, time) {
			this.momentum = this.momentum.add(forceVector.multiply(time)); //dP = F * dT
		},
		addResistance: function(resistanceFactor, time) { //air or water resistance
			this.momentum = this.momentum.multiply(time * (1 - resistanceFactor));
		},
		addFriction: function(frictionFactor, frictionVector, time) { //resistance in a specific direction
			//TODO this is a stub that does nothing right now, fill this in later if necessary
		},
		collision: function(otherBody) {
			return library.circleCollision(this.boundingCircle, otherBody.boundingCircle);
		},
		elasticCollision: function(otherBody) {
			if (this.collision(otherBody)) { //make sure the objects are actually colliding
				//swap momentums
				var collision = library.elasticCollision(this.getPos(), this.momentum, otherBody.getPos(), otherBody.momentum);
				this.momentum = collision.momentums[0];
				otherBody.momentum = collision.momentums[1];

				//keep the objects from overlapping
				this.setPos( otherBody.getPos().translate(collision.normal.multiply(this.getRadius() + otherBody.getRadius())) );
			}
		},
		gravity: function(otherBody, gravitationalConstant, time) {
			var forces = library.gravity(this.getPos(), this.mass, otherBody.getPos(), otherBody.mass, gravitationalConstant);
			this.addForce(forces[0], time);
			otherBody.addForce(forces[1], time);
		}
	};
})();