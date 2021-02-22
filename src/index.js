import Model3dLauncher from './3dLauncher.js';

var G110_MODEL = new Model3dLauncher(
    document.getElementsByClassName("md:w-1/2 px-1 w-full")[0], 
    "/public/G110-0216.glb",
    "/public/draco/gltf/",
    null,
    "/public/lighter_leather.jpg"
);

G110_MODEL.init();
