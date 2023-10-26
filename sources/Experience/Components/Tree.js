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

    // tree counts
    this.count = this.seedManager.prng() * 100;

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

    this.sapin = this.resources.items.sapin.scene;
    this.sapin.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
      }
    });

    this.calandula = this.resources.items.calandula.scene;
    this.calandula.traverse((o) => {
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
      this.ages[i] = this.seedManager.prng();
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

    this._normal.add(this._position);

    // Copie de notre arbre
    this.dummy.position.copy(this._position).add(position);

    this.dummy.rotation.set(Math.PI * 0.5, 0, 0);
    // this.dummy.scale.set(this.scales[i], this.scales[i], this.scales[i]);
    // this.dummy.lookAt(this._normal);

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
    this.PARAMS = {};
  }

  update() {
    this.deltaTime = this.time - window.performance.now();
    this.elapsedTime = window.performance.now() * 0.001;
    this.time = window.performance.now();
  }

  destroy() {}
}
