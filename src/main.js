import './style.css';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Registrar ScrollTrigger en GSAP
gsap.registerPlugin(ScrollTrigger);

// --- CONFIGURACIÓN DE LA ESCENA THREE.JS ---
const canvas = document.querySelector('#webgl-canvas');
const scene = new THREE.Scene();

// Dimensiones iniciales
const size = {
  width: window.innerWidth,
  height: window.innerHeight
};

// Cámara
const camera = new THREE.PerspectiveCamera(45, size.width / size.height, 0.1, 100);
camera.position.z = 8;
scene.add(camera);

// Renderizador
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
  alpha: true // Fondo transparente para ver los degradados del CSS
});
renderer.setSize(size.width, size.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// --- ILUMINACIÓN PREMIUM ---
// Luz ambiental cálida
const ambientLight = new THREE.AmbientLight(0x2a1a10, 1.8);
scene.add(ambientLight);

// Luz direccional principal (genera brillo y sombras)
const mainLight = new THREE.DirectionalLight(0xfff3e3, 3.5);
mainLight.position.set(6, 8, 4);
mainLight.castShadow = true;
mainLight.shadow.mapSize.width = 2048;
mainLight.shadow.mapSize.height = 2048;
mainLight.shadow.camera.near = 0.5;
mainLight.shadow.camera.far = 25;
mainLight.shadow.bias = -0.0005;
scene.add(mainLight);

// Luz de relleno lateral (suaviza sombras)
const fillLight = new THREE.DirectionalLight(0xc68b59, 1.5);
fillLight.position.set(-6, 2, -2);
scene.add(fillLight);

// Luz de destaque trasera (crea un contorno de luz en los bordes)
const rimLight = new THREE.DirectionalLight(0xffffff, 2.0);
rimLight.position.set(0, -5, -5);
scene.add(rimLight);


// --- MODELADO PROCEDIMENTAL DEL CAFÉ (3D) ---
const cupGroup = new THREE.Group();
scene.add(cupGroup);

// Material Cerámico Blanco/Crema Brillante (Physical Material)
const ceramicMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xfbf8f3,
  roughness: 0.08,
  metalness: 0.05,
  clearcoat: 1.0,
  clearcoatRoughness: 0.05,
  reflectivity: 1.0
});

// 1. Taza de Café (Usando LatheGeometry para darle forma cóncava perfecta)
const cupPoints = [];
cupPoints.push(new THREE.Vector2(0, 0));
cupPoints.push(new THREE.Vector2(0.9, 0));
cupPoints.push(new THREE.Vector2(0.9, 0.08));
cupPoints.push(new THREE.Vector2(0.8, 0.08));
// Curva ascendente y hacia afuera
for (let i = 0; i <= 12; i++) {
  const t = i / 12;
  const y = t * 1.4;
  const r = 0.8 + t * 0.55; // va del radio 0.8 al 1.35
  cupPoints.push(new THREE.Vector2(r, y));
}
// Labio de la taza
cupPoints.push(new THREE.Vector2(1.35, 1.44));
cupPoints.push(new THREE.Vector2(1.29, 1.44));
// Curva interior (hacia abajo)
for (let i = 12; i >= 0; i--) {
  const t = i / 12;
  const y = t * 1.35 + 0.05; // ligeramente elevado sobre el fondo exterior
  const r = 0.75 + t * 0.50;
  cupPoints.push(new THREE.Vector2(r, y));
}
cupPoints.push(new THREE.Vector2(0, 0.05));

const cupGeometry = new THREE.LatheGeometry(cupPoints, 48);
const cupMesh = new THREE.Mesh(cupGeometry, ceramicMaterial);
cupMesh.castShadow = true;
cupMesh.receiveShadow = true;
cupGroup.add(cupMesh);

// 2. Asa de la Taza
const handleGeometry = new THREE.TorusGeometry(0.42, 0.1, 16, 40, Math.PI * 1.15);
const handleMesh = new THREE.Mesh(handleGeometry, ceramicMaterial);
handleMesh.position.set(-1.1, 0.7, 0);
handleMesh.rotation.z = Math.PI * 0.92;
handleMesh.castShadow = true;
handleMesh.receiveShadow = true;
cupGroup.add(handleMesh);

// 3. Líquido del Café (Cilindro plano con material marrón brillante)
const liquidGeometry = new THREE.CylinderGeometry(1.24, 0.9, 0.08, 48);
const liquidMaterial = new THREE.MeshStandardMaterial({
  color: 0x311a11, // Marrón oscuro de café espresso
  roughness: 0.1,
  metalness: 0.1,
  flatShading: false
});
const liquidMesh = new THREE.Mesh(liquidGeometry, liquidMaterial);
liquidMesh.position.y = 1.28;
liquidMesh.receiveShadow = true;
cupGroup.add(liquidMesh);

// 4. Plato de Soporte (Saucer)
const saucerPoints = [];
saucerPoints.push(new THREE.Vector2(0, 0));
saucerPoints.push(new THREE.Vector2(0.6, 0));
saucerPoints.push(new THREE.Vector2(0.9, 0.04));
saucerPoints.push(new THREE.Vector2(1.9, 0.22));
saucerPoints.push(new THREE.Vector2(1.9, 0.26));
saucerPoints.push(new THREE.Vector2(1.8, 0.22));
saucerPoints.push(new THREE.Vector2(0.85, 0.03));
saucerPoints.push(new THREE.Vector2(0, 0.01));

const saucerGeometry = new THREE.LatheGeometry(saucerPoints, 48);
const saucerMesh = new THREE.Mesh(saucerGeometry, ceramicMaterial);
saucerMesh.position.y = -0.06;
saucerMesh.castShadow = true;
saucerMesh.receiveShadow = true;
cupGroup.add(saucerMesh);

// Ajustar posición central inicial del grupo de la taza
cupGroup.position.set(0, 0, 0);


// --- MODELADO DE LOS GRANOS DE CAFÉ FLOTANTES ---
const beansCount = 5;
const beans = [];

// Función para crear un grano de café procedimental realista
function createCoffeeBean() {
  const beanGroup = new THREE.Group();
  
  // Geometría del grano de café: dos esferas estiradas (semillas) unidas con un surco en medio
  const seedGeometry = new THREE.SphereGeometry(0.2, 32, 16);
  seedGeometry.scale(1, 1.7, 0.65); // estirar en el eje Y y aplastar en Z
  
  const beanMaterial = new THREE.MeshStandardMaterial({
    color: 0x482a1b, // café tostado
    roughness: 0.55,
    metalness: 0.08
  });
  
  // Mitad izquierda
  const leftSeed = new THREE.Mesh(seedGeometry, beanMaterial);
  leftSeed.position.x = -0.06;
  leftSeed.rotation.y = 0.08;
  leftSeed.castShadow = true;
  beanGroup.add(leftSeed);
  
  // Mitad derecha
  const rightSeed = new THREE.Mesh(seedGeometry, beanMaterial);
  rightSeed.position.x = 0.06;
  rightSeed.rotation.y = -0.08;
  rightSeed.castShadow = true;
  beanGroup.add(rightSeed);
  
  return beanGroup;
}

// Generar granos y agregarlos a la escena con posiciones iniciales variadas
const beansData = [
  { initialPos: new THREE.Vector3(2.5, 1.8, 1), scale: 1.0 },
  { initialPos: new THREE.Vector3(-2.8, -1.5, 2), scale: 0.85 },
  { initialPos: new THREE.Vector3(3.2, -2.5, -1), scale: 0.7 },
  { initialPos: new THREE.Vector3(-3.0, 2.2, -2), scale: 0.9 },
  { initialPos: new THREE.Vector3(0.5, -3.2, 0.5), scale: 0.75 }
];

beansData.forEach((data, index) => {
  const bean = createCoffeeBean();
  bean.position.copy(data.initialPos);
  bean.scale.setScalar(data.scale);
  // Rotaciones iniciales aleatorias para verse naturales
  bean.rotation.set(
    Math.random() * Math.PI,
    Math.random() * Math.PI,
    Math.random() * Math.PI
  );
  scene.add(bean);
  beans.push(bean);
});


// --- ANIMACIÓN SUAVE POR LERP (Interpolación Lineal) ---
// Estructuras para guardar los valores reales y objetivos
const transform = {
  cupX: 0, cupY: 0, cupZ: 0,
  cupRX: 0.35, cupRY: -0.6, cupRZ: 0.15,
  cupScale: 1.0,
  
  bean0X: beansData[0].initialPos.x, bean0Y: beansData[0].initialPos.y, bean0Z: beansData[0].initialPos.z,
  bean1X: beansData[1].initialPos.x, bean1Y: beansData[1].initialPos.y, bean1Z: beansData[1].initialPos.z,
  bean2X: beansData[2].initialPos.x, bean2Y: beansData[2].initialPos.y, bean2Z: beansData[2].initialPos.z,
  bean3X: beansData[3].initialPos.x, bean3Y: beansData[3].initialPos.y, bean3Z: beansData[3].initialPos.z,
  bean4X: beansData[4].initialPos.x, bean4Y: beansData[4].initialPos.y, bean4Z: beansData[4].initialPos.z
};

const target = { ...transform };

// --- INTEGRACIÓN DE GSAP SCROLLTRIGGER ---
const mm = gsap.matchMedia();

// Configurar animaciones diferenciadas por tamaño de pantalla
mm.add({
  isDesktop: "(min-width: 969px)",
  isMobile: "(max-width: 968px)"
}, (context) => {
  const { isDesktop } = context.conditions;
  
  if (isDesktop) {
    // --- COMPORTAMIENTO ESCRITORIO (DESKTOP) ---
    // Valores de inicio (Hero Section)
    target.cupX = 1.6;
    target.cupY = -0.2;
    target.cupZ = 0;
    target.cupRX = 0.35;
    target.cupRY = -0.65;
    target.cupRZ = 0.15;
    target.cupScale = 1.25;

    // Timeline de Scroll principal
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: ".content-wrapper",
        start: "top top",
        end: "bottom bottom",
        scrub: 1.2 // Hace que responda con suavidad a la velocidad del scroll
      }
    });

    // Paso de Hero a Origin (Sección 2)
    tl.to(target, {
      cupX: -1.7,
      cupY: 0.1,
      cupScale: 1.0,
      cupRX: 0.2,
      cupRY: 1.4, // rotación para ver el asa desde otro ángulo
      cupRZ: -0.1,
      // Mover granos flotantes
      bean0X: 1.8, bean0Y: 1.2, bean0Z: 2,
      bean1X: -2.0, bean1Y: 2.2, bean1Z: 0.5,
      bean2X: 2.2, bean2Y: -1.5, bean2Z: 1,
      duration: 1
    })
    // Paso de Origin a Roast (Sección 3)
    .to(target, {
      cupX: 1.8,
      cupY: 0.3,
      cupScale: 1.15,
      cupRX: 0.95, // inclinación dramática para mostrar el café
      cupRY: -1.3,
      cupRZ: 0.35,
      // Granos se acumulan cerca de la taza
      bean0X: 0.6, bean0Y: 1.5, bean0Z: 0.5,
      bean1X: 1.2, bean1Y: -0.5, bean1Z: 1.5,
      bean3X: 2.8, bean3Y: 1.8, bean3Z: -1,
      duration: 1
    })
    // Paso de Roast a Shop (Sección 4)
    .to(target, {
      cupX: 0,
      cupY: -2.2, // baja para quedar en segundo plano en la tienda
      cupScale: 0.6,
      cupRX: 0.45,
      cupRY: 2.5,
      cupRZ: 0.05,
      // Granos se esparcen simétricamente
      bean0X: -2.2, bean0Y: -1.8, bean0Z: 1,
      bean1X: 2.2, bean1Y: -1.8, bean1Z: 1,
      bean2X: -3.0, bean2Y: 0.5, bean2Z: -1,
      bean3X: 3.0, bean3Y: 0.5, bean3Z: -1,
      bean4X: 0, bean4Y: -3.5, bean4Z: 0.5,
      duration: 1
    });

  } else {
    // --- COMPORTAMIENTO MÓVIL (MOBILE) ---
    // Valores de inicio (Hero Section) - Centrado y más pequeño para no obstruir el texto
    target.cupX = 0;
    target.cupY = 1.3;
    target.cupZ = 0;
    target.cupRX = 0.4;
    target.cupRY = -0.5;
    target.cupRZ = 0.1;
    target.cupScale = 0.85;
    
    // Reposicionar granos iniciales en móvil para que no se salgan de pantalla
    target.bean0X = 1.2; target.bean0Y = 2.4; target.bean0Z = 0.5;
    target.bean1X = -1.2; target.bean1Y = 0.2; target.bean1Z = 1;
    target.bean2X = 1.3; target.bean2Y = -1.5; target.bean2Z = 0.2;
    target.bean3X = -1.3; target.bean3Y = 2.5; target.bean3Z = -1.5;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: ".content-wrapper",
        start: "top top",
        end: "bottom bottom",
        scrub: 1.2
      }
    });

    // Móvil: Hero a Origin
    tl.to(target, {
      cupX: 0,
      cupY: 1.1,
      cupScale: 0.72,
      cupRX: 0.25,
      cupRY: 1.2,
      cupRZ: -0.05,
      bean0X: 1.0, bean0Y: 2.2,
      bean1X: -1.0, bean1Y: 1.8,
      duration: 1
    })
    // Móvil: Origin a Roast
    .to(target, {
      cupX: 0,
      cupY: 1.1,
      cupScale: 0.78,
      cupRX: 0.8,
      cupRY: -1.2,
      cupRZ: 0.25,
      bean0X: 0.8, bean0Y: 1.8,
      bean2X: -0.8, bean2Y: 1.9,
      duration: 1
    })
    // Móvil: Roast a Shop
    .to(target, {
      cupX: 0,
      cupY: 1.7, // sube para posicionarse en el header/plato de la tienda
      cupScale: 0.5,
      cupRX: 0.45,
      cupRY: 2.2,
      cupRZ: 0.05,
      bean0X: -1.0, bean0Y: 2.6,
      bean1X: 1.0, bean1Y: 2.6,
      bean2X: -1.2, bean2Y: 1.0,
      bean3X: 1.2, bean3Y: 1.0,
      duration: 1
    });
  }
});


// --- DETECCIÓN DE NAVEGACIÓN ACTIVA EN EL NAVBAR ---
const sections = document.querySelectorAll('.section');
const navLinks = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
  let currentSec = '';
  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.clientHeight;
    // Si el scroll está a más de la mitad de la sección
    if (window.scrollY >= (sectionTop - sectionHeight / 3)) {
      currentSec = section.getAttribute('id');
    }
  });

  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === `#${currentSec}`) {
      link.classList.add('active');
    }
  });
});


// --- BUCLE DE RENDERIZACIÓN & ANIMACIÓN (TICK LOOP) ---
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  
  // 1. Aplicar suavizado LERP en las variables de transformación
  transform.cupX += (target.cupX - transform.cupX) * 0.07;
  transform.cupY += (target.cupY - transform.cupY) * 0.07;
  transform.cupZ += (target.cupZ - transform.cupZ) * 0.07;
  
  transform.cupRX += (target.cupRX - transform.cupRX) * 0.07;
  transform.cupRY += (target.cupRY - transform.cupRY) * 0.07;
  transform.cupRZ += (target.cupRZ - transform.cupRZ) * 0.07;
  
  transform.cupScale += (target.cupScale - transform.cupScale) * 0.07;
  
  // Lerp para los granos de café
  for (let i = 0; i < beansCount; i++) {
    transform[`bean${i}X`] += (target[`bean${i}X`] - transform[`bean${i}X`]) * 0.07;
    transform[`bean${i}Y`] += (target[`bean${i}Y`] - transform[`bean${i}Y`]) * 0.07;
    transform[`bean${i}Z`] += (target[`bean${i}Z`] - transform[`bean${i}Z`]) * 0.07;
  }

  // 2. Asignar valores suavizados al modelo de la taza
  cupGroup.position.set(transform.cupX, transform.cupY, transform.cupZ);
  cupGroup.rotation.set(transform.cupRX, transform.cupRY, transform.cupRZ);
  cupGroup.scale.setScalar(transform.cupScale);
  
  // Agregar una pequeña oscilación flotante (ruido senoidal) a la taza
  cupGroup.position.y += Math.sin(elapsedTime * 1.5) * 0.07;
  cupGroup.rotation.y += Math.cos(elapsedTime * 0.8) * 0.02;

  // 3. Asignar valores suavizados y rotar los granos de café flotantes
  beans.forEach((bean, index) => {
    bean.position.set(
      transform[`bean${index}X`],
      transform[`bean${index}Y`] + Math.sin(elapsedTime * (1 + index * 0.2)) * 0.05, // efecto de flotación asíncrono
      transform[`bean${index}Z`]
    );
    
    // Rotación pasiva continua de los granos
    bean.rotation.x += 0.006 * (index + 1);
    bean.rotation.y += 0.008 * (index + 1);
  });

  // 4. Renderizar
  renderer.render(scene, camera);

  // Llamar en el siguiente frame
  window.requestAnimationFrame(tick);
};

// Iniciar bucle
tick();


// --- SOPORTE RESPONSIVE (RESIZE) ---
window.addEventListener('resize', () => {
  // Actualizar dimensiones
  size.width = window.innerWidth;
  size.height = window.innerHeight;

  // Actualizar cámara
  camera.aspect = size.width / size.height;
  camera.updateProjectionMatrix();

  // Actualizar renderizador
  renderer.setSize(size.width, size.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

