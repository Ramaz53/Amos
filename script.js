// ==========================================================================
// 1. TARGET CURSOR MODULE
// ==========================================================================
(function() {
    const cursor = document.getElementById('target-cursor');
    if (!cursor || window.innerWidth <= 768) return;

    const dot = cursor.querySelector('.target-cursor-dot');
    const corners = cursor.querySelectorAll('.target-cursor-corner');
    const TARGETS = '.nav-links a, .magic-bito, #back-to-top, .pc-contact-btn, .bento-tab-btn';

    let isLocked = false, activeTarget = null, spinTl = null;

    gsap.set(cursor, { xPercent: -50, yPercent: -50, x: window.innerWidth/2, y: window.innerHeight/2 });

    function initSpin() {
        if (spinTl) spinTl.kill();
        spinTl = gsap.timeline({ repeat: -1 }).to(cursor, { rotation: '+=360', duration: 2, ease: 'none' });
    }
    initSpin();

    window.addEventListener('mousemove', (e) => {
        if (!isLocked) {
            gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0.1, ease: 'power3.out' });
        } else if (activeTarget) {
            const r = activeTarget.getBoundingClientRect();
            const cX = r.left + r.width/2, cY = r.top + r.height/2;
            const pX = (e.clientX - cX) * 0.15, pY = (e.clientY - cY) * 0.15;

            gsap.to(cursor, { x: cX + pX, y: cY + pY, rotation: 0, duration: 0.2, ease: 'power2.out', overwrite: 'auto' });

            const w = (r.width/2) + 6, h = (r.height/2) + 6;
            gsap.to(corners, { x: (i) => i%2===0 ? -w-pX : w-pX, y: (i) => i<2 ? -h-pY : h-pY, duration: 0.1 });
        }
    });

    document.querySelectorAll(TARGETS).forEach(el => {
        el.addEventListener('mouseenter', () => {
            isLocked = true; activeTarget = el; if (spinTl) spinTl.pause();
            gsap.to(corners, { borderColor: '#E3CCAE', duration: 0.2 });
        });
        el.addEventListener('mouseleave', () => {
            isLocked = false; activeTarget = null;
            gsap.to(corners, { x: 0, y: 0, borderColor: '#B8621B', duration: 0.2 });
            initSpin();
        });
    });

    window.addEventListener('click', (e) => {
        const spark = document.createElement('div');
        spark.className = 'click-spark';
        spark.style.left = `${e.clientX - 4}px`; spark.style.top = `${e.clientY - 4}px`;
        document.body.appendChild(spark);
        setTimeout(() => spark.remove(), 500);
    });
})();

// ==========================================================================
// 2. THREE.JS DOTTED BACKGROUND WAVES
// ==========================================================================
(function() {
    const container = document.getElementById('dotted-surface-bg');
    if (!container) return;

    const SEPARATION = 150, AMTX = 40, AMTY = 60;
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000000, 2000, 10000);

    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(60, w / h, 1, 10000);
    camera.position.set(0, 250, 900);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio); 
    renderer.setSize(w, h);
    container.appendChild(renderer.domElement);

    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.top = "0";
    renderer.domElement.style.left = "0";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.zIndex = "1";

    const positions = [], colors = [], geometry = new THREE.BufferGeometry();
    const copper = new THREE.Color(0xB8621B), sand = new THREE.Color(0xE3CCAE);

    for (let ix = 0; ix < AMTX; ix++) {
        for (let iy = 0; iy < AMTY; iy++) {
            positions.push(ix * SEPARATION - (AMTX * SEPARATION) / 2, 0, iy * SEPARATION - (AMTY * SEPARATION) / 2);
            const clr = (ix + iy) % 2 === 0 ? copper : sand;
            colors.push(clr.r, clr.g, clr.b);
        }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({ size: 8, vertexColors: true, transparent: true, opacity: 0.65, sizeAttenuation: true });
    const points = new THREE.Points(geometry, material);
    scene.add(points);

    let count = 0;
    function animate() {
        requestAnimationFrame(animate);
        const arr = geometry.attributes.position.array;
        let idx = 0;
        for (let ix = 0; ix < AMTX; ix++) {
            for (let iy = 0; iy < AMTY; iy++) {
                arr[idx + 1] = Math.sin((ix + count) * 0.3) * 50 + Math.sin((iy + count) * 0.5) * 50;
                idx += 3;
            }
        }
        geometry.attributes.position.needsUpdate = true;
        renderer.render(scene, camera);
        count += 0.08;
    }

    window.addEventListener('resize', () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight; 
        camera.updateProjectionMatrix();
    });
    animate();
})();

// ==========================================================================
// 3. 3D LANYARD MODEL (FIXED THREE.JS ENCODING BUG)
// ==========================================================================
(function() {
    const container = document.getElementById('canvas-3d-lanyard');
    if (!container) return;

    let w = container.clientWidth, h = container.clientHeight;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 1000);
    camera.position.set(0, 0, 11);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(w, h); 
    container.appendChild(renderer.domElement);
    renderer.domElement.style.position = "relative";
    renderer.domElement.style.zIndex = "100";

    const textureLoader = new THREE.TextureLoader();
    const profileTexture = textureLoader.load("laycard.jpeg");

    // FIXED: Correct encoding property for Three.js r128
    if (profileTexture) {
        profileTexture.encoding = THREE.sRGBEncoding;
        profileTexture.minFilter = THREE.LinearFilter;
        profileTexture.magFilter = THREE.LinearFilter;
        profileTexture.flipY = false;
    }

    const cardGeo = new THREE.BoxGeometry(3.5, 5.2, 0.12);
    const cardMats = [
        new THREE.MeshBasicMaterial({ color: 0x262A56 }),
        new THREE.MeshBasicMaterial({ color: 0x262A56 }),
        new THREE.MeshBasicMaterial({ color: 0x262A56 }),
        new THREE.MeshBasicMaterial({ color: 0x262A56 }),
        new THREE.MeshBasicMaterial({ map: profileTexture }),
        new THREE.MeshBasicMaterial({ color: 0x120F17 })
    ];
    const cardMesh = new THREE.Mesh(cardGeo, cardMats);
    scene.add(cardMesh);
    cardMesh.rotation.y = 0;

    const ropePts = [];
    for(let i=0; i<15; i++) ropePts.push(new THREE.Vector3(0, 4 - (i*0.25), 0));
    const ropeCurve = new THREE.CatmullRomCurve3(ropePts);
    let ropeGeo = new THREE.TubeGeometry(ropeCurve, 32, 0.03, 8, false);
    const ropeMesh = new THREE.Mesh(ropeGeo, new THREE.MeshBasicMaterial({ color: 0xB8621B }));
    scene.add(ropeMesh);

    const anchor = new THREE.Vector3(0, 4.2, 0), cardPos = new THREE.Vector3(0, 0, 0), cardVel = new THREE.Vector3(0,0,0);
    let isGrabbed = false; const ray = new THREE.Raycaster(), mouse = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0,0,1), 0), intersect = new THREE.Vector3();

    function simPhysics() {
        requestAnimationFrame(simPhysics);
        if (!isGrabbed) {
            const force = new THREE.Vector3().subVectors(anchor, cardPos);
            force.normalize().multiplyScalar((force.length() - 3.8) * 18.0);
            force.y += -32.0;
            cardVel.addScaledVector(force, 0.016); cardVel.multiplyScalar(0.85);
            cardPos.addScaledVector(cardVel, 0.016); 
            cardPos.x = THREE.MathUtils.clamp(cardPos.x, -0.8, 0.8);
            cardPos.y = THREE.MathUtils.clamp(cardPos.y, -1.2, 1.2);
            cardPos.z = 0;
            cardMesh.position.copy(cardPos);
            cardMesh.rotation.set(cardVel.y * 0.015, Math.sin(Date.now()*0.002)*0.8, cardVel.x * -0.02);
        }
        const pts = [];
        for(let i=0; i<=14; i++) {
            const t = i/14, p = new THREE.Vector3().lerpVectors(anchor, cardMesh.position, t);
            if(t > 0 && t < 1) p.y -= Math.sin(t * Math.PI) * 0.4;
            pts.push(p);
        }
        ropeCurve.points = pts; ropeMesh.geometry.dispose();
        ropeMesh.geometry = new THREE.TubeGeometry(ropeCurve, 24, 0.025, 6, false);
        renderer.render(scene, camera);
    }

    function setMouse(e) { 
        const r = renderer.domElement.getBoundingClientRect(); 
        mouse.x = ((e.clientX - r.left)/r.width)*2-1; 
        mouse.y = -((e.clientY - r.top)/r.height)*2+1; 
    }
    window.addEventListener('mousedown', (e) => { setMouse(e); ray.setFromCamera(mouse, camera); if(ray.intersectObject(cardMesh).length > 0) { isGrabbed = true; cardVel.set(0,0,0); } });
    window.addEventListener('mousemove', (e) => { if(!isGrabbed) return; setMouse(e); ray.setFromCamera(mouse, camera); if(ray.ray.intersectPlane(plane, intersect)) cardMesh.position.copy(cardPos.copy(intersect)); });
    window.addEventListener('mouseup', () => isGrabbed = false);
    simPhysics();
})();

// ==========================================================================
// 4. HOLOGRAPHIC CARD
// ==========================================================================
(function() {
    const wrap = document.getElementById('holographic-card-wrapper');
    const shell = document.getElementById('holographic-card-shell');
    if (!wrap || !shell) return;

    const clamp = (v) => Math.min(Math.max(v, 0), 100);
    const adjust = (v) => parseFloat((35 + (30 * v) / 100).toFixed(3));

    shell.addEventListener('pointermove', (e) => {
        const r = shell.getBoundingClientRect();
        const x = clamp((100 / r.width) * (e.clientX - r.left)), y = clamp((100 / r.height) * (e.clientY - r.top));
        
        wrap.style.setProperty('--pointer-x', `${x}%`); wrap.style.setProperty('--pointer-y', `${y}%`);
        wrap.style.setProperty('--background-x', `${adjust(x)}%`); wrap.style.setProperty('--background-y', `${adjust(y)}%`);
        wrap.style.setProperty('--pointer-from-left', `${x / 100}`); wrap.style.setProperty('--pointer-from-top', `${y / 100}`);
        wrap.style.setProperty('--rotate-x', `${(x - 50) / 4.5}deg`); wrap.style.setProperty('--rotate-y', `${-(y - 50) / 3.5}deg`);
    });

    shell.addEventListener('pointerenter', () => { shell.classList.add('active'); wrap.classList.add('active'); });
    shell.addEventListener('pointerleave', () => {
        shell.classList.remove('active'); wrap.classList.remove('active');
        wrap.style.setProperty('--pointer-x', '50%'); wrap.style.setProperty('--pointer-y', '50%');
        wrap.style.setProperty('--rotate-x', '0deg'); wrap.style.setProperty('--rotate-y', '0deg');
    });
})();

// ==========================================================================
// 5. BENTO TABS & MAGIC CARDS (FIXED TEMPLATE STRING SYNTAX)
// ==========================================================================
function switchBentoTab(event, groupId) {
    document.querySelectorAll('.bento-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.bento-group').forEach(g => g.classList.remove('active'));
    if (event && event.currentTarget) event.currentTarget.classList.add('active'); 
    const targetGroup = document.getElementById(groupId);
    if (targetGroup) targetGroup.classList.add('active');
}

(function() {
    const cards = document.querySelectorAll('.magic-bento-card');
    cards.forEach(card => {
        let isHovered = false, particles = [];
        card.addEventListener('mouseenter', () => { isHovered = true; card.style.setProperty('--glow-intensity', '1'); });
        card.addEventListener('mousemove', (e) => {
            const r = card.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
            
            // FIXED: Backticks added
            card.style.setProperty('--glow-x', `${(x / r.width) * 100}%`); 
            card.style.setProperty('--glow-y', `${(y / r.height) * 100}%`);
            
            gsap.to(card, { rotateX: -((y - r.height/2)/(r.height/2))*6, rotateY: ((x - r.width/2)/(r.width/2))*6, x: (x - r.width/2)*0.03, y: (y - r.height/2)*0.03, duration: 0.1 });
            
            if (isHovered && particles.length < 8 && Math.random() < 0.15) {
                const p = document.createElement('div'); 
                p.className = 'particle'; 
                p.style.left = `${x}px`; 
                p.style.top = `${y}px`;
                card.appendChild(p); 
                particles.push(p);
                gsap.to(p, { x: (Math.random()-0.5)*60, y: (Math.random()-0.5)*60, scale: 0, opacity: 0, duration: 1.2, onComplete: () => { p.remove(); particles = particles.filter(x => x!==p); } });
            }
        });
        card.addEventListener('mouseleave', () => { 
            isHovered = false; 
            card.style.setProperty('--glow-intensity', '0'); 
            gsap.to(card, { rotateX:0, rotateY:0, x:0, y:0, duration:0.3 }); 
        });
    });
})();

// ==========================================================================
// 6. BACK TO TOP
// ==========================================================================
const topBtn = document.getElementById("back-to-top");
if (topBtn) {
    topBtn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
}

// ==========================================================================
// 7. PROJECT CARD STACK SWITCH & SYNC (GUARANTEED WORKING)
// ==========================================================================
// document.addEventListener("DOMContentLoaded", function () {
//     const stackCards = document.querySelectorAll(".card-rotate");
//     const projectDetails = document.querySelectorAll(".project-info");

//     stackCards.forEach((card) => {
//         card.addEventListener("click", function () {
//             const projectIndex = this.getAttribute("data-project");

//             // 1. Reset active class on all cards and details
//             stackCards.forEach(c => c.classList.remove("active"));
//             projectDetails.forEach(d => d.classList.remove("active"));

//             // 2. Set clicked card to active
//             this.classList.add("active");

//             // 3. Activate matching project details card
//             const activeDetail = document.querySelector(`.project-info[data-project="${projectIndex}"]`);
//             if (activeDetail) {
//                 activeDetail.classList.add("active");
//             }
//         });
//     });
// });
document.querySelectorAll('.projects-section').forEach(section => {
    const cards = section.querySelectorAll('.card-rotate');
    const infos = section.querySelectorAll('.project-info');

    cards.forEach(card => {
        card.addEventListener('click', () => {
            const projectId = card.getAttribute('data-project');

            // Deactivate active elements within THIS section only
            cards.forEach(c => c.classList.remove('active'));
            infos.forEach(i => i.classList.remove('active'));

            // Activate clicked items
            card.classList.add('active');
            const activeInfo = section.querySelector(`.project-info[data-project="${projectId}"]`);
            if (activeInfo) activeInfo.classList.add('active');
        });
    });
});