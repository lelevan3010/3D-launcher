var Scene3D;

var camera, cameraPerspectiveHelper, scene, renderer;
var object, mixer, controls;

var box, pivot;

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

var canvasWidth, canvasHeight;

init();

function init(targetDOM, fileSource) {

    scene = new THREE.Scene();

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    Scene3D = document.getElementsByClassName("md:w-1/2 px-1 w-full")[1];
    Scene3D.appendChild(renderer.domElement);

    Scene3D.addEventListener("mousedown", onDocumentMouseDown, false);
    Scene3D.addEventListener("touchstart", onDocumentTouchStart, false);
    Scene3D.addEventListener("touchmove", onDocumentTouchMove, false);

    // renderer
    canvasWidth = Scene3D.offsetWidth- parseInt(window.getComputedStyle(Scene3D, null).getPropertyValue('padding-left')) * 2;

    setScreenSizeScene(
        {
            setSmallScreenScene: function() {
                canvasHeight = window.innerHeight * 0.5;
            },
            setMediumScreenScene: function() {
                canvasHeight = window.innerHeight * 0.75;
            },
            setLargeScreenScenes: function() {
                canvasHeight = window.innerHeight * 0.65;
            }
        }
    );

    const fov = 70;
    const aspect = canvasWidth / canvasHeight;  // the canvas default
    const near = 0.1;
    const far = 10000;

    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);          
    
    setScreenSizeScene(
        {
            setSmallScreenScene: function() {
                camera.fov = 70;
            },
            setMediumScreenScene: function() {
                camera.fov = 110;
            },
            setLargeScreenScene: function() {
                camera.fov = 85;
            }
        }
    );

    camera.position.z = 5;
    
    camera.updateProjectionMatrix(); // Updates the camera projection matrix. Must be called after any change of parameters.

    renderer.setSize(canvasWidth, canvasHeight);

    var light1 = new THREE.DirectionalLight(0xffffff, 3);
    light1.position.set(0, 0, 5);
    scene.add(light1);

    const light1helper = new THREE.DirectionalLightHelper( light1, 5 );
    scene.add( light1helper );

    var light3 = new THREE.AmbientLight(0xffffff);
    scene.add(light3);

    //load meshz
    loadingMesh("public/G110-animate.glb");

    window.addEventListener("resize", onWindowResize, false);
};


function setScreenSizeScene(callbacks) {
    var md = window.innerWidth < 1280 && window.innerWidth > 768;
    var lg = window.innerWidth > 998
    var sm = window.innerWidth < 768

    if (sm && callbacks.setSmallScreenScene) {
        callbacks.setSmallScreenScene();
    }
    else if (md && callbacks.setMediumScreenScene) {
        callbacks.setMediumScreenScene();
    } 
    else if (lg && callbacks.setLargeScreenScene) {
        callbacks.setLargeScreenScene();
    } else {
        canvasHeight = window.innerHeight * 0.65;
    };
};

function loadingMesh(modelFilePath) {
    var gltfLoader = new THREE.GLTFLoader();
    var dracoLoader = new THREE.DRACOLoader();

    dracoLoader.setDecoderPath("/libs/draco/gltf/");
    gltfLoader.setDRACOLoader(dracoLoader);

    gltfLoader.load(
        modelFilePath,
        function (gltf) {
            object = gltf.scene;
            object.traverse( function( node ) {
                if ( node.isMesh ) { node.castShadow = true; }
            } );

            resetGeometryVerticesToCenter(object, scene);

            if (gltf.animations.length) {
                const animations = gltf.animations;
    
                mixer = new THREE.AnimationMixer(object);
    
                action = mixer.clipAction(animations[0]);
    
                action.play();
            }

            // Helpers for debug, remove later
            const axesHelper1 = new THREE.AxesHelper( 5 );
            const axesHelper2 = new THREE.AxesHelper( 5 );
            object.add( axesHelper1 );
            pivot.add(axesHelper2)

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
};

function resetGeometryVerticesToCenter(object, scene) {
    // Mesh is not rotating around its center, it is because the geometry vertices are offset from the origin.
    // Repositioning by a bounding box to define a reasonable center, and then offset the mesh's position like so:
    box = new THREE.Box3().setFromObject( object );
    box.getCenter( object.position ); // this re-sets the mesh position
    object.position.multiplyScalar( - 1 );
    
    // Then add the mesh object to a pivot object
    pivot = new THREE.Group();
    pivot.add( object );

    scene.add(pivot);
}

function onWindowResize() {
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;

    canvasWidth = Scene3D.offsetWidth- parseInt(window.getComputedStyle(Scene3D, null).getPropertyValue('padding-left')) * 2;
    
    setScreenSizeScene(
        {
            setSmallScreenScene: function() {
                canvasHeight = window.innerHeight * 0.5;
                camera.fov = 70;
            },
            setMediumScreenScene: function() {
                canvasHeight = window.innerHeight * 0.75;
                camera.fov = 110;
            },
            setLargeScreenScene: function() {
                canvasHeight = window.innerHeight * 0.65;
                camera.fov = 85;
            }
        }
    );

    camera.aspect = canvasWidth / canvasHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(canvasWidth, canvasHeight);
}

//

function onDocumentMouseDown(event) {
    event.preventDefault();

    document.addEventListener("mousemove", onDocumentMouseMove, false);
    document.addEventListener("mouseup", onDocumentMouseUp, false);
    document.addEventListener("mouseout", onDocumentMouseOut, false);

    mouseXOnMouseDown = event.clientX - windowHalfX;
    targetRotationOnMouseDownX = targetRotationX;
    // console.log('mouseXOnMouseDown', mouseXOnMouseDown)

    mouseYOnMouseDown = event.clientY - windowHalfY;
    targetRotationOnMouseDownY = targetRotationY;
    // console.log('mouseYOnMouseDown', mouseYOnMouseDown)
}

function onDocumentMouseMove(event) {
    mouseX = event.clientX - windowHalfX;
    mouseY = event.clientY - windowHalfY;
    // console.log('targetRotationOnMouseDownY', targetRotationOnMouseDownY)
    // console.log('mouseY', mouseY)
    // console.log('mouseYOnMouseDown', mouseYOnMouseDown)
    targetRotationY =
        targetRotationOnMouseDownY + (mouseY - mouseYOnMouseDown) * 0.05;
    // console.log('targetRotationY', targetRotationY)
    targetRotationX =
        targetRotationOnMouseDownX + (mouseX - mouseXOnMouseDown) * 0.05;
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

    if (mixer) {
        mixer.update(delta);
    }

    render();
}

function render() {
    if (pivot) {
        //horizontal rotation
        pivot.rotation.y += (targetRotationX - pivot.rotation.y) * 0.1;
        
        //vertical rotation
        finalRotationY = targetRotationY - pivot.rotation.x;

        if (pivot.rotation.x <= 0.6 && pivot.rotation.x >= -0.2) {
            pivot.rotation.x += finalRotationY * 0.1;
        };

        // round up the x, when it goes over limit number
        if (pivot.rotation.x > 0.6) {
            pivot.rotation.x = 0.6;
        } else if (pivot.rotation.x < -0.2) {
            pivot.rotation.x = -0.2;
        }
    }

    renderer.render(scene, camera);
}
