setupMobileDebug();

import { ARButton } from './ARButton.js';

let scene, camera, raycaster, renderer, session;
let loader;
let reticle, objBox;

const models = [['golf', 'nike', 'padding', 'pilates','backpack','ballet','bikini'],
                ['sofa1', 'sofa2', 'carpet'],
                ['eiffel', 'croissant', 'car'],
                []];
const modelExist = {};
const modelColor = {};
let menuSelected = 0; //null
let selected = null;
let cameraMode = false;
let btnClicked = null;
let dropReady = false;
let menuOpened = false;

const buttonUI1 = document.getElementById("icon-buttons");
const buttonUI2 = document.getElementById("bottomSection");
const touchScreen = document.getElementById("topSection");
const deleteButton = document.getElementById("delete");

let singleTouchDown=false, doubleTouchDown=false, pressed=false;
let touchX1, touchY1, touchX2, touchY2, deltaX1=0, deltaY1=0;
let pointer = new THREE.Vector2();
let distance, deltaDistance;
let pressedTime = 0;

init();
animate();

function setupMobileDebug() {
    // First thing we do is setup the mobile debug console
    // This library is very big so only use it while debugging
    // just comment it out when your app is done
    const containerEl = document.getElementById("console-ui");
    eruda.init({
      container: containerEl
    });
    const devToolEl = containerEl.shadowRoot.querySelector('.eruda-dev-tools');
    devToolEl.style.height = '40%'; // control the height of the dev tool panel
}

function init() {
    const container = document.createElement('div');
    document.body.appendChild(container);

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 40);

    raycaster = new THREE.Raycaster();
    raycaster.far = 0;

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true; // we have to enable the renderer for webxr
    container.appendChild(renderer.domElement);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x808080, 1);
    scene.add(hemiLight);

    const ambiLight = new THREE.AmbientLight(0xffffff);
    scene.add(ambiLight);

    loader = new THREE.GLTFLoader();

    addReticleToScene();

    renderer.domElement.style.display = "none";

    window.addEventListener('resize', onWindowResize, false);

}

function addReticleToScene(){
    const geometry = new THREE.RingBufferGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2);
    const material = new THREE.MeshBasicMaterial();

    reticle = new THREE.Mesh(geometry, material);

    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);
}

function loadGLBFile(select, reti){
    if(select in modelExist === false){
        loader.load(
            `./image/glb/${select}.glb`,
            function (glb) {
                glb.scene.position.setFromMatrixPosition(reti.matrix);
                //glb.scene.quaternion.setFromRotationMatrix(reti.matrix);
                glb.scene.scale.set(0,0,0);
                scene.add(glb.scene);
                modelExist[select] = glb.scene;

                glb.scene.traverse((child)=>{ //material 바꾸기
                    if(!child.isMesh) return;
                    else{
                        const prevMaterial = child.material;
                        child.material = new THREE.MeshPhongMaterial();
                        THREE.MeshBasicMaterial.prototype.copy.call(child.material, prevMaterial);
                    }
                });
                
                if (modelColor[select] === undefined)
                    modelColor[select] = glb.scene.children[0].material.color.clone();

                modelAppear(select);

                if(objBox === undefined){ //objBox 한번만 소환해놓기
                    objBox = new THREE.BoxHelper(glb.scene, 0xffff00);
                    objBox.visible = false;
                    scene.add(objBox);
                }
            },
            function (xhr) {
                //console.log((xhr.loaded / xhr.total * 100) + '% loaded' );
            },
            function (error) {
                console.error(error);
            }
        );
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    renderer.setAnimationLoop(render);
}

let hitTestSource = null;
let localSpace = null;
let hitTestSourceInitialized = false;

async function initializeHitTestSource(){
    session = renderer.xr.getSession();
    const viewerSpace = await session.requestReferenceSpace("viewer"); //real world place
    hitTestSource = await session.requestHitTestSource({ space: viewerSpace });
    localSpace = await session.requestReferenceSpace("local"); // phone place
    hitTestSourceInitialized = true;

    session.addEventListener("end", () => {
        hitTestSourceInitialized = false;
        hitTestSource = null;
        for(let i=0; i<models[menuSelected].length; i++){
            document.getElementById(models[menuSelected][i]).style.display = "none";
        }
        menuSelected = null;
        
        for(let model of Object.keys(modelExist)){
            scene.remove(modelExist[model]);
            delete modelColor[model];
            delete modelExist[model];
        }
    });
}

function render(timestamp, frame) {
    if(pressedTime !== 0 && Date.now()-pressedTime > 800){
        pressed = true;
        pressedTime = 0;
        if(modelExist[selected] !== undefined){
            deleteButton.style.width = "60px";
            objBox.setFromObject(modelExist[selected]);
            objBox.visible = true;
        }
    }

    if(frame){
        if(!hitTestSourceInitialized){
            initializeHitTestSource();
        }
        if(hitTestSourceInitialized && cameraMode === false){
            const hitTestResults = frame.getHitTestResults(hitTestSource); //array
            if(hitTestResults.length > 0){
                const hit = hitTestResults[0]; //closest to the camera
                const pose = hit.getPose(localSpace); //local point
                reticle.visible = true;
                reticle.matrix.fromArray(pose.transform.matrix);
            } else {
                reticle.visible = false;
            }
        }
        renderer.render(scene, camera);
    }
}

function modelAppear(selected){
    let i=0;
    const appear = setInterval(()=>{
        modelExist[selected].scale.set(i,i,i);
        i+=0.02;

        if(i >= 0.5){
            modelExist[selected].scale.set(0.5,0.5,0.5);
            clearInterval(appear);
            return;
        }
    }, 10);
}

function modelDisappear(selected){
    let i = modelExist[selected].scale.x;
    let div = i/25;
    const disappear = setInterval(()=>{
        modelExist[selected].scale.set(i,i,i);
        i-=div;

        if(i<=0){
            scene.remove(modelExist[selected]);
            delete modelExist[selected];
            delete modelColor[selected];
            selected = null;
            clearInterval(disappear);
            return;
        }
    }, 10);
}

document.getElementById("AR").addEventListener('click', (e)=>{
    const click = e.target;
    while(!click.classList.contains('arButton')){
        click = click.parentNode;
        if(click.nodeName == 'BODY'){
            click = null;
            return;
        }
    }
    menuSelected = click.dataset.value;
    ARButton.createButton(renderer,{
        requiredFeatures : ["hit-test"],
        optionalFeatures: ["dom-overlay"],
        domOverlay: {root: document.body}
    }, menuSelected);

    for(let i=0; i<models[menuSelected].length; i++){
        document.getElementById(models[menuSelected][i]).style.display = "flex";
    }
});

document.getElementById("button-menu").addEventListener('click', ()=>{
    document.getElementById("mySidenav").style.width = "240px";
    menuOpened = true;
});

document.getElementById("button-photo").addEventListener('click', ()=>{
    if(cameraMode === false){
        cameraMode = true;
        reticle.visible = false;
        buttonUI1.style.marginTop = "-30px";
        buttonUI2.style.height = "0px";
    }
});

document.getElementById("mySidenav").addEventListener('click', (e)=>{
    let click = e.target;
    while(!click.classList.contains('ar-object')){
        click = click.parentNode;
        if(click.nodeName == 'BODY'){
            click = null;
            return;
        }
    }
    if(click !== null){
        for(let i=0; i<models[menuSelected].length; i++){
            document.getElementById(models[menuSelected][i]).style.display = "none";
        }
        menuSelected = click.dataset.value;
        for(let i=0; i<models[menuSelected].length; i++){
            document.getElementById(models[menuSelected][i]).style.display = "flex";
        }
    }
});

document.getElementById("main").addEventListener('touchstart', (e)=>{
    if(menuOpened){
        let click = e.target;
        if(!(click.classList.contains('sidenav') || click.classList.contains('ar-object'))){
            document.getElementById("mySidenav").style.width = "0";
            menuOpened = false;
        }
    }
    else{
        btnClicked = e.target;
        while(!btnClicked.classList.contains('modelSelect')){
            btnClicked = btnClicked.parentNode;
            if(btnClicked.nodeName == 'BODY'){
                btnClicked = null;
                return;
            }
        }
        if(btnClicked !== null){
            selected = btnClicked.dataset.value;
            btnClicked.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
            if(document.getElementById("touchedBtn") === null){
                const dot = document.createElement("div");
                dot.classList.add("dot");
                dot.id = "touchedBtn";
                dot.style.backgroundImage = `url("./image/web_xr_image/${btnClicked.dataset.value}.png")`;
                dot.style.display = "none";
                document.body.append(dot);
            }
        }
    }
})

document.getElementById("main").addEventListener('touchmove', (e)=>{
    if(btnClicked !== null){
        const dot = document.getElementById("touchedBtn");
        if(e.touches[0].pageY < window.innerHeight-150){
            //console.log(`${btnClicked.dataset.value} moving`);
            dot.style.top = `${e.touches[0].pageY}px`;
            dot.style.left = `${e.touches[0].pageX}px`;
            dot.style.display = "block";
            dropReady = true;
        }
        else{
            dot.style.display = "none";
            dropReady = false;
        }
    }
})

document.getElementById("main").addEventListener('touchend', ()=>{
    if(btnClicked !== null){
        const dot = document.getElementById("touchedBtn");
        dot.remove();
        if(dropReady === true){
            //console.log(`${btnClicked.dataset.value} drop`);
            if(reticle.visible){
                loadGLBFile(selected, reticle);
            }
            dropReady = false;
        }
        btnClicked.style.backgroundColor = "rgba(255, 255, 255, 0.3)";
        btnClicked = null;
    }
})

touchScreen.addEventListener('touchstart', e=>{
    if(e.targetTouches.length == 1){
        if(cameraMode === true){
            cameraMode = false;
            buttonUI1.style.marginTop = "20px";
            buttonUI2.style.height = "150px";
        }
        else{
            singleTouchDown = true;
            touchX1 = e.touches[0].pageX;
            touchY1 = e.touches[0].pageY;
            pressedTime = Date.now();

            raycaster.far = 1000;
            pointer.x = (touchX1/window.innerWidth) * 2 - 1;
            pointer.y = -(touchY1/window.innerHeight) * 2 + 1;
            raycaster.setFromCamera(pointer, camera);  
            if(Object.keys(modelExist).length > 0){
                const intersectsArray = raycaster.intersectObjects(Object.values(modelExist));
                if(intersectsArray.length > 0){
                    selected = intersectsArray[0].object.name;
                    modelExist[selected].children[0].material.color.copy(modelColor[selected]);
                    modelExist[selected].children[0].material.color.offsetHSL(0, 0, -0.5);

                    const modelTouch = setInterval(()=>{
                        modelExist[selected].children[0].material.color.offsetHSL(0, 0, 0.01);
                        if(modelExist[selected].children[0].material.color.getHSL(new THREE.Color).l >= modelColor[selected].getHSL(new THREE.Color).l){
                            modelExist[selected].children[0].material.color.copy(modelColor[selected]);
                            clearInterval(modelTouch);
                            return;
                        }
                    }, 10);
                }
            }
        }
    }
    else if(e.targetTouches.length >= 2){
        singleTouchDown = false;
        doubleTouchDown = true;
        pressed = false;
        objBox.visible = false;
        deleteButton.style.width = "0px";
        pressedTime = 0;
        raycaster.far = 0;

        touchX1 = e.touches[0].pageX;
        touchY1 = e.touches[0].pageY;
        touchX2 = e.touches[1].pageX;
        touchY2 = e.touches[1].pageY;
        distance = Math.sqrt(Math.pow(touchX2-touchX1, 2)
                    + Math.pow(touchY2-touchY1, 2));
    }
}, false);

touchScreen.addEventListener('touchend', e=>{
    if(e.targetTouches.length == 0){
        singleTouchDown = false;
        pressedTime = 0;
        raycaster.far = 0;
        if(pressed === true){
            const del = deleteButton.getBoundingClientRect();
            if(touchX1 >= del.left && touchX1 <= del.right && touchY1 >= del.top && touchY1 <= del.bottom){
                modelDisappear(selected);
            }
            pressed = false;
            if(objBox !== undefined) objBox.visible = false;
            deleteButton.style.width = "0px";
        }
    }
    else if(e.targetTouches.length == 1){
        doubleTouchDown = false;
    }
    else if(e.targetTouches.length >= 2){
        doubleTouchDown = true;
    }
}, false);

touchScreen.addEventListener('touchmove', e=>{
    if(doubleTouchDown === true){
        touchX1 = e.touches[0].pageX;
        touchY1 = e.touches[0].pageY;
        touchX2 = e.touches[1].pageX;
        touchY2 = e.touches[1].pageY;
        deltaDistance = Math.sqrt(Math.pow(touchX2-touchX1, 2) + Math.pow(touchY2-touchY1, 2));

        if(selected in modelExist){
            let deltaScale = modelExist[selected].scale.x += (deltaDistance-distance)/100;
            if(deltaScale < 0.05){
                modelExist[selected].scale.set(0.05, 0.05, 0.05);
            }
            else{
                modelExist[selected].scale.set(deltaScale,deltaScale,deltaScale);
            }
        }

        distance = deltaDistance;
    }
    else if(pressed === true){
        deltaX1 = e.touches[0].pageX - touchX1;
        deltaY1 = e.touches[0].pageY - touchY1;
        touchX1 = e.touches[0].pageX;
        touchY1 = e.touches[0].pageY;

        if(selected in modelExist){
            const modelMove = new THREE.Vector2(deltaX1, deltaY1);
            const cameraAngle = new THREE.Vector2(camera.getWorldDirection(new THREE.Vector3).x, camera.getWorldDirection(new THREE.Vector3).z);
            cameraAngle.normalize();
            cameraAngle.rotateAround(new THREE.Vector2(), Math.PI/2);
            modelMove.rotateAround(new THREE.Vector2(), cameraAngle.angle());
            modelExist[selected].position.x += modelMove.x/300;
            modelExist[selected].position.z += modelMove.y/300;
            objBox.update();
        }
    }
    else if(singleTouchDown === true){
        deltaX1 = e.touches[0].pageX - touchX1;
        deltaY1 = e.touches[0].pageY - touchY1;
        touchX1 = e.touches[0].pageX;
        touchY1 = e.touches[0].pageY;
        pressedTime = 0;

        if(selected in modelExist){
            modelExist[selected].rotation.y += deltaX1/100;
        }
    }
    else{
        return;
    }
}, false);