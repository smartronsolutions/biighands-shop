import * as THREE from "/biighands_shop_website/static/lib/three/three.module.min.js?v=2026081605";
import { RoomEnvironment } from "/biighands_shop_website/static/lib/three/RoomEnvironment.js?v=2026082001";
import { RGBELoader } from "/biighands_shop_website/static/lib/three/RGBELoader.js?v=2026082001";

const clamp = THREE.MathUtils.clamp;
const ease = (value) => value * value * (3 - 2 * value);

function material(color, metalness = 0, roughness = 0.45, options = {}) {
    return new THREE.MeshStandardMaterial({ color, metalness, roughness, ...options });
}

function addPart(group, geometry, mat, base, direction, magnitude) {
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.position.fromArray(base);
    mesh.userData.base = new THREE.Vector3(...base);
    mesh.userData.direction = new THREE.Vector3(...direction);
    mesh.userData.magnitude = magnitude;
    group.add(mesh);
    return mesh;
}

function buildDoor(group) {
    const aluminium = material(0xc9c9c9, 1, 0.24, { envMapIntensity: 1.8 });
    const glass = material(0x9fb6c0, 0.9, 0.05, { transparent: true, opacity: 0.28, envMapIntensity: 2 });
    const amber = material(0xd4af37, 0, 0.45, { emissive: 0xd4af37, emissiveIntensity: 0.7 });
    const steel = material(0x6a6a6a, 1, 0.35);
    const bronze = material(0xb08a3e, 1, 0.3);
    const gasket = material(0x101010, 0, 0.85);
    const parts = [
        [[0.12, 4.6, 0.18], aluminium, [-1.04, 2.3, 0], [-1, 0, 0], 1.1],
        [[0.12, 4.6, 0.18], aluminium, [1.04, 2.3, 0], [1, 0, 0], 1.1],
        [[2.2, 0.12, 0.18], aluminium, [0, 4.54, 0], [0, 1, 0], 0.85],
        [[2.2, 0.12, 0.18], aluminium, [0, 0.06, 0], [0, -1, 0], 0.8],
        [[0.08, 4.3, 0.12], aluminium, [-0.87, 2.3, 0.02], [-1, 0, 0], 0.55],
        [[0.08, 4.3, 0.12], aluminium, [0.87, 2.3, 0.02], [1, 0, 0], 0.55],
        [[1.9, 0.08, 0.12], aluminium, [0, 4.41, 0.02], [0, 1, 0], 0.5],
        [[1.9, 0.08, 0.12], aluminium, [0, 0.19, 0.02], [0, -1, 0], 0.4],
        [[1.74, 4.22, 0.02], glass, [0, 2.3, -0.045], [0, 0, 1], 0.55],
        [[1.74, 4.22, 0.02], glass, [0, 2.3, 0], [0, 0, 1], 1.1],
        [[1.74, 4.22, 0.02], glass, [0, 2.3, 0.045], [0, 0, 1], 1.65],
        [[0.04, 4.3, 0.06], amber, [-0.95, 2.3, 0], [-1, 0, 0], 1.7],
        [[0.04, 4.3, 0.06], amber, [0.95, 2.3, 0], [1, 0, 0], 1.7],
        [[0.02, 4.3, 0.02], gasket, [-0.8, 2.3, 0.07], [0, 0, -1], 0.6],
        [[0.02, 4.3, 0.02], gasket, [0.8, 2.3, 0.07], [0, 0, -1], 0.6],
    ];
    parts.forEach(([size, mat, base, direction, magnitude]) => addPart(group, new THREE.BoxGeometry(...size), mat, base, direction, magnitude));
    addPart(group, new THREE.CylinderGeometry(0.05, 0.05, 0.35, 16), steel, [-0.97, 4.78, 0], [0, 1, 0], 0.55);
    addPart(group, new THREE.CylinderGeometry(0.05, 0.05, 0.35, 16), steel, [-0.97, -0.18, 0], [0, -1, 0], 0.45);
    addPart(group, new THREE.CylinderGeometry(0.028, 0.028, 2.4, 16), bronze, [0.7, 2.3, 0.16], [0, 0, 1], 1.9);
}

function buildJoinery(group) {
    const walnut = material(0x5b3a26, 0.05, 0.5);
    const walnutLight = material(0x6e4a30, 0.05, 0.55);
    const brass = material(0xb08a3e, 1, 0.3);
    const leather = material(0x2a1f16, 0, 0.9);
    addPart(group, new THREE.BoxGeometry(0.06, 2.6, 0.55), walnut, [-1.07, 1.3, 0], [-1, 0, 0], 1);
    addPart(group, new THREE.BoxGeometry(0.06, 2.6, 0.55), walnut, [1.07, 1.3, 0], [1, 0, 0], 1);
    addPart(group, new THREE.BoxGeometry(2.2, 0.06, 0.55), walnut, [0, 2.57, 0], [0, 1, 0], 0.9);
    addPart(group, new THREE.BoxGeometry(2.2, 0.06, 0.55), walnut, [0, 0.03, 0], [0, -1, 0], 0.7);
    addPart(group, new THREE.BoxGeometry(2.08, 2.48, 0.03), walnutLight, [0, 1.3, -0.245], [0, 0, -1], 0.8);
    addPart(group, new THREE.BoxGeometry(2.02, 0.05, 0.5), walnutLight, [0, 1.75, 0], [0, 1, 0], 0.45);
    addPart(group, new THREE.BoxGeometry(2.02, 0.05, 0.5), walnutLight, [0, 1.05, 0], [0, 1, 0], 0.2);
    addPart(group, new THREE.BoxGeometry(1.6, 0.5, 0.45), leather, [0, 0.55, 0], [0, 0, 1], 0.9);
    addPart(group, new THREE.BoxGeometry(2.08, 0.62, 0.05), walnut, [0, 0.55, 0.26], [0, 0, 1], 1.5);
    addPart(group, new THREE.BoxGeometry(0.7, 0.04, 0.03), brass, [0, 0.55, 0.3], [0, 0, 1], 2.2);
    addPart(group, new THREE.CylinderGeometry(0.015, 0.015, 0.08, 12), brass, [-1, 1.75, 0.15], [-1, 0, 0], 1.4);
    addPart(group, new THREE.CylinderGeometry(0.015, 0.015, 0.08, 12), brass, [1, 1.75, 0.15], [1, 0, 0], 1.4);
}

function buildDrapery(group) {
    const track = material(0x1a1a1a, 1, 0.4);
    const bronze = material(0xb08a3e, 1, 0.3);
    const clothMat = material(0xb8ab97, 0, 0.95, { side: THREE.DoubleSide });
    addPart(group, new THREE.BoxGeometry(3.4, 0.07, 0.12), track, [0, 2.42, 0], [0, 0, 0], 0);
    [-1.72, 1.72].forEach((x) => addPart(group, new THREE.SphereGeometry(0.05, 16, 16), bronze, [x, 2.42, 0], [0, 0, 0], 0));
    const geometry = new THREE.PlaneGeometry(3, 2.35, 90, 40);
    geometry.translate(0, 1.175, 0);
    const cloth = addPart(group, geometry, clothMat, [0, 0, 0], [0, 0, 0], 0);
    cloth.userData.vertices = geometry.attributes.position.array.slice();
    cloth.userData.isCloth = true;
}

function setup(canvas) {
    const chapter = canvas.closest("[data-bhp-chapter]");
    const type = chapter.dataset.bhpChapter;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 60);
    const cameraStart = type === "door" ? [1.2, 2.2, 8.8] : type === "joinery" ? [1, 1.3, 6.8] : [0.8, 1.5, 7.6];
    camera.position.set(...cameraStart);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.4));
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
    scene.add(new THREE.AmbientLight(0xffffff, type === "drapery" ? 0.25 : 0.22));
    const keyColor = type === "door" ? 0xdfe6ee : type === "joinery" ? 0xefe6da : 0xf2ece2;
    const key = new THREE.DirectionalLight(keyColor, type === "drapery" ? 1 : 1.1);
    key.position.set(type === "door" ? -6 : -5, type === "door" ? 8 : type === "joinery" ? 7 : 6, type === "door" ? 6 : type === "joinery" ? 6 : 7);
    scene.add(key);
    const warm = new THREE.SpotLight(0xffd9a0, type === "drapery" ? 60 : 70, type === "door" ? 30 : 28, 0.5, 0.8, 2);
    warm.position.set(type === "drapery" ? 5 : 6, type === "door" ? 6 : 5, type === "door" ? 7 : type === "joinery" ? 6 : 7);
    scene.add(warm);
    const group = new THREE.Group();
    group.position.set(0, type === "drapery" ? 0 : -1.3, 0);
    group.rotation.y = type === "door" ? -0.35 : type === "joinery" ? -0.3 : -0.12;
    scene.add(group);
    if (type === "door") buildDoor(group);
    if (type === "joinery") buildJoinery(group);
    if (type === "drapery") buildDrapery(group);

    function resize() {
        const rect = canvas.getBoundingClientRect();
        renderer.setSize(Math.max(1, rect.width), Math.max(1, rect.height), false);
        camera.aspect = Math.max(1, rect.width) / Math.max(1, rect.height);
        camera.updateProjectionMatrix();
    }
    new ResizeObserver(resize).observe(canvas);
    resize();

    let previousTime = performance.now();
    function render(time) {
        const dt = Math.min((time - previousTime) / 1000, 0.05);
        previousTime = time;
        const rect = chapter.getBoundingClientRect();
        const range = Math.max(1, chapter.offsetHeight - innerHeight);
        const progress = clamp(-rect.top / range, 0, 1);
        const moved = ease(clamp((progress - 0.06) / 0.88, 0, 1));
        group.children.forEach((part) => {
            if (part.userData.base) {
                const target = part.userData.base.clone().addScaledVector(part.userData.direction, part.userData.magnitude * moved);
                part.position.x = THREE.MathUtils.damp(part.position.x, target.x, 5, dt);
                part.position.y = THREE.MathUtils.damp(part.position.y, target.y, 5, dt);
                part.position.z = THREE.MathUtils.damp(part.position.z, target.z, 5, dt);
            }
            if (part.userData.isCloth) {
                const position = part.geometry.attributes.position;
                const base = part.userData.vertices;
                for (let i = 0; i < position.count; i++) {
                    const x = base[i * 3];
                    const y = base[i * 3 + 1];
                    const gatheredX = -1.5 + (x + 1.5) * (1 - moved * 0.72);
                    const vertical = 1 - y / 2.35;
                    position.setX(i, gatheredX);
                    position.setZ(i, Math.sin(x * 6.3) * (0.09 + moved * 0.22) * (1 + vertical * 0.35) + Math.sin(time * 0.0007 + x * 1.4) * 0.03);
                }
                position.needsUpdate = true;
                part.geometry.computeVertexNormals();
            }
        });
        const rotationStart = type === "door" ? -0.35 : type === "joinery" ? -0.3 : -0.12;
        const rotationEnd = type === "door" ? 0.5 : type === "joinery" ? 0.45 : 0.18;
        group.rotation.y = THREE.MathUtils.damp(group.rotation.y, THREE.MathUtils.lerp(rotationStart, rotationEnd, ease(progress)), 3, dt);
        if (type === "door") {
            camera.position.x = THREE.MathUtils.damp(camera.position.x, THREE.MathUtils.lerp(1.2, -1, ease(progress)), 3, dt);
            camera.position.y = THREE.MathUtils.damp(camera.position.y, THREE.MathUtils.lerp(2.2, 1.9, ease(progress)), 3, dt);
            camera.position.z = THREE.MathUtils.damp(camera.position.z, THREE.MathUtils.lerp(8.8, 8.2, ease(progress)), 3, dt);
        } else if (type === "joinery") {
            camera.position.x = THREE.MathUtils.damp(camera.position.x, THREE.MathUtils.lerp(1, -0.8, ease(progress)), 3, dt);
            camera.position.y = THREE.MathUtils.damp(camera.position.y, THREE.MathUtils.lerp(1.3, 1.1, ease(progress)), 3, dt);
            camera.position.z = THREE.MathUtils.damp(camera.position.z, THREE.MathUtils.lerp(6.8, 6.2, ease(progress)), 3, dt);
        } else {
            camera.position.x = THREE.MathUtils.damp(camera.position.x, THREE.MathUtils.lerp(0.8, 0.3, ease(progress)), 3, dt);
            camera.position.y = THREE.MathUtils.damp(camera.position.y, THREE.MathUtils.lerp(1.5, 1.3, ease(progress)), 3, dt);
            camera.position.z = THREE.MathUtils.damp(camera.position.z, THREE.MathUtils.lerp(7.6, 7, ease(progress)), 3, dt);
        }
        const heading = chapter.querySelector(".bhp-chapter-heading");
        if (heading) heading.style.opacity = String(clamp(1 - progress / 0.12, 0, 1));
        chapter.querySelectorAll("[data-bhp-note]").forEach((note, index) => {
            const range = note.dataset.bhpNote?.split(",").map(Number) || [];
            const hasRange = range.length === 2 && range.every(Number.isFinite);
            const start = hasRange ? range[0] : 0.16 + index * 0.34;
            const end = hasRange ? range[1] : start + 0.24;
            const opacity = clamp(Math.min((progress - start) / 0.045, (end - progress) / 0.045), 0, 1);
            const noteProgress = clamp((progress - start) / Math.max(0.01, end - start), 0, 1);
            note.style.opacity = String(opacity);
            note.style.transform = `translateY(calc(-50% + ${34 - 68 * noteProgress}px))`;
        });
        const cta = chapter.querySelector("[data-bhp-chapter-cta]");
        if (cta) {
            const ctaOpacity = clamp((progress - 0.88) / 0.07, 0, 1);
            cta.style.opacity = String(ctaOpacity);
            cta.style.pointerEvents = progress > 0.9 ? "auto" : "none";
        }
        camera.lookAt(0, type === "door" ? 1 : type === "drapery" ? 1.2 : 0, 0);
        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}

document.querySelectorAll("[data-bhp-craft-canvas]").forEach(setup);
