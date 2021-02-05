var Scene3D;

var camera, scene, renderer;
var object, mixer;

var action;

var clock = new THREE.Clock();

var targetRotationX = 0;
var targetRotationOnMouseDownX = 0;

var targetRotationY = 0;
var targetRotationOnMouseDownY = 0;

var mouseX = 0;
var mouseXOnMouseDown = 0;

var mouseY = 0;
var mouseYOnMouseDown = 0;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

var finalRotationY;

init();

function init(targetDOM, fileSource) {
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / 2 / window.innerHeight,
        0.1,
        10000
    );
    camera.position.z = 5;
    camera.position.y = 2;

    scene = new THREE.Scene();

    // lights
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 3);
    hemiLight.color.setHSL(0.6, 1, 0.6);
    hemiLight.groundColor.setHSL(0.095, 1, 0.75);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    var light1 = new THREE.DirectionalLight(0xffffff, 3);
    light1.position.set(0, 0, 5);
    scene.add(light1);

    var light3 = new THREE.AmbientLight(0x222222);
    scene.add(light3);

    //load meshz
    loadingMesh("public/G110-animate.glb");

    // renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth / 2, window.innerHeight);

    Scene3D = document.getElementsByClassName("md:w-1/2 px-1 w-full")[1];
    Scene3D.appendChild(renderer.domElement);

    Scene3D.addEventListener("mousedown", onDocumentMouseDown, false);
    Scene3D.addEventListener("touchstart", onDocumentTouchStart, false);
    Scene3D.addEventListener("touchmove", onDocumentTouchMove, false);

    //

    window.addEventListener("resize", onWindowResize, false);
}

function loadingMesh(modelFilePath) {
    var gltfLoader = new THREE.GLTFLoader();
    var dracoLoader = new THREE.DRACOLoader();

    dracoLoader.setDecoderPath("/libs/draco/gltf/");
    gltfLoader.setDRACOLoader(dracoLoader);

    gltfLoader.load(
        modelFilePath,
        function (gltf) {
            console.log(gltf);
            object = gltf.scene;
            object.position.set(0, 0, 0);
            object.traverse( function( node ) {

                if ( node.isMesh ) { node.castShadow = true; }
        
            } );

            scene.add(object);

            const animations = gltf.animations;
            console.log(animations);

            mixer = new THREE.AnimationMixer(object);

            action = mixer.clipAction(animations[0]);

            console.log(action);

            action.play();
            // walkAction = mixer.clipAction(animations[3]);
            // runAction = mixer.clipAction(animations[1]);

            // activateAllActions();

            animate();
        },
        // called while loading is progressing
        function (xhr) {
            console.log((xhr.loaded / xhr.total) * 100 + "%");
        },
        // called when loading has errors
        function (error) {
            console.log("An error happened", error);
        }
    );
}

function onWindowResize() {
    windowHalfX = window.innerWidth / 2 / 2;
    windowHalfY = window.innerHeight / 2;

    camera.aspect = window.innerWidth / 2 / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth / 2, window.innerHeight);
}

//

function onDocumentMouseDown(event) {
    event.preventDefault();

    document.addEventListener("mousemove", onDocumentMouseMove, false);
    document.addEventListener("mouseup", onDocumentMouseUp, false);
    document.addEventListener("mouseout", onDocumentMouseOut, false);

    mouseXOnMouseDown = event.clientX - windowHalfX;
    targetRotationOnMouseDownX = targetRotationX;

    mouseYOnMouseDown = event.clientY - windowHalfY;
    targetRotationOnMouseDownY = targetRotationY;
}

function onDocumentMouseMove(event) {
    mouseX = event.clientX - windowHalfX;
    mouseY = event.clientY - windowHalfY;

    targetRotationY =
        targetRotationOnMouseDownY + (mouseY - mouseYOnMouseDown) * 0.02;
    targetRotationX =
        targetRotationOnMouseDownX + (mouseX - mouseXOnMouseDown) * 0.02;
}

function onDocumentMouseUp(event) {
    document.removeEventListener("mousemove", onDocumentMouseMove, false);
    document.removeEventListener("mouseup", onDocumentMouseUp, false);
    document.removeEventListener("mouseout", onDocumentMouseOut, false);
}

function onDocumentMouseOut(event) {
    document.removeEventListener("mousemove", onDocumentMouseMove, false);
    document.removeEventListener("mouseup", onDocumentMouseUp, false);
    document.removeEventListener("mouseout", onDocumentMouseOut, false);
}

function onDocumentTouchStart(event) {
    if (event.touches.length == 1) {
        event.preventDefault();

        mouseXOnMouseDown = event.touches[0].pageX - windowHalfX;
        targetRotationOnMouseDownX = targetRotationX;

        mouseYOnMouseDown = event.touches[0].pageY - windowHalfY;
        targetRotationOnMouseDownY = targetRotationY;
    }
}

function onDocumentTouchMove(event) {
    if (event.touches.length == 1) {
        event.preventDefault();

        mouseX = event.touches[0].pageX - windowHalfX;
        targetRotationX =
            targetRotationOnMouseDownX + (mouseX - mouseXOnMouseDown) * 0.05;

        mouseY = event.touches[0].pageY - windowHalfY;
        targetRotationY =
            targetRotationOnMouseDownY + (mouseY - mouseYOnMouseDown) * 0.05;
    }
}

function animate() {
    // TODO: optimize framrate
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    mixer.update(delta);

    render();
}

function render() {
    if (object) {
        //horizontal rotation
        object.rotation.y += (targetRotationX - object.rotation.y) * 0.1;

        //vertical rotation
        finalRotationY = targetRotationY - object.rotation.x;

        if (object.rotation.x <= 1 && object.rotation.x >= -1) {
            object.rotation.x += finalRotationY * 0.1;
        }
        if (object.rotation.x > 1) {
            object.rotation.x = 1;
        } else if (object.rotation.x < -1) {
            object.rotation.x = -1;
        }
    }

    renderer.render(scene, camera);
}
