import * as THREE from "three";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";
import Experience from "../Experience.js";

export default class Tree {
  constructor(_options) {
    this.experience = new Experience();
    this.config = this.experience.config;
    this.scene = this.experience.scene;
    this.debug = this.experience.debug;
    this.resources = this.experience.resources;
    this.renderer = this.experience.renderer;
    this.world = this.experience.world;

    // Set up
    this.mode = "debug";

    // tree counts
    this.count = 100;

    this.ages = new Float32Array(this.count);
    this.scales = new Float32Array(this.count);
    this.dummy = new THREE.Object3D();

    this._position = new THREE.Vector3();
    this._normal = new THREE.Vector3();
    this._scale = new THREE.Vector3();

    this.easeOutCubic = function (t) {
      return --t * t * t + 1;
    };

    this.scaleCurve = function (t) {
      return Math.abs(this.easeOutCubic((t > 0.5 ? 1 - t : t) * 2));
    };

    this.tree = this.resources.items.tree.scene;
    this.tree.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = o.receiveShadow = true;
      }
    });

    this.sapin = this.resources.items.sapin.scene;
    this.sapin.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
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

    // Assign random colors to the blossoms.
    this.color = new THREE.Color();
    this.blossomPalette = [
      0xf20587, 0xf2d479, 0xf2c879, 0xf2b077, 0xf24405, 0xccff00, 0xffff00,
      0xffcccc, 0xcc66ff, 0xcc0000, 0xff00ff, 0xff0033, 0x6600ff, 0x6699ff,
      0x00ff33,
    ];

    // Assign random colors to the face flowers blossoms.
    for (let i = 0; i < this.count; i++) {
      this.color.setHex(
        this.blossomPalette[
          Math.floor(this.renderer.prng() * this.blossomPalette.length)
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

    // this.debugFolder();

    // this.update();
  }

  resample() {
    // Création d'un échantilloneur de surface pour chaque cube
    this.sampler = new MeshSurfaceSampler(this.world.plane)
      .setWeightAttribute("uv")
      .build();

    //   cube.children[0].children[1].userData.sampler = sampler;

    for (let i = 0; i < this.count; i++) {
      // debug
      this.ages[i] = this.renderer.prng();
      this.scales[i] = this.scaleCurve(this.ages[i]);

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

    // this._position.multiply(scale);
    this._normal.add(this._position);

    // Copie de notre arbre
    this.dummy.position.copy(this._position).add(position);
    this.dummy.scale.set(this.scales[i], this.scales[i], this.scales[i]);
    this.dummy.lookAt(this._normal);
    this.dummy.updateMatrix();

    // On met à jour la matrice d'instance du maillage stemMesh et blossomMesh à l'indice i avec la matrice du dummy.
    this.stemMesh.setMatrixAt(i, this.dummy.matrix);
    this.blossomMesh.setMatrixAt(i, this.dummy.matrix);
  }

  resize() {}

  debugFolder() {
    /**
     * @param {Debug} PARAMS
     */
    this.PARAMS = {};
  }

  update() {
    this.deltaTime = this.time - window.performance.now();
    this.elapsedTime = window.performance.now() * 0.001;
    this.time = window.performance.now();
  }

  destroy() {}
}
