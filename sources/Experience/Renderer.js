import * as THREE from "three";
import Experience from "./Experience.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
// import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

export default class Renderer {
  constructor(_options = {}) {
    this.experience = new Experience();
    this.config = this.experience.config;
    this.debug = this.experience.debug;
    this.seedManager = this.experience.seedManager;
    this.stats = this.experience.stats;
    this.time = this.experience.time;
    this.sizes = this.experience.sizes;
    this.scene = this.experience.scene;
    this.colorSettings = this.experience.colorSettings;
    this.camera = this.experience.camera;
    this.world = this.experience.world;

    this.progress = 1;
    this.height = 0;
    this.step = 0.4;
    this.seed = this.seedManager.seed;

    this.threshold = 0;
    this.strength = .3;
    this.radius = 0.5;
    this.exposure = 1;

    this.BLOOM_SCENE = 1;

	this.bloomLayer = new THREE.Layers();
	this.bloomLayer.set( this.BLOOM_SCENE );

    // Alea setup
    this.prng = this.seedManager.prng;

    // Debug
    if (this.debug) {
      this.debugFolder = this.debug.addFolder({
        title: "scene",
        expanded: true,
      });
    }

    this.usePostprocess = false;

    this.setInstance();
    this.setPostProcess();
  }

  setInstance() {
    // this.background = '#ddf0ff'
    this.background = "#1e3342";

    // Renderer
    this.instance = new THREE.WebGLRenderer({
      // alpha: false,
      antialias: true,
    });
    this.instance.domElement.style.position = "absolute";
    this.instance.domElement.style.top = 0;
    this.instance.domElement.style.left = 0;
    this.instance.domElement.style.width = "100%";
    this.instance.domElement.style.height = "100%";

    this.instance.setClearColor(this.background, 1);
    this.instance.setSize(this.config.width, this.config.height);
    this.instance.setPixelRatio(this.config.pixelRatio);

    this.instance.physicallyCorrectLights = false;
    // this.instance.outputColorSpace = THREE.SRGBColorSpace
    this.instance.toneMapping = THREE.ACESFilmicToneMapping;
    this.instance.toneMappingExposure = 0.8;

    this.instance.shadowMap.enabled = true;
    this.instance.shadowMap.type = THREE.PCFSoftShadowMap;
    // this.instance.shadowMap.autoUpdate = true

    this.context = this.instance.getContext();

    // Add stats panel
    if (this.stats) {
      this.stats.setRenderPanel(this.context);
    }

    // Debug
    if (this.debug) {
      // PARAMS
      this.PARAMS = {
        background: this.background,
        seed: this.seed,
        progress: this.progress,
        height: this.height,
        step: this.step,
      };

      // DEBUG FOLDER
      this.debugFolder
        .addBinding(this.PARAMS, "background")
        .on("change", (ev) => {
          this.instance.setClearColor(ev.value);
        });

      this.debugFolder.addBinding(this.PARAMS, "seed").on("change", (ev) => {
        this.seed = ev.value;
        this.prng = new Alea(this.seed);
      });

      this.debugFolder
        .addBinding(this.PARAMS, "step", { min: 0, max: 1, step: 0.01 })
        .on("change", (ev) => {
          this.step = ev.value;
        });
    }
  }

  setPostProcess() {
    this.postProcess = {};

    /**
     * Render pass
     */
    this.postProcess.renderPass = new RenderPass(
      this.scene,
      this.camera.instance
    );

    /**
     * Effect composer
     */
    this.renderTarget = new THREE.WebGLRenderTarget(
      this.config.width,
      this.config.height,
      {
        generateMipmaps: false,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBFormat,
        encoding: THREE.sRGBEncoding,
        samples: 2,
      }
    );
    this.postProcess.composer = new EffectComposer(
      this.instance,
      this.renderTarget
    );
    this.postProcess.composer.setSize(this.config.width, this.config.height);
    this.postProcess.composer.setPixelRatio(this.config.pixelRatio);

    this.postProcess.composer.addPass(this.postProcess.renderPass);

    /**
     * Bloom pass
     */
    this.postProcess.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(this.config.width, this.config.height),
      1.5,
      0.4,
      0.85
    );
    this.postProcess.bloomPass.threshold = this.threshold;
    this.postProcess.bloomPass.strength = this.strength;
    this.postProcess.bloomPass.radius = this.radius;

    /**
     * Bloom Composer
     */
    this.postProcess.composer.renderToScreen = true;
    this.postProcess.composer.addPass(this.postProcess.renderPass);
    this.postProcess.composer.addPass(this.postProcess.bloomPass);

    /**
     * Shader pass
     */
    this.postProcess.mixPass = new ShaderPass(
      new THREE.ShaderMaterial({
        uniforms: {
          baseTexture: { value: null },
          bloomTexture: {
            value: this.postProcess.composer.renderTarget2.texture,
          },
        },
        vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }`,
        fragmentShader: `
      uniform sampler2D baseTexture;
      uniform sampler2D bloomTexture;
        varying vec2 vUv;
        void main() {
          gl_FragColor = ( texture2D( baseTexture, vUv ) + vec4( 1.0 ) * texture2D( bloomTexture, vUv ) );
        }`,
        defines: {},
      }),
      "baseTexture"
    );
    this.postProcess.mixPass.needsSwap = true;

    // this.postProcess.outputPass = new OutputPass();

    /**
     * Final composer
     */
    this.postProcess.finalComposer = new EffectComposer(
      this.instance,
      this.renderTarget
    );
    this.postProcess.finalComposer.addPass(this.postProcess.renderPass);
    this.postProcess.finalComposer.addPass(this.postProcess.mixPass);
    // this.postProcess.finalComposer.addPass(this.postProcess.outputPass);

    function disposeMaterial( obj ) {
        if ( obj.material ) {

            obj.material.dispose();

        }
    }

    function darkenNonBloomed( obj ) {

        if ( obj.isMesh && bloomLayer.test( obj.layers ) === false ) {

            materials[ obj.uuid ] = obj.material;
            obj.material = darkMaterial;

        }

    }

    function restoreMaterial( obj ) {

        if ( materials[ obj.uuid ] ) {

            obj.material = materials[ obj.uuid ];
            delete materials[ obj.uuid ];

        }

    }

    function bloomRender() {

        // this.scene.traverse( darkenNonBloomed );
        this.bloomComposer.render();
        // this.scene.traverse( restoreMaterial );

        // render the entire scene, then render bloom scene on top
        //this.finalComposer.render();

    }
  }

  resize() {
    // Instance
    this.instance.setSize(this.config.width, this.config.height);
    this.instance.setPixelRatio(this.config.pixelRatio);

    // Post process
    this.postProcess.composer.setSize(this.config.width, this.config.height);
    this.postProcess.composer.setPixelRatio(this.config.pixelRatio);
  }

  update() {
    if (this.stats) {
      this.stats.beforeRender();
    }

    // if (this.usePostprocess) {
    //   this.postProcess.composer.render();
    // } else {
      this.instance.render(this.scene, this.camera.instance);
    // }

    if (this.stats) {
      this.stats.afterRender();
    }
  }

  destroy() {
    this.instance.renderLists.dispose();
    this.instance.dispose();
    this.renderTarget.dispose();
    this.postProcess.composer.renderTarget1.dispose();
    this.postProcess.composer.renderTarget2.dispose();
  }
}
