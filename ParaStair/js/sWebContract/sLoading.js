
//var sphere = new THREE.SphereGeometry(80, 20, 20);
var geometry = new THREE.TorusKnotGeometry(120, 20, 100, 8);
var vertices = geometry.vertices;
var urlBase = "";// "I:/BOS/Users/SGHComputationalTeam/SharedDataSet/Bridgify_WIP/";
var setName = 'RevitGeometry_Sample'

$(document).ready(() => {

    if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
        urlBase = '/Data/';
    }
    else {
        urlBase = location.href + 'Data/';
    }

    swarm = new Swarm();

    $.getJSON(urlBase + setName + '.json', (set) => {
        swarm.drawFromSample(set);
        swarm.animate(vertices);
    });
     
});


function Boid() {
    var vector = new THREE.Vector3(),
        _acceleration, _width = 300, _height = 300, _depth = 300, _goal, _neighborhoodRadius = 100,
        _maxSpeed = 3, _maxSteerForce = 0.1, _avoidWalls = false, _targetRadius = 30; ;
    this.position = new THREE.Vector3();
    this.velocity = new THREE.Vector3();
    this._acceleration = new THREE.Vector3();
    this.target = null;
    this.active = true;

    this.setGoal = function (target) {
        _goal = target;
    };
    this.setAvoidWalls = function (value) {
        _avoidWalls = value;
    };
    this.setWorldSize = function (width, height, depth) {
        _width = width;
        _height = height;
        _depth = depth;
        _neighborhoodRadius = width / 6;
        _maxspeed = width / 300;
        _targetRadius = width / 6;
        _targetMinRadius = width / 300;
        
    };
    this.run = function (boids) {
        if (_avoidWalls) {
            vector.set(- _width, this.position.y, this.position.z);
            vector = this.avoid(vector);
            vector.multiplyScalar(5);
            this._acceleration.add(vector);
            vector.set(_width, this.position.y, this.position.z);
            vector = this.avoid(vector);
            vector.multiplyScalar(5);
            this._acceleration.add(vector);
            vector.set(this.position.x, - _height, this.position.z);
            vector = this.avoid(vector);
            vector.multiplyScalar(5);
            this._acceleration.add(vector);
            vector.set(this.position.x, _height, this.position.z);
            vector = this.avoid(vector);
            vector.multiplyScalar(5);
            this._acceleration.add(vector);
            vector.set(this.position.x, this.position.y, - _depth);
            vector = this.avoid(vector);
            vector.multiplyScalar(5);
            this._acceleration.add(vector);
            vector.set(this.position.x, this.position.y, _depth);
            vector = this.avoid(vector);
            vector.multiplyScalar(5);
            this._acceleration.add(vector);
        }/* else {
						this.checkBounds();
					}
					*/
        if (this.position.distanceTo(this.target) < 2) {
            this.active = false;
        }
        else {
            if (Math.random() > 0.5) {
                this.flock(boids);
            }
            this.move();
        }

    };
    this.flock = function (boids) {
        if (_goal) {
            this._acceleration.add(this.reach(_goal, 0.005));
        }
        this._acceleration.add(this.alignment(boids));
        this._acceleration.add(this.cohesion(boids));
        this._acceleration.add(this.separation(boids));
    };
    this.move = function () {
        this.velocity.add(this._acceleration);
        var l = this.velocity.length();
        if (l > _maxSpeed) {
            this.velocity.divideScalar(l / _maxSpeed);
        }
        if (this.target != null) {
            var d = this.position.distanceTo(this.target);
            if (d < _targetMinRadius) {
                this.velocity = new THREE.Vector3();
            }
            else if (d < _targetRadius) {
                this.velocity.divideScalar(1.5);
            }
            
        }
        
        this.position.add(this.velocity);

        this._acceleration.set(0, 0, 0);
    };
    this.checkBounds = function () {
        if (this.position.x > _width) this.position.x = - _width;
        if (this.position.x < - _width) this.position.x = _width;
        if (this.position.y > _height) this.position.y = - _height;
        if (this.position.y < - _height) this.position.y = _height;
        if (this.position.z > _depth) this.position.z = - _depth;
        if (this.position.z < - _depth) this.position.z = _depth;
    };
  
    this.avoid = function (target) {
        var steer = new THREE.Vector3();
        steer.copy(this.position);
        steer.sub(target);
        steer.multiplyScalar(1 / this.position.distanceToSquared(target));
        return steer;
    };
    this.repulse = function (target) {
        var distance = this.position.distanceTo(target);
        if (distance < _neighborhoodRadius) {
            var steer = new THREE.Vector3();
            steer.subVectors(this.position, target);
            steer.multiplyScalar(0.5 / distance);
            this._acceleration.add(steer);
        }
    };
    this.attract = function (target) {
        var distance = this.position.distanceTo(target);
        if (distance < _neighborhoodRadius) {
            var steer = new THREE.Vector3();
            steer.subVectors(this.position, target);
            steer.multiplyScalar(0.7 / distance);
            steer.negate();
            this._acceleration.add(steer);
            
        }
    };
    this.reach = function (target, amount) {
        var steer = new THREE.Vector3();
        steer.subVectors(target, this.position);
        steer.multiplyScalar(amount);
        return steer;
    };
    this.alignment = function (boids) {
        var count = 0;
        var velSum = new THREE.Vector3();
        for (var i = 0, il = boids.length; i < il; i++) {
            if (Math.random() > 0.6) continue;
            var boid = boids[i];
            var distance = boid.position.distanceTo(this.position);
            if (distance > 0 && distance <= _neighborhoodRadius && boid.active == true) {
                velSum.add(boid.velocity);
                count++;
            }
        }
        if (count > 0) {
            velSum.divideScalar(count);
            var l = velSum.length();
            if (l > _maxSteerForce) {
                velSum.divideScalar(l / _maxSteerForce);
            }
        }
        return velSum;
    };
    this.cohesion = function (boids) {
        var count = 0;
        var posSum = new THREE.Vector3();
        var steer = new THREE.Vector3();
        for (var i = 0, il = boids.length; i < il; i++) {
            if (Math.random() > 0.6) continue;
            var boid = boids[i];
            var distance = boid.position.distanceTo(this.position);
            if (distance > 0 && distance <= _neighborhoodRadius && boid.active == true) {
                posSum.add(boid.position);
                count++;
            }
        }
        if (count > 0) {
            posSum.divideScalar(count);
        }
        steer.subVectors(posSum, this.position);
        var l = steer.length();
        if (l > _maxSteerForce) {
            steer.divideScalar(l / _maxSteerForce);
        }
        return steer;
    };
    this.separation = function (boids) {
        var posSum = new THREE.Vector3();
        var repulse = new THREE.Vector3();
        for (var i = 0, il = boids.length; i < il; i++) {
            if (Math.random() > 0.6) continue;
            var boid = boids[i];
            var distance = boid.position.distanceTo(this.position);
            if (distance > 0 && distance <= _neighborhoodRadius && boid.active == true) {
                repulse.subVectors(this.position, boid.position);
                repulse.normalize();
                repulse.divideScalar(distance);
                posSum.add(repulse);
            }
        }
        return posSum;
    }
}

function Swarm() {

    var SCREEN_WIDTH = window.innerWidth,
        SCREEN_HEIGHT = window.innerHeight,
        SCREEN_WIDTH_HALF = SCREEN_WIDTH / 2,
        SCREEN_HEIGHT_HALF = SCREEN_HEIGHT / 2;
    var camera, scene, renderer,
        particles, particle;
    var boid, boids;
    

    this.drawFromSample = function (set, factor = 0.65) {
        let vertices = [];

        let c = set.boundingBox.center
        let center = new THREE.Vector3(c.X, c.Z, -1 * c.Y);;
        let radius = set.boundingBox.radius

        for (let j = 0; j < set.vertices.length; ++j) {
            let nv = new THREE.Vector3();
            let svec = set.vertices[j];
            vertices.push(new THREE.Vector3(svec.X, svec.Z, -1 * svec.Y));
        }

        this.draw(vertices, center, radius/2, factor);
    }


    this.draw = function (vertices, center = new THREE.Vector3(), wRadius = 300, factor = 0.65) {

        this.center = center;
        this.wRadius = wRadius;
        var size = wRadius * factor;
        this.vertices = vertices;
        var radius = 0.1;

        camera = new THREE.PerspectiveCamera(75, SCREEN_WIDTH / SCREEN_HEIGHT, 1, 10000);
        
        camera.focus = new THREE.Vector3();
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x222222);
        particles = [];
        boids = [];

        let fovRadian = camera.fov * (Math.PI / 180);
        let distance = Math.abs(size / Math.sin(fovRadian / 2));
        let position = new THREE.Vector3(distance, distance, distance);

        camera.position.copy(position);
        camera.lookAt(this.center);
        camera.updateProjectionMatrix();
        
        console.log(vertices.length);

        for (var i = 0; i < this.vertices.length; i++) {
            boid = boids[i] = new Boid();
            boid.position.x = Math.random() * this.wRadius - this.wRadius/2 + this.center.x;
            boid.position.y = Math.random() * this.wRadius - this.wRadius/2 + this.center.y;
            boid.position.z = Math.random() * this.wRadius - this.wRadius/2 + this.center.z;
            boid.velocity.x = Math.random() * 2 - 1;
            boid.velocity.y = Math.random() * 2 - 1;
            boid.velocity.z = Math.random() * 2 - 1;
            boid.setAvoidWalls(true);
            boid.setWorldSize(wRadius*2, wRadius*2, wRadius*2);

            var geometry = new THREE.CircleGeometry(radius, 3);
            particle = particles[i] = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 0x00ffff, side: THREE.DoubleSide }));
            scene.add(particle);
        }
        renderer = new THREE.CanvasRenderer();
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);

        let t = document.getElementById('sLoading').appendChild(renderer.domElement);
        window.addEventListener('resize', this.onWindowResize, false);
        
    }
    this.onWindowResize = function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    this.animate = function () {
        requestAnimationFrame(this.animate.bind(this));
        this.render();
    }
    this.render = function () {
        for (var i = 0; i < this.vertices.length; i++) {
            boid = boids[i];
            boid.target = this.vertices[i];
            if (boid.position.distanceTo(boid.target) > 1.0) {
                boid.run(boids);
                boid.attract(this.vertices[i]);
                particle = particles[i];
                particle.position.copy(boids[i].position);
            }
            //var color = particle.material.color;
            //color.r = color.g = color.b = (this.wRadius * 2 / boid.position.distanceTo(boid.target))*255;
            
        }
        renderer.render(scene, camera);
    }
}


