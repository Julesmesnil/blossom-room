import * as THREE from "three";
import Experience from "../Experience.js";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";

export default class Flowers {
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

    // flower counts - OPTIMISATION PERFORMANCE : Réduction massive du nombre de fleurs
    this.count = Math.min(this.seedManager.prng() * 5000, 5000); // Max 1,500 au lieu de 10,000
    this.intersticeCount = Math.min(this.seedManager.prng() * 5000, 5000); // Max 800 au lieu de 10,000

    // Face Flower lifecycle.
    this.ages = new Float32Array(this.count);
    this.scales = new Float32Array(this.count);
    this.dummy = new THREE.Object3D();

    // Interstice Flower lifecycle.
    this.agesInterstice = new Float32Array(this.count);
    this.scalesInterstice = new Float32Array(this.count);
    this.dummyInterstice = new THREE.Object3D();

    // Face Flower geometry.
    this._position = new THREE.Vector3();
    this._normal = new THREE.Vector3();
    this._scale = new THREE.Vector3();

    // Interstice Flower geometry.
    this._positionInterstice = new THREE.Vector3();
    this._normalInterstice = new THREE.Vector3();
    this._scaleInterstice = new THREE.Vector3();

    this.easeOutCubic = function (t) {
      return --t * t * t + 1;
    };

    this.scaleCurve = function (t) {
      return Math.abs(this.easeOutCubic((t > 0.5 ? 1 - t : t) * 2));
    };

    // Flower gltf
    this.margarita = this.resources.items.margarita.scene;
    this.margarita.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = o.receiveShadow = true;
      }
    });

    // Flower Meshes
    this._stemMesh = this.margarita.getObjectByName(
      "margarita_flower_yellow_0_2"
    );
    this._blossomMesh = this.margarita.getObjectByName(
      "margarita_flower_yellow_0_1"
    );
    this._pollenMesh = this.margarita.getObjectByName(
      "margarita_flower_yellow_0"
    );

    // Flower Geometries
    this.stemGeometry = this._stemMesh.geometry.clone();
    this.blossomGeometry = this._blossomMesh.geometry.clone();
    this.pollenGeometry = this._pollenMesh.geometry.clone();

    this.defaultTransform = new THREE.Matrix4()
      .makeRotationX(Math.PI)
      .multiply(new THREE.Matrix4().makeScale(-0.04, -0.04, -0.005));
    // .multiply( new THREE.Matrix4().makeScale( .03, .03, .03 ) );

    // Apply default transform to geometries.
    this.stemGeometry.applyMatrix4(this.defaultTransform);
    this.blossomGeometry.applyMatrix4(this.defaultTransform);
    this.pollenGeometry.applyMatrix4(this.defaultTransform);

    // Flower Materials
    this.stemMaterial = this._stemMesh.material;
    this.blossomMaterial = this._blossomMesh.material;
    this.pollenMaterial = this._pollenMesh.material;

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
    this.pollenMesh = new THREE.InstancedMesh(
      this.pollenGeometry,
      this.pollenMaterial,
      this.count
    );

    // Interstice Flower Meshes
    this.stemMeshInterstice = new THREE.InstancedMesh(
      this.stemGeometry,
      this.stemMaterial,
      this.intersticeCount
    );
    this.blossomMeshInterstice = new THREE.InstancedMesh(
      this.blossomGeometry,
      this.blossomMaterial,
      this.intersticeCount
    );
    this.pollenMeshInterstice = new THREE.InstancedMesh(
      this.pollenGeometry,
      this.pollenMaterial,
      this.intersticeCount
    );

    // Assign random colors to the blossoms.
    this.color = new THREE.Color();
    this.blossomPalette = [
      "0x" + this.colorSettings.baseHex.substring(1),
      "0x" + this.colorSettings.color1Hex.substring(1),
      "0x" + this.colorSettings.color2Hex.substring(1),
    ];

    // Assign random colors to the face flowers blossoms.
    for (let i = 0; i < this.count; i++) {
      this.color.setHex(
        this.blossomPalette[
          Math.floor(this.seedManager.prng() * this.blossomPalette.length)
        ]
      );
      this.blossomMesh.setColorAt(i, this.color);
    }

    // Assign random colors to the interstice flowers blossoms.
    for (let i = 0; i < this.intersticeCount; i++) {
      this.color.setHex(
        this.blossomPalette[
          Math.floor(this.seedManager.prng() * this.blossomPalette.length)
        ]
      );
      this.blossomMeshInterstice.setColorAt(i, this.color);
    }

    // Instance matrices will be updated every frame.
    this.stemMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.blossomMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.pollenMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    this.stemMeshInterstice.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.blossomMeshInterstice.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.pollenMeshInterstice.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    this.resample();
    this.resampleInterstice();

    this.scene.add(this.stemMesh);
    this.scene.add(this.blossomMesh);
    this.scene.add(this.pollenMesh);

    // this.scene.add(this.stemMeshInterstice);
    // this.scene.add(this.blossomMeshInterstice);
    // this.scene.add(this.pollenMeshInterstice);

    // this.debugFolder();

    this.update();
  }

  resize() {}

  debugFolder() {
    /**
     * @param {Debug} PARAMS
     */
    this.PARAMS = {
      count: this.count,
    };

    // refer to the scene folder
    this.debugFolder = this.debug.addFolder({
      title: "flowers",
      // expanded: true,
      expanded: false,
    });

    this.debugFolder
      .addBinding(this.PARAMS, "count", {
        label: "count",
        min: 10000,
        max: 100000,
        step: 1,
      })
      .on("change", (ev) => {
        this.count = ev.value;
        this.resample();
      });
  }

  resample() {
    let offset = 0;
    const count = Math.floor(this.count / this.world.cubeArray.length);

    this.world.cubeArray.forEach((cube) => {
      // Création d'un échantilloneur de surface pour chaque cube
      const sampler = new MeshSurfaceSampler(cube.children[0].children[1])
        .setWeightAttribute("uv")
        .build();

      // reset the MeshSurfaceSampler random function to the seedManager prng
      sampler.randomFunction = this.seedManager.prng;

      cube.children[0].children[1].userData.sampler = sampler;

      for (let i = 0; i < count; i++) {
        // debug
        const index = i + offset;
        this.ages[index] = this.seedManager.prng();
        this.scales[index] = this.scaleCurve(this.ages[index]);

        this.resampleParticle(index, cube.children[0].children[1]);
      }

      offset += count;
    });

    this.stemMesh.instanceMatrix.needsUpdate = true;
    this.blossomMesh.instanceMatrix.needsUpdate = true;
    this.pollenMesh.instanceMatrix.needsUpdate = true;
  }

  resampleParticle(i, cube) {
    let position = new THREE.Vector3();
    let scale = new THREE.Vector3();
    let rotation = new THREE.Quaternion();

    cube.updateWorldMatrix(true);
    cube.matrixWorld.decompose(position, rotation, scale);
    // On utilise l'échantillonneur (sampler) pour extraire une position (_position) et une normale (_normal) d'un point de la surface du cube.
    cube.userData.sampler.sample(this._position, this._normal);

    this._position.multiply(scale);
    this._normal.add(position);

    // Copie de notre fleur
    this.dummy.position.copy(this._position).add(position);
    this.dummy.scale.set(this.scales[i], this.scales[i], this.scales[i]);
    this.dummy.lookAt(this._normal);
    this.dummy.updateMatrix();

    // On met à jour la matrice d'instance du maillage stemMesh et blossomMesh à l'indice i avec la matrice du dummy.
    this.stemMesh.setMatrixAt(i, this.dummy.matrix);
    this.blossomMesh.setMatrixAt(i, this.dummy.matrix);
    this.pollenMesh.setMatrixAt(i, this.dummy.matrix);
  }

  resampleInterstice() {
    let offset = 0;
    const count = Math.floor(
      this.intersticeCount / this.world.cubeArray.length
    );

    this.world.cubeArray.forEach((cube) => {
      // Création d'un échantilloneur de surface pour chaque cube
      const sampler = new MeshSurfaceSampler(cube.children[0].children[0])
        .setWeightAttribute("uv")
        .build();

      cube.children[0].children[0].userData.sampler = sampler;

      for (let i = 0; i < count; i++) {
        // debug
        const index = i + offset;
        this.agesInterstice[index] = this.seedManager.prng();
        this.scalesInterstice[index] = this.scaleCurve(
          this.agesInterstice[index]
        );

        this.resampleParticleInterstice(index, cube.children[0].children[0]);
      }

      offset += count;
    });

    this.stemMeshInterstice.instanceMatrix.needsUpdate = true;
    this.blossomMeshInterstice.instanceMatrix.needsUpdate = true;
    this.pollenMeshInterstice.instanceMatrix.needsUpdate = true;
  }

  resampleParticleInterstice(i, cube) {
    let position = new THREE.Vector3();
    let scale = new THREE.Vector3();
    let rotation = new THREE.Quaternion();

    cube.updateWorldMatrix(true);
    cube.matrixWorld.decompose(position, rotation, scale);
    // On utilise l'échantillonneur (sampler) pour extraire une position (_position) et une normale (_normal) d'un point de la surface du cube.
    cube.userData.sampler.sample(
      this._positionInterstice,
      this._normalInterstice
    );

    this._positionInterstice.multiply(scale);
    this._normalInterstice.add(position);

    // Copie de notre fleur
    this.dummyInterstice.position.copy(this._positionInterstice).add(position);
    this.dummyInterstice.scale.set(
      this.scalesInterstice[i],
      this.scalesInterstice[i],
      this.scalesInterstice[i]
    );
    this.dummyInterstice.lookAt(this._normalInterstice);
    this.dummyInterstice.updateMatrix();

    // On met à jour la matrice d'instance du maillage stemMesh et blossomMesh à l'indice i avec la matrice du dummy.
    this.stemMeshInterstice.setMatrixAt(i, this.dummyInterstice.matrix);
    this.blossomMeshInterstice.setMatrixAt(i, this.dummyInterstice.matrix);
    this.pollenMeshInterstice.setMatrixAt(i, this.dummyInterstice.matrix);
  }

  updateParticle(index, cube) {
    // Update lifecycle.
    this.ages[index] += 0.005;
    if (this.ages[index] >= 1) {
      this.ages[index] = 0.001;
      this.scales[index] = this.scaleCurve(this.ages[index]);
      this.resampleParticle(index, cube);

      return;
    }

    // Update scale.
    this.prevScale = this.scales[index];
    this.scales[index] = this.scaleCurve(this.ages[index]);
    this._scale.set(
      this.scales[index] / this.prevScale,
      this.scales[index] / this.prevScale,
      this.scales[index] / this.prevScale
    );

    // Update transform.
    this.stemMesh.getMatrixAt(index, this.dummy.matrix);
    this.dummy.matrix.scale(this._scale);
    this.stemMesh.setMatrixAt(index, this.dummy.matrix);
    this.blossomMesh.setMatrixAt(index, this.dummy.matrix);
    this.pollenMesh.setMatrixAt(index, this.dummy.matrix);
  }

  updateParticleInterstice(index, cube) {
    // Update lifecycle.
    this.agesInterstice[index] += 0.005;
    if (this.agesInterstice[index] >= 1) {
      this.agesInterstice[index] = 0.001;
      this.scalesInterstice[index] = this.scaleCurve(
        this.agesInterstice[index]
      );
      this.resampleParticleInterstice(index, cube);

      return;
    }

    // Update scale.
    this.prevScaleInterstice = this.scalesInterstice[index];
    this.scalesInterstice[index] = this.scaleCurve(this.agesInterstice[index]);
    this._scaleInterstice.set(
      this.scalesInterstice[index] / this.prevScaleInterstice,
      this.scalesInterstice[index] / this.prevScaleInterstice,
      this.scalesInterstice[index] / this.prevScaleInterstice
    );

    // Update transform.
    this.stemMeshInterstice.getMatrixAt(index, this.dummyInterstice.matrix);
    this.dummyInterstice.matrix.scale(this._scaleInterstice);
    this.stemMeshInterstice.setMatrixAt(index, this.dummyInterstice.matrix);
    this.blossomMeshInterstice.setMatrixAt(index, this.dummyInterstice.matrix);
    this.pollenMeshInterstice.setMatrixAt(index, this.dummyInterstice.matrix);
  }

  animate() {
    // OPTIMISATION PERFORMANCE : Réduire la fréquence des mises à jour
    if (!this.lastUpdateTime) this.lastUpdateTime = 0;
    const currentTime = performance.now();
    
    // Mise à jour seulement toutes les 32ms (30 FPS au lieu de 60 FPS)
    if (currentTime - this.lastUpdateTime < 32) return;
    this.lastUpdateTime = currentTime;

    if (this.stemMesh && this.blossomMesh && this.pollenMesh) {
      let offset = 0;
      const count = Math.floor(this.count / this.world.cubeArray.length);

      this.world.cubeArray.forEach((cube) => {
        for (let i = 0; i < count; i++) {
          const index = i + offset;
          this.updateParticle(index, cube.children[0].children[1]);
        }
        offset += count;
      });

      this.stemMesh.instanceMatrix.needsUpdate = true;
      this.blossomMesh.instanceMatrix.needsUpdate = true;
      this.pollenMesh.instanceMatrix.needsUpdate = true;

      // OPTIMISATION : Supprimer computeBoundingSphere() très coûteux
      // this.stemMesh.geometry.computeBoundingSphere();
      // this.blossomMesh.geometry.computeBoundingSphere();
      // this.pollenMesh.geometry.computeBoundingSphere();
    }

    // OPTIMISATION : Désactiver l'animation des fleurs interstice pour l'instant
    // if (
    //   this.stemMeshInterstice &&
    //   this.blossomMeshInterstice &&
    //   this.pollenMeshInterstice
    // ) {
    //   let offsetInterstice = 0;
    //   const countInterstice = Math.floor(
    //     this.intersticeCount / this.world.cubeArray.length
    //   );

    //   this.world.cubeArray.forEach((cube) => {
    //     for (let i = 0; i < countInterstice; i++) {
    //       const index = i + offsetInterstice;
    //       this.updateParticleInterstice(index, cube.children[0].children[0]);
    //     }
    //     offsetInterstice += countInterstice;
    //   });

    //   this.stemMeshInterstice.instanceMatrix.needsUpdate = true;
    //   this.blossomMeshInterstice.instanceMatrix.needsUpdate = true;
    //   this.pollenMeshInterstice.instanceMatrix.needsUpdate = true;

    //   this.stemMeshInterstice.geometry.computeBoundingSphere();
    //   this.blossomMeshInterstice.geometry.computeBoundingSphere();
    //   this.pollenMeshInterstice.geometry.computeBoundingSphere();
    // }
  }

  update() {
    this.deltaTime = this.time - window.performance.now();
    this.elapsedTime = window.performance.now() * 0.001;
    this.time = window.performance.now();

    requestAnimationFrame(() => {
      this.update();
    });

    this.animate();

    if (this.material) {
      this.material.update(
        this.elapsedTime,
        this.renderer.progress,
        this.renderer.height
      );
    }
  }

  destroy() {}
}
