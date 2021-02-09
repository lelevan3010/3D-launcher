class Model3dLauncher {
    constructor (targetDOM, glbFileSource) {
        this.targetDOM     = targetDOM;
        this.glbFileSource = glbFileSource;

        this.Scene3D = targetDOM;

        this.camera; 
        this.cameraPerspectiveHelper; 
        this.scene;
        this.renderer;
        this.object; 
        this.mixer; 
        this.controls;

        this.box; 
        this.pivot;

        this.action;

        this.clock = new THREE.Clock();

        this.targetRotationX = 0;
        this.targetRotationOnMouseDownX = 0;

        this.targetRotationY = 0;
        this.targetRotationOnMouseDownY = 0;

        this.mouseX = 0;
        this.mouseXOnMouseDown = 0;

        this.mouseY = 0;
        this.mouseYOnMouseDown = 0;

        this.windowHalfX = window.innerWidth / 2;
        this.windowHalfY = window.innerHeight / 2;

        this.finalRotationY;

        this.canvasWidth; 
        this.canvasHeight;

        // this.init = this.init.bind(this);
        // this.loadMesh = this.loadMesh.bind(this);
    }

    init = () => {
        self = this;

        this.scene = new THREE.Scene();
    
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
        this.Scene3D.appendChild(this.renderer.domElement);
    
        this.Scene3D.addEventListener("mousedown", this.onDocumentMouseDown, false);
        this.Scene3D.addEventListener("touchstart", this.onDocumentTouchStart, false);
        this.Scene3D.addEventListener("touchmove", this.onDocumentTouchMove, false);
    
        // renderer
        this.canvasWidth = this.Scene3D.offsetWidth- parseInt(window.getComputedStyle(this.Scene3D, null).getPropertyValue('padding-left')) * 2;

        this.setScreenSizeScene(
            {
                setSmallScreenScene: function() {
                    self.canvasHeight = window.innerHeight * 0.5;
                },
                setMediumScreenScene: function() {
                    self.canvasHeight = window.innerHeight * 0.75;
                },
                setLargeScreenScenes: function() {
                    self.canvasHeight = window.innerHeight * 0.65;
                }
            }
        );
    
        const fov = 70;
        const aspect = this.canvasWidth / this.canvasHeight;  // the canvas default
        const near = 0.1;
        const far = 10000;
    
        this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);          
        
        this.setScreenSizeScene(
            {
                setSmallScreenScene: function() {
                    self.camera.fov = 70;
                },
                setMediumScreenScene: function() {
                    self.camera.fov = 110;
                },
                setLargeScreenScene: function() {
                    self.camera.fov = 85;
                }
            }
        );
    
        this.camera.position.z = 5;
        
        this.camera.updateProjectionMatrix(); // Updates the camera projection matrix. Must be called after any change of parameters.
    
        this.renderer.setSize(this.canvasWidth, this.canvasHeight);
    
        var light1 = new THREE.DirectionalLight(0xffffff, 3);
        light1.position.set(0, 0, 5);
        this.scene.add(light1);
    
        const light1helper = new THREE.DirectionalLightHelper( light1, 5 );
        this.scene.add( light1helper );
    
        var light3 = new THREE.AmbientLight(0xffffff);
        this.scene.add(light3);
    
        // load meshz
        // var loader = this.loadMesh.bind(this);
        // loader(this.glbFileSource);
    
        var self = this;
        var gltfLoader = new THREE.GLTFLoader();
        var dracoLoader = new THREE.DRACOLoader();
    
        dracoLoader.setDecoderPath("/libs/draco/gltf/");
        gltfLoader.setDRACOLoader(dracoLoader);
        gltfLoader.load(this.glbFileSource,
            function (gltf) {
                console.log('glhf', gltf);
                self.object = gltf.scene;

                console.log('object', self.object)

                self.object.traverse( function( node ) {
                    if ( node.isMesh ) { node.castShadow = true; }
                });
                
                self.scene.add(self.object);

                self.resetGeometryVerticesToCenter();
    
                if (gltf.animations.length) {
                    const animations = gltf.animations;
        
                    self.mixer = new THREE.AnimationMixer(self.object);
        
                    self.action = self.mixer.clipAction(animations[0]);
        
                    self.action.play();
                }

                const axesHelper1 = new THREE.AxesHelper( 5 );
                const axesHelper2 = new THREE.AxesHelper( 5 );
                self.object.add( axesHelper1 );
                self.pivot.add(axesHelper2)
    
                self.animate();
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
        window.addEventListener("resize", this.onWindowResize, false);
    }

    setScreenSizeScene = (callbacks) => {
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
            this.canvasHeight = window.innerHeight * 0.65;
        };
    };


    resetGeometryVerticesToCenter = () => {
        // Mesh is not rotating around its center, it is because the geometry vertices are offset from the origin.
        // Repositioning by a bounding box to define a reasonable center, and then offset the mesh's position like so:
        this.box = new THREE.Box3().setFromObject( this.object );
        this.box.getCenter( this.object.position ); // this re-sets the mesh position
        this.object.position.multiplyScalar( - 1 );
        
        // Then add the mesh object to a pivot object
        this.pivot = new THREE.Group();
        this.pivot.add( this.object );
    
        this.scene.add(this.pivot);
    }


    onWindowResize = () => {
        var self = this;
        this.windowHalfX = window.innerWidth / 2;
        this.windowHalfY = window.innerHeight / 2;
        
        console.log('this.Scene3D', this.Scene3D)
        
        this.canvasWidth = this.Scene3D.offsetWidth - parseInt(window.getComputedStyle(this.Scene3D, null).getPropertyValue('padding-left')) * 2;
        
        this.setScreenSizeScene(
            {
                setSmallScreenScene: function() {
                    self.canvasHeight = window.innerHeight * 0.5;
                    self.camera.fov = 70;
                },
                setMediumScreenScene: function() {
                    self.canvasHeight = window.innerHeight * 0.75;
                    self.camera.fov = 110;
                },
                setLargeScreenScene: function() {
                    self.canvasHeight = window.innerHeight * 0.65;
                    self.camera.fov = 85;
                }
            }
        );
    
        this.camera.aspect = this.canvasWidth / this.canvasHeight;
        this.camera.updateProjectionMatrix();
    
        this.renderer.setSize(this.canvasWidth, this.canvasHeight);
    }


    onDocumentMouseDown = (event) => {
        event.preventDefault();
        
        document.addEventListener("mousemove", this.onDocumentMouseMove, false);
        document.addEventListener("mouseup", this.onDocumentMouseUp, false);
        document.addEventListener("mouseout", this.onDocumentMouseOut, false);

        this.mouseXOnMouseDown = event.clientX - this.windowHalfX;
        this.targetRotationOnMouseDownX = this.targetRotationX;
    
        this.mouseYOnMouseDown = event.clientY - this.windowHalfY;
        this.targetRotationOnMouseDownY = this.targetRotationY;
        // console.log('mouseYOnMouseDown', mouseYOnMouseDown)
    }
    

    onDocumentMouseMove = (event) => {
        this.mouseX = event.clientX - this.windowHalfX;
        this.mouseY = event.clientY - this.windowHalfY;

        this.targetRotationY =
            this.targetRotationOnMouseDownY + (this.mouseY - this.mouseYOnMouseDown) * 0.05;
        this.targetRotationX =
            this.targetRotationOnMouseDownX + (this.mouseX - this.mouseXOnMouseDown) * 0.05;
    }


    onDocumentMouseUp = (event) => {
        document.removeEventListener("mousemove", this.onDocumentMouseMove, false);
        document.removeEventListener("mouseup", this.onDocumentMouseUp, false);
        document.removeEventListener("mouseout", this.onDocumentMouseOut, false);
    }


    onDocumentMouseOut = (event) => {
        document.removeEventListener("mousemove", this.onDocumentMouseMove, false);
        document.removeEventListener("mouseup", this.onDocumentMouseUp, false);
        document.removeEventListener("mouseout", this.onDocumentMouseOut, false);
    }


    onDocumentTouchStart = (event) => {
        if (event.touches.length == 1) {
            event.preventDefault();
    
            this.mouseXOnMouseDown = event.touches[0].pageX - this.windowHalfX;
            this.targetRotationOnMouseDownX = this.targetRotationX;
    
            this.mouseYOnMouseDown = event.touches[0].pageY - this.windowHalfY;
            this.targetRotationOnMouseDownY = this.targetRotationY;
        }
    }


    onDocumentTouchMove = (event) => {
        if (event.touches.length == 1) {
            event.preventDefault();
    
            this.mouseX = event.touches[0].pageX - this.windowHalfX;
            this.targetRotationX =
                this.targetRotationOnMouseDownX + (this.mouseX - this.mouseXOnMouseDown) * 0.05;
    
            this.mouseY = event.touches[0].pageY - this.windowHalfY;
            this.targetRotationY =
                this.targetRotationOnMouseDownY + (this.mouseY - this.mouseYOnMouseDown) * 0.05;
        }
    }
    // loadMesh() {
    //     console.log("this", this)
    //     var gltfLoader = new THREE.GLTFLoader();
    //     var dracoLoader = new THREE.DRACOLoader();
    
    //     dracoLoader.setDecoderPath("/libs/draco/gltf/");
    //     gltfLoader.setDRACOLoader(dracoLoader);
        
    //     console.log(this.glbFileSource)

    //     gltfLoader.load(
    //         "public/G110-animate.glb",
    //         function (gltf) {
    //             console.log('gltf.scene',  gltf.scene)
    //             this.object = gltf.scene;

    //             // self.object.traverse( func    tion( node ) {
    //             //     if ( node.isMesh ) { node.castShadow = true; }
    //             // });
                
    //             // this.scene.add(this.object);
    //             // resetGeometryVerticesToCenter(self.object, scene);
    
    //             // if (gltf.animations.length) {
    //             //     const animations = gltf.animations;
        
    //             //     self.mixer = new THREE.AnimationMixer(self.object);
        
    //             //     self.action = self.mixer.clipAction(animations[0]);
        
    //             //     self.action.play();
    //             // }
    
    //             // Helpers for debug, remove later
    //             // const axesHelper1 = new THREE.AxesHelper( 5 );
    //             // const axesHelper2 = new THREE.AxesHelper( 5 );
    //             // self.object.add( axesHelper1 );
    //             // pivot.add(axesHelper2)
    
    //             self.animate();
    //         },
    //         // called while loading is progressing
    //         function (xhr) {
    //             console.log((xhr.loaded / xhr.total) * 100 + "%");
    //         },
    //         // called when loading has errors
    //         function (error) {
    //             console.log("An error happened", error);
    //         }
    //     );
        
    // };


    animate = () => {
        // TODO: optimize framrate
        // TODO: exceed call stacks
        requestAnimationFrame(this.animate);
    
        const delta = this.clock.getDelta();
    
        if (this.mixer) {
            this.mixer.update(delta);
        }
    
        this.render();
    }

    render = () => {
        if (this.pivot) {
            //horizontal rotation
            this.pivot.rotation.y += (this.targetRotationX - this.pivot.rotation.y) * 0.1;
            
            //vertical rotation
            this.finalRotationY = this.targetRotationY - this.pivot.rotation.x;
    
            if (this.pivot.rotation.x <= 0.6 && this.pivot.rotation.x >= -0.2) {
                this.pivot.rotation.x += this.finalRotationY * 0.1;
            };
    
            // round up the x, when it goes over limit number
            if (this.pivot.rotation.x > 0.6) {
                this.pivot.rotation.x = 0.6;
            } else if (this.pivot.rotation.x < -0.2) {
                this.pivot.rotation.x = -0.2;
            }
        }
    
        this.renderer.render(this.scene, this.camera);
    }
}

var G110 = new Model3dLauncher(document.getElementsByClassName("md:w-1/2 px-1 w-full")[1], "public/G110-animate.glb");

G110.init();
