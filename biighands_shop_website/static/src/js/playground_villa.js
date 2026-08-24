import * as THREE from "/biighands_shop_website/static/lib/three/three.module.min.js?v=2026081605";
import { GLTFLoader } from "/biighands_shop_website/static/lib/three/GLTFLoader.js?v=2026081605";
import { DRACOLoader } from "/biighands_shop_website/static/lib/three/DRACOLoader.js?v=2026081605";
import { RoomEnvironment } from "/biighands_shop_website/static/lib/three/RoomEnvironment.js?v=2026082001";
import { RGBELoader } from "/biighands_shop_website/static/lib/three/RGBELoader.js?v=2026082001";

const canvas = document.querySelector("[data-bhp-villa-canvas]");

if (canvas) {
    const preloader = document.querySelector("[data-bhp-villa-preloader]");
    const preloaderLine = document.querySelector("[data-bhp-villa-preloader-line]");
    let villaReady = false;
    let minimumDwellComplete = false;
    let preloaderOpened = false;
    document.documentElement.classList.add("bhp-villa-is-loading");
    requestAnimationFrame(() => requestAnimationFrame(() => preloaderLine?.classList.add("is-running")));
    function openPreloader() {
        if (preloaderOpened || !villaReady || !minimumDwellComplete) return;
        preloaderOpened = true;
        preloader?.classList.add("is-opening");
        window.setTimeout(() => {
            preloader?.remove();
            document.documentElement.classList.remove("bhp-villa-is-loading");
        }, 950);
    }
    window.setTimeout(() => {
        minimumDwellComplete = true;
        openPreloader();
    }, 1900);
    window.setTimeout(() => {
        villaReady = true;
        openPreloader();
    }, 7000);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);
    scene.fog = new THREE.Fog(0x050505, 18, 45);

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 120);
    camera.position.set(11.5, 5.5, 15);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    new RGBELoader().load(
        "/biighands_shop_website/static/models/potsdamer_platz_1k.hdr",
        (texture) => {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            scene.environment = pmrem.fromEquirectangular(texture).texture;
            texture.dispose();
        }
    );

    scene.add(new THREE.AmbientLight(0xffffff, 0.09));
    const coolLight = new THREE.DirectionalLight(0xcfd8e3, 0.3);
    coolLight.position.set(-9, 12, 8);
    scene.add(coolLight);
    const warmSpot = new THREE.SpotLight(0xffd9a0, 90, 45, 0.45, 0.8, 2);
    warmSpot.position.set(10, 9, 12);
    scene.add(warmSpot);
    const warmPoint = new THREE.PointLight(0xffd9a0, 22, 13, 2);
    warmPoint.position.set(3, 2.6, 6.5);
    scene.add(warmPoint);

    const villaGroup = new THREE.Group();
    villaGroup.position.set(0, 0, -1);
    villaGroup.rotation.y = 0.3;
    scene.add(villaGroup);
    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(90, 90),
        new THREE.MeshStandardMaterial({ color: 0x060606, roughness: 1 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    villaGroup.add(ground);

    let villa = null;
    let doorPivot = null;
    const doorTarget = new THREE.Vector3(-1.6, 2.3, 1);
    const frameMaterial = new THREE.MeshStandardMaterial({ color: 0xc9c9c9, metalness: 0.85, roughness: 0.25, envMapIntensity: 2.2 });
    const finishTarget = new THREE.Color(0xc9c9c9);
    let finishMetalness = 1;
    let finishRoughness = 0.24;
    const finishButtons = Array.from(document.querySelectorAll("[data-bhp-villa-finish]"));
    const finishLabel = document.querySelector("[data-bhp-finish-label]");
    finishButtons.forEach((button) => {
        button.querySelector("i")?.style.setProperty("--bhp-finish-color", button.dataset.color);
        button.addEventListener("click", () => {
            finishTarget.set(button.dataset.color || "#c9c9c9");
            finishMetalness = Number(button.dataset.metalness || 1);
            finishRoughness = Number(button.dataset.roughness || 0.24);
            finishButtons.forEach((item) => item.classList.toggle("active", item === button));
            if (finishLabel) finishLabel.textContent = button.dataset.bhpVillaFinish || "Natural Silver";
        });
    });
    const frameNames = new Set(["M_15___Glossy_Plastic", "M_13___Brushed_Metal_2", "M_14___Polished_Aluminum"]);
    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("/biighands_shop_website/static/lib/draco/");
    loader.setDRACOLoader(dracoLoader);
    loader.load(
        "/biighands_shop_website/static/models/villa3.glb",
        (gltf) => {
            villa = gltf.scene;
            const box = new THREE.Box3().setFromObject(villa);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());
            const scale = 20 / Math.max(size.x, size.z);
            villa.scale.setScalar(scale);
            villa.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
            villa.updateMatrixWorld(true);

            let door = null;
            villa.traverse((object) => {
                if (object.isMesh && object.material) {
                    if (frameNames.has(object.material.name)) object.material = frameMaterial;
                    else if ("envMapIntensity" in object.material) object.material.envMapIntensity = 0.45;
                    object.castShadow = true;
                    object.receiveShadow = true;
                }
                if (!door && object.name.startsWith("Box055")) door = object;
            });
            if (door) {
                const doorBox = new THREE.Box3().setFromObject(door);
                const doorCenter = doorBox.getCenter(new THREE.Vector3());
                const hinge = villa.worldToLocal(new THREE.Vector3(doorBox.min.x, doorCenter.y, doorCenter.z));
                doorPivot = new THREE.Group();
                doorPivot.position.copy(hinge);
                villa.add(doorPivot);
                doorPivot.attach(door);
            }
            villaGroup.add(villa);
            document.querySelector("[data-bhp-villa-loading]")?.classList.add("is-ready");
            villaReady = true;
            openPreloader();
        },
        undefined,
        (error) => {
            console.error("Playground villa failed to load", error);
            document.querySelector("[data-bhp-villa-loading]")?.classList.add("has-error");
            villaReady = true;
            openPreloader();
        }
    );

    function resize() {
        const rect = canvas.getBoundingClientRect();
        renderer.setSize(Math.max(1, rect.width), Math.max(1, rect.height), false);
        camera.aspect = Math.max(1, rect.width) / Math.max(1, rect.height);
        camera.updateProjectionMatrix();
    }
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    let previousFrame = performance.now();
    function render() {
        const now = performance.now();
        const dt = Math.min((now - previousFrame) / 1000, 0.05);
        previousFrame = now;
        const hero = canvas.closest(".bhp-hero");
        const heroRect = hero?.getBoundingClientRect();
        const heroRange = Math.max(1, (hero?.offsetHeight || window.innerHeight) - window.innerHeight);
        const progress = THREE.MathUtils.clamp(-(heroRect?.top || 0) / heroRange, 0, 1);
        const eased = progress * progress * (3 - 2 * progress);
        const heroCopy = hero?.querySelector(".bhp-hero-content");
        const scrollCue = hero?.querySelector(".bhp-scroll");
        const lateCopy = hero?.querySelector("[data-bhp-villa-late]");
        const finishPicker = hero?.querySelector("[data-bhp-villa-picker]");
        if (heroCopy) {
            heroCopy.style.opacity = String(THREE.MathUtils.clamp(1 - progress / 0.22, 0, 1));
            heroCopy.style.transform = `translateY(${-60 * Math.min(1, progress / 0.25)}px)`;
        }
        if (scrollCue) scrollCue.style.opacity = String(THREE.MathUtils.clamp(1 - progress / 0.22, 0, 1));
        const lateOpacity = THREE.MathUtils.clamp((progress - 0.62) / 0.18, 0, 1);
        if (lateCopy) lateCopy.style.opacity = String(lateOpacity);
        if (finishPicker) {
            finishPicker.style.opacity = String(lateOpacity);
            finishPicker.style.pointerEvents = progress > 0.62 ? "auto" : "none";
        }
        frameMaterial.color.lerp(finishTarget, 1 - Math.exp(-4 * dt));
        frameMaterial.metalness = THREE.MathUtils.damp(frameMaterial.metalness, finishMetalness, 4, dt);
        frameMaterial.roughness = THREE.MathUtils.damp(frameMaterial.roughness, finishRoughness, 4, dt);
        if (doorPivot) doorPivot.getWorldPosition(doorTarget);
        else doorTarget.set(-1.6, 2.3, 1);
        villaGroup.rotation.y = THREE.MathUtils.damp(villaGroup.rotation.y, THREE.MathUtils.lerp(0.3, 0, eased), 2.5, dt);
        if (doorPivot) {
            const doorProgress = THREE.MathUtils.clamp((progress - 0.35) / 0.6, 0, 1);
            const doorEase = doorProgress * doorProgress * (3 - 2 * doorProgress);
            doorPivot.rotation.y = THREE.MathUtils.damp(doorPivot.rotation.y, -1 * doorEase, 3, dt);
        }
        camera.position.x = THREE.MathUtils.damp(camera.position.x, THREE.MathUtils.lerp(11.5, doorTarget.x + 2.4, eased), 2.5, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, THREE.MathUtils.lerp(5.5, doorTarget.y + 1, eased), 2.5, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, THREE.MathUtils.lerp(15, doorTarget.z + 5.2, eased), 2.5, dt);
        camera.lookAt(THREE.MathUtils.lerp(0, doorTarget.x, eased), THREE.MathUtils.lerp(1.6, doorTarget.y, eased), THREE.MathUtils.lerp(0, doorTarget.z, eased));
        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}
