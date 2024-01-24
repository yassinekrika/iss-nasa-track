import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import gsap from 'gsap';

import starsTexture from '../img/stars.jpg';
import earthTexture from '../img/earth.jpg';

import { getLatLngObj } from "tle.js";

import * as dat from 'dat.gui'
const gui = new dat.GUI()


const ISS_TLE = `            
1 25544U 98067A   22273.35448010  .00014749  00000+0  26205-3 0  9993
2 25544  51.6446 175.5414 0002613 315.0731 151.6002 15.50416819361495`;

const options = {
    x: 0,
    y: 6.5,
    z: 5.2,
}

gui.add(options, 'x', 0, 100)
gui.add(options, 'y', 0, 100)
gui.add(options, 'z', 0, 100)

let isOnISS = false
let earthRot = true

let isZoomed = true



const ISSUrl = new URL('../assets/ISS.glb', import.meta.url)

const assetLoader = new GLTFLoader()


const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);

document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    40,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

const axesHelprt = new THREE.AxesHelper(600)
scene.add(axesHelprt)
camera.position.set(0, 0, 50);

// ! Thirs Person Camera 




let orbit = new OrbitControls(camera, renderer.domElement);

// orbit.update();






const ambientLight = new THREE.AmbientLight(0x333333);
scene.add(ambientLight);

const cubeTextureLoader = new THREE.CubeTextureLoader();
scene.background = cubeTextureLoader.load([
    starsTexture,
    starsTexture,
    starsTexture,
    starsTexture,
    starsTexture,
    starsTexture
]);

const textureLoader = new THREE.TextureLoader();

const earthGeo = new THREE.SphereGeometry(14, 1000, 1000)
const earthMat = new THREE.MeshBasicMaterial({
    map: textureLoader.load(earthTexture),
    bumpMap: textureLoader.load('../img/elev_bump_4k.jpg'),
    bumpScale: 0.005,
    specularMap: textureLoader.load('../img/water_4k.png'),
})
const earth = new THREE.Mesh(earthGeo, earthMat)
scene.add(earth)


const cloudGeo = new THREE.SphereGeometry(20, 1000, 1000)
const cloudMat = new THREE.MeshPhongMaterial({
    map: textureLoader.load('../img/fair_clouds_4k.png'),
    transparent: true
})
const cloud = new THREE.Mesh(cloudGeo, cloudMat)
scene.add(cloud)


// * HERE! ////////////////////

let model
assetLoader.load(ISSUrl.href, function (gltf) {
    model = gltf.scene

    earth.add(model)
    const jijelPos = calcPosFromLatLonRad(43.009953, -81.273613, 16.2)
    // model.rotateY(-5)

    model.position.set(jijelPos[0], jijelPos[1], jijelPos[2])
    model.scale.set(0.007, 0.007, 0.007)
}, undefined, function (error) {
    console.error(error)
})


const pointLight = new THREE.PointLight(0xFFFFFF, 2, 300)
scene.add(pointLight)

const pointLight1 = new THREE.PointLight(0xFFFFFF, 2, 300)
scene.add(pointLight1)
pointLight1.position.set(15, 15, 15)

function calcPosFromLatLonRad(lat, lon, radius) {

    var phi = (90 - lat) * (Math.PI / 180);
    var theta = (lon + 180) * (Math.PI / 180);

    x = -(radius * Math.sin(phi) * Math.cos(theta));
    z = (radius * Math.sin(phi) * Math.sin(theta));
    y = (radius * Math.cos(phi));

    return [x, y, z];

}


let latLonISS
function getISS() {
    latLonISS = getLatLngObj(ISS_TLE);
    // console.log('js thing ==> '+ latLonISS.lat +'//'+ latLonISS.lng)  

    model.position.set(calcPosFromLatLonRad(latLonISS.lat, latLonISS.lng, 16)[0], calcPosFromLatLonRad(latLonISS.lat, latLonISS.lng, 16)[1], calcPosFromLatLonRad(latLonISS.lat, latLonISS.lng, 25)[2])

}


var axisHelper2 = new THREE.AxesHelper(500)

const changeViewBtn = document.getElementById('chang-view')
const changeZoom = document.getElementById('chang-zoom')


// ! ANIMATE FUNCTION 
function animate() {
    if (model) {
        getISS()
        model.add(axisHelper2)
    }
    if (earthRot) {
        earth.rotateY(0.0002)
    } else {
        earth.rotateY(0)
    }
    orbit.update()

    renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});


changeTarget()
_changeZoom()

// !    ===============intract section


function IsNeg(position, num) {
    return position > 0 ? num : -num
}
console.log(IsNeg(-14, 2))


function _changeZoom() {
    changeZoom.addEventListener('click', () => {
        // camera.position.z = isZoomed ? -20 : 20

        gsap.to(camera.position, {
            duration: 1,
            x: isZoomed ? model.position.x + IsNeg(model.position.x, 0) : model.position.x * 2,
            y: isZoomed ? model.position.y + IsNeg(model.position.y, 1) : model.position.y * 2,
            z: isZoomed ? model.position.z + IsNeg(model.position.z, 3) : model.position.z * 2,
        })
        isZoomed = !isZoomed

        changeZoom.innerText = isZoomed ? 'zoom in +' : 'zoom out -'
        orbit.update()


    })
}



function changeTarget() {

    changeViewBtn.addEventListener('click', () => {
        if (isOnISS) {
            changeViewBtn.innerText = 'change to ISS view'
            orbit.target = earth.position
        } else {
            changeViewBtn.innerText = 'change to Earth view'
            if (model) {
                orbit.target = model.position
            }
        }
        isOnISS = !isOnISS
    })
    // stop earth rotation
    document.addEventListener('click', () => {
        earthRot = false
        console.log('earthRot', earthRot)
    })
    renderer.render(scene, camera);

}


