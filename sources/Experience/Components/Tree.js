import * as THREE from "three";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";
import Experience from "../Experience.js";

export default class Tree {
  constructor(_options) {
    this.experience = new Experience();
    this.config = this.experience.config;
    this.scene = this.experience.scene;
    this.debug = this.experience.debug;
    this.seedManager = this.experience.seedManager;
    this.resources = this.experience.resources;
    this.renderer = this.experience.renderer;
    this.world = this.experience.world;
    this.colorSettings = this.experience.colorSettings;

    // Set up
    this.mode = "debug";

    // tree counts - OPTIMISATION PERFORMANCE : Réduction du nombre de sapins
    this.count = Math.min(this.seedManager.prng() * 300, 300); // Max 200 au lieu de 500

    this.ages = new Float32Array(this.count);
    this.scales = new Float32Array(this.count);
    this.dummy = new THREE.Object3D();

    // ANIMATION VENT : Stockage des données d'animation optimisé
    this.baseRotations = new Float32Array(this.count * 3); // x, y, z pour chaque sapin
    this.windOffsets = new Float32Array(this.count); // Décalage temporel pour chaque sapin
    this.windStrengths = new Float32Array(this.count); // Intensité du vent pour chaque sapin

    this._position = new THREE.Vector3();
    this._normal = new THREE.Vector3();
    this._scale = new THREE.Vector3();

    this.easeOutCubic = function (t) {
      return --t * t * t + 1;
    };

    this.scaleCurve = function (t) {
      return Math.abs(this.easeOutCubic((t > 0.5 ? 1 - t : t) * 2));
    };

    this.sapin = this.resources.items.sapin.scene;
    this.sapin.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });

    this.calandula = this.resources.items.calandula.scene;
    this.calandula.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });

    // Flower Meshes
    this._stemMesh = this.sapin.getObjectByName("Cylinder_Material001_0");
    this._blossomMesh = this.sapin.getObjectByName("Cylinder_Material002_0");

    // Flower Geometries
    this.stemGeometry = this._stemMesh.geometry.clone();
    this.blossomGeometry = this._blossomMesh.geometry.clone();

    this.defaultTransform = new THREE.Matrix4()
      .makeRotationX(Math.PI)
      .multiply(new THREE.Matrix4().makeScale(0.01, 0.01, 0.01));
    // .multiply( new THREE.Matrix4().makeScale( .03, .03, .03 ) );

    // Apply default transform to geometries.
    this.stemGeometry.applyMatrix4(this.defaultTransform);
    this.blossomGeometry.applyMatrix4(this.defaultTransform);

    // Flower Materials
    this.stemMaterial = this._stemMesh.material;
    this.blossomMaterial = this._blossomMesh.material;

    // Face Flower Meshes
    this.stemMesh = new THREE.InstancedMesh(
      this.stemGeometry,
      this.stemMaterial,
      this.count
    );
    this.blossomMesh = new THREE.InstancedMesh(
      this.blossomGeometry,
      this.blossomMaterial,
      this.count
    );

    // Activer les ombres pour les sapins
    this.stemMesh.castShadow = true;
    // this.stemMesh.receiveShadow = true;
    this.blossomMesh.castShadow = true;
    // this.blossomMesh.receiveShadow = true;

    // Assign random colors to the blossoms.
    this.color = new THREE.Color();
    this.blossomPalette = [
      "0x" + this.colorSettings.baseHex.substring(1),
      "0x" + this.colorSettings.color1Hex.substring(1),
      "0x" + this.colorSettings.color2Hex.substring(1),
    ];
    // this.blossomPalette = [
    //   0xf20587, 0xf2d479, 0xf2c879, 0xf2b077, 0xf24405, 0xccff00, 0xffff00,
    //   0xffcccc, 0xcc66ff, 0xcc0000, 0xff00ff, 0xff0033, 0x6600ff, 0x6699ff,
    //   0x00ff33,
    // ];

    // Assign random colors to the face flowers blossoms.
    for (let i = 0; i < this.count; i++) {
      this.color.setHex(
        this.blossomPalette[
          Math.floor(this.seedManager.prng() * this.blossomPalette.length)
        ]
      );
      this.blossomMesh.setColorAt(i, this.color);
    }

    // Instance matrices will be updated every frame.
    this.stemMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.blossomMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    this.resample();

    this.scene.add(this.stemMesh);
    this.scene.add(this.blossomMesh);

    // ANIMATION VENT : Variables de contrôle
    this.windEnabled = true;
    this.windSpeed = 0.8;
    this.windStrength = 0.15;

    this.debugFolder();

    // this.update();
  }

  resample() {
    // Création d'un échantilloneur de surface pour chaque cube
    this.sampler = new MeshSurfaceSampler(this.world.plane)
      .setWeightAttribute("uv")
      .build();

    // reset the MeshSurfaceSampler random function to the seedManager prng
    this.sampler.randomFunction = this.seedManager.prng;

    //   cube.children[0].children[1].userData.sampler = sampler;

    for (let i = 0; i < this.count; i++) {
      // debug
      this.ages[i] = this.seedManager.prng();
      this.scales[i] = this.scaleCurve(this.ages[i]);

      // ANIMATION VENT : Initialiser les paramètres de vent pour chaque sapin
      this.windOffsets[i] = this.seedManager.prng() * Math.PI * 2; // Décalage temporel aléatoire
      this.windStrengths[i] = 0.3 + this.seedManager.prng() * 0.4; // Intensité entre 0.3 et 0.7

      this.resampleParticle(i, this.world.plane);
    }

    this.stemMesh.instanceMatrix.needsUpdate = true;
    this.blossomMesh.instanceMatrix.needsUpdate = true;
  }

  resampleParticle(i, plane) {
    let position = new THREE.Vector3();
    let scale = new THREE.Vector3();
    let rotation = new THREE.Quaternion();

    plane.updateWorldMatrix(true);
    plane.matrixWorld.decompose(position, rotation, scale);

    // On utilise l'échantillonneur (sampler) pour extraire une position (_position) et une normale (_normal) d'un point de la surface du sol.
    this.sampler.sample(this._position, this._normal);

    this._normal.add(this._position);

    // Copie de notre arbre
    this.dummy.position.copy(this._position).add(position);

    this.dummy.rotation.set(Math.PI * 0.5, 0, 0);
    // this.dummy.scale.set(this.scales[i], this.scales[i], this.scales[i]);
    // this.dummy.lookAt(this._normal);

    // ANIMATION VENT : Stocker la rotation de base pour l'animation
    this.baseRotations[i * 3] = this.dummy.rotation.x;
    this.baseRotations[i * 3 + 1] = this.dummy.rotation.y;
    this.baseRotations[i * 3 + 2] = this.dummy.rotation.z;

    this.dummy.updateMatrix();

    // let x = this.dummy.position.x;
    // let z = this.dummy.position.z;
    // let add = true;

    // for (let i = 0; i < this.world.vdata.cells.length; i++) {
    //   let p = this.world.vdata.cells[i].site;
    //   let dx = p.x - x;
    //   let dz = p.z - z;

    //   if (dx * dx + dz * dz < 0.3) {
    //     add = false;
    //     this.dummy.scale.set(0, 0, 0);
    //     break;
    //   }
    // }
    // // On met à jour la matrice d'instance du maillage stemMesh et blossomMesh à l'indice i avec la matrice du dummy.
    // if(add){

    // }

    this.stemMesh.setMatrixAt(i, this.dummy.matrix);
    this.blossomMesh.setMatrixAt(i, this.dummy.matrix);
  }

  resize() {}

  debugFolder() {
    /**
     * @param {Debug} PARAMS
     */
    this.PARAMS = {
      windEnabled: true,
      windSpeed: 0.8,
      windStrength: 0.15
    };

    if(this.debug) {
      this.debugFolder = this.debug.addFolder({
        title: 'Animation Vent',
        expanded: false,
      });

      this.debugFolder.addBinding(this.PARAMS, 'windEnabled')
        .on('change', (ev) => {
          this.windEnabled = ev.value;
        });

      this.debugFolder.addBinding(this.PARAMS, 'windSpeed', { min: 0.1, max: 2.0, step: 0.1 })
        .on('change', (ev) => {
          this.windSpeed = ev.value;
        });

      this.debugFolder.addBinding(this.PARAMS, 'windStrength', { min: 0.05, max: 0.5, step: 0.05 })
        .on('change', (ev) => {
          this.windStrength = ev.value;
        });
    }
  }

  update() {
    this.deltaTime = this.time - window.performance.now();
    this.elapsedTime = window.performance.now() * 0.001;
    this.time = window.performance.now();

    // ANIMATION VENT : Animer les sapins seulement si activé et performances suffisantes
    if (this.windEnabled && this.renderer.performanceMode !== 'low') {
      this.animateWind();
    }
  }

  // ANIMATION VENT : Méthode optimisée pour animer le vent
  animateWind() {
    const time = this.elapsedTime;
    const windSpeed = this.windSpeed; // Vitesse du vent (plus bas = plus lent)
    const windStrength = this.windStrength; // Force globale du vent (plus bas = plus subtil)
    
    // Optimisation : Animer seulement 1 sapin sur 2 à chaque frame (60fps -> 30fps pour l'animation)
    const startIndex = Math.floor(time * 30) % 2; // Alterne entre 0 et 1
    
    for (let i = startIndex; i < this.count; i += 2) {
      // Calcul de l'oscillation du vent avec décalage temporel unique
      const windTime = time * windSpeed + this.windOffsets[i];
      const windX = Math.sin(windTime) * windStrength * this.windStrengths[i];
      const windY = Math.sin(windTime * 0.7 + this.windOffsets[i] * 0.5) * windStrength * this.windStrengths[i] * 0.6;
      
      // Récupérer la matrice actuelle pour garder position et échelle
      this.stemMesh.getMatrixAt(i, this.dummy.matrix);
      this.dummy.matrix.decompose(this.dummy.position, this.dummy.quaternion, this.dummy.scale);
      
      // Appliquer l'animation de vent à partir de la rotation de base
      this.dummy.rotation.x = this.baseRotations[i * 3] + windX;
      this.dummy.rotation.y = this.baseRotations[i * 3 + 1]+ windY;
      this.dummy.rotation.z = this.baseRotations[i * 3 + 2];
      
      this.dummy.updateMatrix();
      
      // Mettre à jour les deux meshes (tige et feuillage)
      this.stemMesh.setMatrixAt(i, this.dummy.matrix);
      this.blossomMesh.setMatrixAt(i, this.dummy.matrix);
    }
    
    // Marquer les matrices comme nécessitant une mise à jour
    this.stemMesh.instanceMatrix.needsUpdate = true;
    this.blossomMesh.instanceMatrix.needsUpdate = true;
  }

  destroy() {}
}
