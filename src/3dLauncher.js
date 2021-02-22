
import * as THREE from 'three';
import OrbitControls from './OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { GUI } from 'three/examples/js/libs/dat.gui.min.js'


// TODO: refactor class to prototype way
/** @class Model3dLauncher used to inject 3d model to the DOM */
export default class Model3dLauncher {
    /**
     * Creates an instance of Model3dLauncher.
     *
     * @param targetDOM The DOM element where 3D model rendered
     * @param {string} modelFilePath /path/to/model.glb or .gltf
     * @param {string} dracoLibraryPath Path/to/draco Draco is Google's agorithm to read compressed 3D, can be found here: https://github.com/mrdoob/three.js/tree/dev/examples/js/libs/draco
     * @param {string} icon360ImgPath /path/to/icon360.png
     * @param {string} upholsteryTexturePath /path/to/texture.jpg
     */
    constructor (targetDOM, modelFilePath, dracoLibraryPath, icon360ImgPath, upholsteryTexturePath) {
        this.targetDOM        = targetDOM;
        this.modelFilePath    = modelFilePath;
        this.dracoLibraryPath = dracoLibraryPath;

        this.scene3D        = null; // a div to contain 3D canvas & controls
        this.icon360        = null; // <img> element
        this.icon360ImgPath = icon360ImgPath
        this.pickedColor    = "#0A0D0C";
        this.percentNumber  = null;

        this.upholsteryTexturePath = upholsteryTexturePath
        this.upholsteryTexture     = null;

        this.guiPanel      = null

        this.mixer                   = null; 
        this.scene                   = null;
        this.camera                  = null; 
        this.object                  = null; 
        this.renderer                = null;
        this.controls                = null;
        this.cameraPerspectiveHelper = null; 

        this.box   = null; 
        this.pivot = null;

        this.actions    = [];
        this.animations = [];

        this.canvasWidth  = null; 
        this.canvasHeight = null;

        this.finalRotationY    = null;

        this.mouseX = 0;
        this.mouseY = 0;

        this.targetRotationX = 0;
        this.targetRotationY = 0;
        
        this.mouseXOnPointerDown = 0;
        this.mouseYOnPointerDown = 0;

        this.clock = new THREE.Clock();

        this.targetRotationOnPointerDownX = 0;
        this.targetRotationOnPointerDownY = 0;

        this.windowHalfX = window.innerWidth / 2;
        this.windowHalfY = window.innerHeight / 2;

        this._onWindowResize        = this._onWindowResize.bind(this);
        this._onDocumentPointerUp   = this._onDocumentPointerUp.bind(this);
        this._onDocumentPointerOut  = this._onDocumentPointerOut.bind(this);
        this._onDocumentPointerDown = this._onDocumentPointerDown.bind(this);
        this._onDocumentPointerMove = this._onDocumentPointerMove.bind(this);
        this._onDocumentTouchMove   = this._onDocumentTouchMove.bind(this);
        this._onDocumentTouchStart  = this._onDocumentTouchStart.bind(this);
    }

    init() {
        if (this.targetDOM) {

            var self = this;
    
            var gltfLoader    = new GLTFLoader();
            var dracoLoader   = new DRACOLoader();
            var textureLoader = new THREE.TextureLoader();
    
            var directionalLight = new THREE.DirectionalLight( 0xffffff, 1.4 );
            var pointLight2      = new THREE.PointLight( 0xffffff, 1 );
            var pointLight       = new THREE.PointLight( 0xffffff, 1 );
            var ambientLight     = new THREE.AmbientLight(0x404040);
    
            this.scene    = new THREE.Scene();
            this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            var  rendererCanvas   = this.renderer.domElement;
            
            
            this.scene3D = document.createElement("DIV");
            this.scene3D.setAttribute("class", "scene-3d")
    
            var userNote = document.createElement("p");
            userNote.setAttribute("class", "user-note");
            var node = document.createTextNode("(Actual repressentation might be diffrent in the end product)");
            userNote.appendChild(node);
    
            this.scene3D.appendChild(userNote);
    
            this.scene3D.appendChild(rendererCanvas)
            
            this.targetDOM.appendChild(this.scene3D);
        
            // renderer
            var paddingSide = parseInt(window.getComputedStyle(this.targetDOM, null).getPropertyValue('padding-left')) * 2;
            this.canvasWidth  = this.targetDOM.offsetWidth - paddingSide;
    
            this.scene.background = new THREE.Color("#ffffff")
    
            this._setScreenSizeScene(
                {
                    setSmallScreenScene: function() {
                        self.canvasHeight = 500;
                    },
                    setMediumScreenScene: function() {
                        if (self.canvasWidth < 400) { // for small column
                            self.canvasHeight = 300;
                        } else {
                            self.canvasHeight = 400;
                        }
                    },
                    setLargeScreenScene: function() {
                        if (self.canvasWidth < 400) { // for small column
                            self.canvasHeight = 400;
                        } else {
                            self.canvasHeight = 500;
                        }
                    }
                }
            );
        
            var fov    = 70;
            var aspect = this.canvasWidth / this.canvasHeight;  // the canvas default
            var near   = 0.1;
            var far    = 10000;
        
            this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);          
            
            this._setScreenSizeScene(
                {
                    setSmallScreenScene: function() {
                        self.camera.fov = 65;
                    },
                    setMediumScreenScene: function() {
                        if (self.canvasWidth < 400) { // for small column
                            self.camera.fov = 65;
                        } else {
                            self.camera.fov = 60;
                        }
                    },
                    setLargeScreenScene: function() {
                        if (self.canvasWidth < 400) { // for small column
                            self.camera.fov = 62;
                        } else {
                            self.camera.fov = 60;
                        }
                    }
                }
            );
        
            this.camera.position.z = 5;
            this.camera.updateProjectionMatrix(); // Updates the camera projection matrix. Must be called after any change of parameters.
        
            this.renderer.setSize(this.canvasWidth, this.canvasHeight);
    
            directionalLight.position.set(1, 5, 10);
            pointLight2.position.set(-2, 0, 7);
            pointLight.position.set(10, 0, 10);
    
            this.scene.add(directionalLight);
            // this.scene.add(directionalLightHelper);
            this.scene.add(pointLight2);
            // this.scene.add(pointLightHelper2);
            this.scene.add(pointLight);
            // this.scene.add(pointLightHelper);
            this.scene.add(ambientLight);     
            
            // Orbit Controls
            this.controls = new OrbitControls( this.camera, this.renderer.domElement );
            this.controls.enableRotate = false;
    
            this.controls
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.1;
            
            this.controls.minDistance = 2.9;
            this.controls.maxDistance = 7;
            this.controls.mouseButtons = {
                LEFT: null,
                MIDDLE: THREE.MOUSE.DOLLY,
                RIGHT: THREE.MOUSE.PAN
            }
            
            this.controls.touches = {
                ONE: null,
                TWO: THREE.TOUCH.DOLLY_PAN
            };
            this.controls.update();
    
            this.renderer.domElement.addEventListener("pointerdown", this._onDocumentPointerDown, false);
            this.renderer.domElement.addEventListener("touchstart", this._onDocumentTouchStart, false);
            this.renderer.domElement.addEventListener("touchmove", this._onDocumentTouchMove, false);
            
            if (this.upholsteryTexturePath) {
                this.upholsteryTexture = textureLoader.load(this.upholsteryTexturePath, function (upholsteryTexture) {
                    upholsteryTexture.wrapS = upholsteryTexture.wrapT = THREE.RepeatWrapping;
                    upholsteryTexture.offset.set( 0, 0 );
                    upholsteryTexture.repeat.set( 5, 5 );
                    upholsteryTexture.encoding = THREE.sRGBEncoding;
                    upholsteryTexture.flipY = false;
                });
            }
    
            if (this.dracoLibraryPath && this.modelFilePath) {
                dracoLoader.setDecoderPath(this.dracoLibraryPath);
                gltfLoader.setDRACOLoader(dracoLoader);
                gltfLoader.load(this.modelFilePath,
                    function(gltf) {
                        self.object = gltf.scene;
                        
        
                        self.scene.add(self.object);
        
                        
                        self._resetGeometryVerticesToCenter();
                        
                        self._updateMaterialProps();
                            
                        if (gltf.animations.length) {
        
                            self.animations = gltf.animations;
                
                            self.mixer = new THREE.AnimationMixer(self.object);
                            
                            // Loop 
                            for (let i = 0; i < self.animations.length; i++) {
                                self.actions.push(self.mixer.clipAction(self.animations[i]));
                                self.actions[i].play();
                                self.actions[i].paused = true;
                            }
                        }
            
                        self._animate();
                        
                        self._createPanel();
    
                        if ( self.scene3D.getElementsByClassName("loading-percentage").length ) {
                            self.scene3D.getElementsByClassName("loading-percentage")[0].remove();
                        }
                    },
                    function(xhr) {
                        
                        if ( self.scene3D.getElementsByClassName("loading-percentage").length ) {
                            self.scene3D.getElementsByClassName("loading-percentage")[0].remove();
                        }
    
                        var loadingPercentage = Math.floor((xhr.loaded / xhr.total) * 100) + "%";
    
                        self.percentNumber = document.createElement("P");
                        self.percentNumber.setAttribute("class", "loading-percentage");
                        self.percentNumber.setAttribute("style", "transform: translateY(-" + self.canvasHeight/2 + "px);");
                        var node = document.createTextNode(loadingPercentage);
                        self.percentNumber.appendChild(node);
    
                        self.scene3D.appendChild(self.percentNumber);
                    },
                    function(error) {
                        console.log("An error happened", error);
                    }
                );
            } else {
                console.error("Model path or draco path not defined")
            }
    
            if ( this.icon360ImgPath ) {
                this.icon360 = document.createElement("IMG");
                this.icon360.setAttribute("class", "icon-360");
                this.icon360.setAttribute("style", "transform: translateY(-" + this.canvasHeight + "px);");
                this.icon360.setAttribute("src", this.icon360ImgPath);
                this.scene3D.appendChild(this.icon360);
            }
    
            window.addEventListener("resize", this._onWindowResize, false);
        } 
    }


    _createPanel() {
        var self = this;
        
        this.guiPanel = new GUI({ 
            width: this.canvasWidth,
            autoPlace: false
        });
        
        var guiPanel = this.guiPanel;

        guiPanel.domElement.id = "gui-3d";
        
        var upholsteryColorFolder = guiPanel.addFolder( 'Upholstery color' );
        var frameColorFolder      = guiPanel.addFolder( 'Frame color' );
        var animationsFolder      = guiPanel.addFolder( 'Animations (Play/Pause)' );

        var upholsteryColor = {
            "Black": function () {
                self.pickedColor = 0x0A0D0C
                self._updateMaterialProps()
            },
            "Charcoal": function () {
                self.pickedColor = 0x18201D
                self._updateMaterialProps()
            },
            "Light grey": function () {
                self.pickedColor = 0x40423D
                self._updateMaterialProps()
            },
            "Red": function () {
                self.pickedColor = 0x7D000C
                self._updateMaterialProps()
            },
            "Dark red": function () {
                self.pickedColor = 0x550912
                self._updateMaterialProps()
            },
            "Dark blue": function () {
                self.pickedColor = 0x041839
                self._updateMaterialProps()
            },
            "Light blue": function () {
                self.pickedColor = 0x182737
                self._updateMaterialProps()
            },
            "Buffalo brown": function () {
                self.pickedColor = 0x2B1704
                self._updateMaterialProps()
            }
        }

        var frameColor = {
            "Traffic white": function () {
                return
            }
        }

        
        for (const prop in upholsteryColor) {
            upholsteryColorFolder.add(upholsteryColor, prop);
        }

        for (const prop in frameColor) {
            frameColorFolder.add(frameColor, prop);
        }

        if (this.animations.length) {
            var animationsSettings = {};
            
            for (let i = 0; i < this.animations.length; i++) {
                var obj = {};
                
                obj[this.animations[i].name] = function() {
                    self.actions[i].paused = !self.actions[i].paused;
                }

                animationsSettings = Object.assign(animationsSettings, obj)
            }
            
            for (let j = 0; j < this.animations.length; j++) {
                animationsFolder.add(animationsSettings, this.animations[j].name);
            }
        }


        this.scene3D.appendChild(guiPanel.domElement)
    }


    _updateMaterialProps() {
        var self = this;
        if (this.object.traverse) {
            this.object.traverse( function( node ) {
                if ( node.isMesh ) { 
                    node.castShadow = true; 
                    
                    if ((node.name.includes("leather") || node.material.name.includes("leather")))
                    {
                        
                        var meshMaterial = node.material
                        delete meshMaterial._listeners; // _listeners is not a property of this MeshStandardMaterial
    
                        node.material = new THREE.MeshStandardMaterial(
                            Object.assign(meshMaterial, 
                                {
                                    map: self.upholsteryTexture,
                                    color: new THREE.Color(self.pickedColor),

                                }    
                            )
                        );
                    }
                }
    
            });
        }
    }

    _setScreenSizeScene(callbacks) {
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


    _resetGeometryVerticesToCenter() {
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


    _onWindowResize() {
        var self = this;
        this.windowHalfX = window.innerWidth / 2;
        this.windowHalfY = window.innerHeight / 2;
        
        this.canvasWidth = this.targetDOM.offsetWidth - parseInt(window.getComputedStyle(this.targetDOM, null).getPropertyValue('padding-left')) * 2;
        
        this._setScreenSizeScene(
            {
                setSmallScreenScene: function() {
                    self.canvasHeight = 500;
                    self.camera.fov = 65;
                },
                setMediumScreenScene: function() {
                    if (self.canvasWidth < 400) { // for small column
                        self.canvasHeight = 300;
                        self.camera.fov = 65;
                    } else {
                        self.canvasHeight = 400;
                        self.camera.fov = 60;
                    }
                },
                setLargeScreenScene: function() {
                    if (self.canvasWidth < 400) { // for small column
                        self.canvasHeight = 400;
                        self.camera.fov = 62;
                    } else {
                        self.canvasHeight = 500;
                        self.camera.fov = 60;
                    }
                }
            }
        );
    
        this.camera.aspect = this.canvasWidth / this.canvasHeight;
        this.camera.updateProjectionMatrix();
        
        if (this.icon360ImgPath) {
            this.icon360.setAttribute("style", "transform: translateY(-" + this.canvasHeight + "px);");
        }

        if (this.percentNumber) {
            this.percentNumber.setAttribute("style", "transform: translateY(-" + self.canvasHeight/2 + "px);");
        }


        this.guiPanel.width = this.canvasWidth;

        this.renderer.setSize(this.canvasWidth, this.canvasHeight);
    }


    _onDocumentPointerDown(event) {
        event.preventDefault();

        // Only allow LEFT mouse event
        if (event.button == 0) {
            this.renderer.domElement.addEventListener("pointermove", this._onDocumentPointerMove, false);
            this.renderer.domElement.addEventListener("pointerup", this._onDocumentPointerUp, false);
            this.renderer.domElement.addEventListener("pointerout", this._onDocumentPointerOut, false);
    
            this.mouseXOnPointerDown = event.clientX - this.windowHalfX;
            this.targetRotationOnPointerDownX = this.targetRotationX;
        
            this.mouseYOnPointerDown = event.clientY - this.windowHalfY;
            this.targetRotationOnPointerDownY = this.targetRotationY;
        }
    }
    

    _onDocumentPointerMove(event) {
        this.mouseX = event.clientX - this.windowHalfX;
        this.mouseY = event.clientY - this.windowHalfY;

        this.targetRotationY =
            this.targetRotationOnPointerDownY + (this.mouseY - this.mouseYOnPointerDown) * 0.05;
        this.targetRotationX =
            this.targetRotationOnPointerDownX + (this.mouseX - this.mouseXOnPointerDown) * 0.05;
    }


    _onDocumentPointerUp(event) {
        this._removePointerEvents();
    }


    _onDocumentPointerOut(event) {
        this._removePointerEvents();
    }


    _onDocumentTouchStart(event) {
        event.preventDefault();
        if (event.touches.length == 1) {

            this.mouseXOnPointerDown = event.touches[0].pageX - this.windowHalfX;
            this.targetRotationOnPointerDownX = this.targetRotationX;
    
            this.mouseYOnPointerDown = event.touches[0].pageY - this.windowHalfY;
            this.targetRotationOnPointerDownY = this.targetRotationY;
        } else {
            // Disable mouse events, othrewise they overlap 2 fingers touch
            this._removePointerEvents();

        }
    }


    _onDocumentTouchMove(event) {
        event.preventDefault();
        if (event.touches.length == 1) {
            var p = document.createElement("p");
            var node = document.createTextNode(JSON.stringify(event.touches.length === 1) + "dis");
            p.appendChild(node);
            this.scene3D.appendChild(p);

    
            this.mouseX = event.touches[0].pageX - this.windowHalfX;
            this.targetRotationX =
                this.targetRotationOnPointerDownX + (this.mouseX - this.mouseXOnPointerDown) * 0.05;
    
            this.mouseY = event.touches[0].pageY - this.windowHalfY;
            this.targetRotationY =
                this.targetRotationOnPointerDownY + (this.mouseY - this.mouseYOnPointerDown) * 0.05;
        } else {
            // Disable mouse events, othrewise they overlap 2 fingers touch
            this._removePointerEvents();
        }
    }


    _removePointerEvents() {
        this.renderer.domElement.removeEventListener("pointermove", this._onDocumentPointerMove, false);
        this.renderer.domElement.removeEventListener("pointerup", this._onDocumentPointerUp, false);
        this.renderer.domElement.removeEventListener("pointerout", this._onDocumentPointerOut, false);
    }


    _animate() {
        requestAnimationFrame(this._animate.bind(this));
        
        if (!this.actions.pause) {
            var delta = this.clock.getDelta();
        
            if (this.mixer) {
                this.mixer.update(delta);
            }
        }

        this.controls.update();
    
        this.render();
    }


    _refresh() {
        this.destroy();
        this.init();
    }


    render() {
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
    };


    destroy() {

        while(this.scene.children.length > 0){ 
            this.scene.remove(this.scene.children[0]); 
        };
        
        this.scene3D.remove();
        this.targetDOM.removeChild( this.renderer.domElement );
        this.controls.dispose();
        this.renderer.dispose();
    };
    

    getInfo() {
        console.log("======================");
        console.log(this.renderer.info);
        console.log(this.object);
        console.log(this.renderer);
        console.log(this.scene);
    };
};
