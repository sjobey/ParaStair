
class sScene {
    constructor(containerID) {
        this.containerID = containerID;
        let div = $('<div></div>').attr({
            "id": containerID
        }).css({
            "position": "absolute",
            "top": 0,
            "right": 0,
            "bottom": 0,
            "left": 0,
            "width": "100%",
            "height": "100%",
            "z-index": 0
        });
        $(".scenePanel").prepend(div);
        this.lContainer = document.getElementById(this.containerID);

        this.center = new THREE.Vector3(0, 0, 0);

        this.lScene = null;
        this.lCamera = null;
        this.lControl = null;
        this.lRenderer = null;
        this.lRaycaster = null;
        this.lAmbientLight = null;
        this.lDirectionalLight = null;
        this.lSpotLight = null;

        this.options = new sSceneOptions();
        this.updateFunctions = [];

        this.mouseOnScreen = new THREE.Vector2(0, 0);
        this.mouseForRaycaster = new THREE.Vector2(0, 0);

        //default intersections??
        //this.mouseOverObjects = new THREE.Vector3(0, 0, 0);
        //this.objectOverMouse = null;
    }
    InitiateScene(options) {
        this.lScene = new THREE.Scene();
        if (options != undefined) this.options = options;
        //camera
        this.lCamera = this.BuildDefaultCamera();
        this.lScene.add(this.lCamera);
        //ambient Light
        this.lAmbientLight = this.BuildDefaultAmbientLight();
        this.lScene.add(this.lAmbientLight);

        if (this.options.enableAxis) {
            this.lScene.add(this.BuildAxisLines("axis"));
        }

        //renderer
        this.lRenderer = this.BuildWebGLRenderer();
        this.lContainer.appendChild(this.lRenderer.domElement);

        //control
        this.lControl = this.BuildOrbitControl();
        //RayCaster
        this.lRaycaster = new THREE.Raycaster();

        //Lights
        if (this.options.enableDirectionalLight) {
            this.lDirectionalLight = this.BuildDirectionalLight();
            this.lScene.add(this.lDirectionalLight);
        }
        if (this.options.enableSpotLight) {
            this.lSpotLight = this.BuildSpotLight();
            this.lScene.add(this.lSpotLight);
        }

        //window resized
        window.addEventListener('resize', this.OnWindowResized(), false);
        this.lRenderer.domElement.addEventListener('mousemove', (e) => {
            let that = this;
            e.preventDefault();

            this.mouseOnScreen = e.clientX;
            this.mouseOnScreen = e.clientY;

            that.mouseForRaycaster.x = (e.clientX / window.innerWidth) * 2 - 1;
            that.mouseForRaycaster.y = - (e.clientY / window.innerHeight) * 2 + 1;
        }, false);
    }
    BuildDefaultCamera() {
        let wid = this.lContainer.offsetWidth;
        let he = this.lContainer.offsetHeight;
        let cam = new THREE.PerspectiveCamera(this.options.cameraViewAngle, wid / he, 1, 1500);
        cam.position.x = this.options.cameraPosition.x;
        cam.position.y = this.options.cameraPosition.y;
        cam.position.z = this.options.cameraPosition.z;
        cam.lookAt(this.options.cameraTarget);
        cam.updateProjectionMatrix();

        return cam;
    }
    GetScreenPosition(pointAt) {
        // Position must be THREE.Vector3d
        var vector = pointAt.clone();
        var windowWidth = window.innerWidth;
        var widthHalf = (windowWidth / 2);
        var heightHalf = (window.innerHeight / 2);
        vector.project(this.lCamera);
        vector.x = (vector.x * widthHalf) + widthHalf;
        vector.y = - (vector.y * heightHalf) + heightHalf;
        vector.z = 0;
        return vector;
    }
    GetCurrentCameraInformation() {
        let camDirection = new THREE.Vector3();
        this.lCamera.getWorldDirection(camDirection);
        let dis = this.lControl.target.distanceTo(this.lCamera.position);
        camDirection.multiplyScalar(dis);
        let camTarget = this.lCamera.position.clone();
        camTarget.add(camDirection);
        //rounding error...
        return [this.lCamera.position.clone(), camTarget, this.lCamera.fov];
    }
    SetCamera(position, target, fov = 35) {

        this.lCamera.fov = fov;
        this.lCamera.position.copy(position);
        this.lCamera.lookAt(target);
        this.lCamera.updateProjectionMatrix();
        this.SetOrbitControl(target);
    }
    SetCameraZoomToFitToBoundingBox(sbbx, factor = 0.65) {
        let conv = new sObjectConverter();
        let size = sbbx.boundingBox.radius * factor;
        let point = conv.ToThreeVector(sbbx.boundingBox.center);

        this.center = point;
        let fovRadian = this.lCamera.fov * (Math.PI / 180);
        let distance = Math.abs(size / Math.sin(fovRadian / 2));
        let newPosition = new THREE.Vector3(distance, distance, distance);
        this.SetCamera(newPosition, point);
    }
    SetCameraZoomToFit(obj, factor = 0.65) {
        let box = new THREE.Box3();
        if (obj instanceof Array) {
            obj.forEach((o) => {
                box.expandByObject(o);
            });
        }
        else {
            box.expandByObject(obj);
        }
        let sphere = box.getBoundingSphere();
        let size = sphere.radius * factor;
        let point = sphere.center;
        this.center = point;
        let fovRadian = this.lCamera.fov * (Math.PI / 180);
        let distance = Math.abs(size / Math.sin(fovRadian / 2));
        let newPosition = new THREE.Vector3(distance, distance, distance);
        this.SetCamera(newPosition, point);
    }
    BuildOrbitControl() {
        var con = new THREE.OrbitControls(this.lCamera, this.lContainer);
        con.enableDamping = this.options.enableDamping;
        con.dampingFactor = this.options.dampingFactor;
        con.rotateSpeed = this.options.rotateSpeed;
        con.panSpeed = this.options.panSpeed;
        con.target.set(this.options.cameraTarget.x, this.options.cameraTarget.y, this.options.cameraTarget.z);
        con.update();
        return con;
    }
    SetOrbitControl(target) {
        this.lControl.target.copy(target);
        this.lControl.update();
    }
    BuildWebGLRenderer() {
        let ren = new THREE.WebGLRenderer({ antialias: true });
        let wid = this.lContainer.offsetWidth;
        let he = this.lContainer.offsetHeight;

        ren.setClearColor(0x303030, 1);
        ren.setPixelRatio(window.devicePixelRatio);
        ren.setSize(wid, he);
        ren.gammaInput = true;
        ren.gammaOutput = true;

        if (this.options.enableShadow == true) {
            ren.shadowMap.enabled = true;
            ren.shadowMap.type = THREE.PCFSoftShadowMap;
        }
        return ren;
    }
    BuildDefaultAmbientLight() {
        let amb = new THREE.AmbientLight(0x101010);
        amb.intensity = this.options.ambientLightIntensity;
        return amb;
    }
    UpdateShadowSetting() {
        if (this.options.enableShadow == true) {
            this.lRenderer.shadowMap.enabled = true;
            this.lRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
            if (this.lSpotLight != null) {
                this.lSpotLight.castShadow = true;
                this.lSpotLight.shadow.camera.near = 100;
                this.lSpotLight.shadow.camera.far = 300;
                this.lSpotLight.shadow.mapSize.width = 1024 * this.options.shadowMapFactor;
                this.lSpotLight.shadow.mapSize.height = 1024 * this.options.shadowMapFactor;
                this.lSpotLight.shadow.bias = -0.001;
                
            }
        }
        else {
            this.lRenderer.shadowMap.enabled = false;
            if (this.lSpotLight != null) {
                this.lSpotLight.castShadow = false;
            }
        }
    }
    BuildDirectionalLight() {
        let dl = new THREE.DirectionalLight(this.options.directionalLightColor, this.options.directionalLightIntensity);
        //dl.position.copy(this.options.directionalLightPosition);
        dl.position.set(-1000, 1000, 1000);
        if (this.options.enableShadow == true) {
            dl.castShadow = true;
            dl.shadow.mapSize.width = 2048;  // default
            dl.shadow.mapSize.height = 2048; // default
            dl.shadow.camera.near = 1;    // default
            dl.shadow.camera.far = 3000;     // default

            dl.shadow.camera.left = -3000
            dl.shadow.camera.top = -3000
            dl.shadow.camera.right = 3000
            dl.shadow.camera.bottom = 3000
        }
        //var helper = new THREE.DirectionalLightHelper(dl);
        //this.lScene.add(helper);
        //let shadowCameraHelper = new THREE.CameraHelper(dl.shadow.camera);
        //this.lScene.add(shadowCameraHelper);
        return dl;
    }
    BuildSpotLight() {
        let spotLight = new THREE.SpotLight(0xffffff);
        let hardcoded = [new THREE.Vector3(-50, 10, 50), new THREE.Vector3(30, 42, -32)];

        spotLight.intensity = this.options.spotLightIntensity;
        spotLight.name = 'Spot Light';
        spotLight.angle = Math.PI / 5;
        spotLight.penumbra = 0.3;
        let cv = hardcoded[0];
        cv.y += 100;
        spotLight.position.copy(cv);
        spotLight.distance = 2000;
        if (this.options.enableShadow == true) {
            spotLight.castShadow = true;
            spotLight.shadow.camera.near = 100;
            spotLight.shadow.camera.far = 300;
            spotLight.shadow.mapSize.width = 1024 * this.options.shadowMapFactor;
            spotLight.shadow.mapSize.height = 1024 * this.options.shadowMapFactor;
            spotLight.shadow.bias = -0.001;
           // this.lScene.add(new THREE.CameraHelper(spotLight.shadow.camera));
        }
        spotLight.target.position.copy(hardcoded[1]);
        spotLight.target.updateMatrixWorld();
        //this.lScene.add(new THREE.SpotLightHelper(spotLight));

        return spotLight;
    }
    SetSpotLight(posi, target, scale = 1.0) {
        let p = new THREE.Vector3(posi.x * scale, posi.y * scale, posi.z * scale);
        let t = new THREE.Vector3(target.x, target.y, target.z);

        this.lSpotLight.position.copy(p);
        this.lSpotLight.target.position.copy(t);
        this.lSpotLight.target.updateMatrixWorld();
    }
    BuildPointLight(points) {
        points.forEach((p) => {
            var light = new THREE.PointLight(0xfffef1, 0.08, 200);
            light.position.copy(p);
            this.lScene.add(light);

            //let Helper = new THREE.PointLightHelper(light);
            //this.lScene.add(Helper);
        })

    }
    BuildAxisLines(axisName, size = 10) {
        var axis = new THREE.AxesHelper(size);
        axis.rotateX(Math.PI * -0.5);

        axis.userData.name = axisName;
        return axis;
    }
    OnWindowResized() {
        let that = this;
        return () => {
            that.lCamera.aspect = this.lContainer.offsetWidth / (this.lContainer.offsetHeight);
            that.lCamera.updateProjectionMatrix();
            that.lRenderer.setSize(this.lContainer.offsetWidth, this.lContainer.offsetHeight);
        }
    }
    AddEventHandler(eventType, func, useCapture = false) {
        this.lRenderer.domElement.addEventListener(eventType, func, useCapture);
    }
    RemoveEventHandler(eventType, func, useCapture = false) {
        this.lRenderer.domElement.removeEventListener(eventType, func, useCapture);
    }
    AninmateScene() {
        requestAnimationFrame(this.AninmateScene.bind(this));
        if (this.updateFunctions.length > 0) {
            this.updateFunctions.forEach((f) => {
                f();
            })
        }
        this.lRenderer.render(this.lScene, this.lCamera);
    }
}

class sSceneOptions {
    constructor() {
        this.isTouchDevice = 'ontouchstart' in window || 'onmsgesturechange' in window;

        this.enableShadow = false;
        this.forceShadowForNewMesh = false;
        this.shadowMapFactor = 8;

        this.enableGrid = false;
        this.enableAxis = false;

        this.cameraViewAngle = 35;
        this.cameraPosition = new THREE.Vector3(-10, 30, 30);
        this.cameraTarget = new THREE.Vector3(0, 0, 0);

        this.enableDamping = true;
        this.dampingFactor = 0.6;
        this.rotateSpeed = 0.35;
        this.panSpeed = 0.1;

        this.ambientLightIntensity = 1.8;

        this.enableSpotLight = false;
        this.spotLightIntensity = 2.5;

        this.enableDirectionalLight = false;
        this.directionalLightPosition = new THREE.Vector3(300, 300, 300);
        this.directionalLightTarget = new THREE.Vector3(0, 0, 0);
        this.directionalLightColor = new THREE.Color(1, 1, 1);
        this.directionalLightIntensity = 0.9;
    }
}