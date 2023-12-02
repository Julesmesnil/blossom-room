import * as THREE from 'three'
import Experience from './Experience.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'

export default class Renderer
{
    constructor(_options = {})
    {
        this.experience = new Experience()
        this.config = this.experience.config
        this.debug = this.experience.debug
        this.seedManager = this.experience.seedManager
        this.stats = this.experience.stats
        this.time = this.experience.time
        this.sizes = this.experience.sizes
        this.scene = this.experience.scene
        this.colorSettings = this.experience.colorSettings
        this.camera = this.experience.camera
        this.world = this.experience.world

        this.progress = 1;
        this.height = 0;
        this.step = 0.4;
        this.seed = this.seedManager.seed;

        // Alea setup
        this.prng = this.seedManager.prng;

        // Debug
        if(this.debug)
        {
            // this.debugFolder = this.debug.addFolder({
            //     title: 'scene',
            //     // expanded: true,
            //     expanded: false,
            // })
        }
        
        this.usePostprocess = false

        this.setInstance()
        // this.setPostProcess()
        // this.makeTextureScene()
    }

    // makeTextureScene()
    // {
    //     this.textureScene = new THREE.Scene();

    //     this.PlaneGeometry = new THREE.PlaneGeometry(2, 2);
    //     this.customPlaneMaterial = new THREE.ShaderMaterial({
    //         vertexShader: `
    //             varying vec2 vUv;

    //             void main() {
    //                 vUv = uv;
    //                 gl_Position = vec4(position, 1.0);
    //             }
    //         `,
    //         fragmentShader: `
    //             varying vec2 vUv;
    
    //             void main() {

    //                 vec2    center = vec2(0.5);
    //                 float   distToCenter = length(vUv - center);
    //                 float  circle = step(.2, distToCenter);
                    
    //                 // discard the black part of the texture
    //                 float a = 1.;

    //                 if(circle == 0.0){
    //                     a = 0.;
    //                 }

    //                 gl_FragColor = vec4(a);
    //             }
    //         `,
    //     })

    //     this.planeTextureMesh = new THREE.Mesh(this.PlaneGeometry, this.customPlaneMaterial);

    //     this.textureScene.add(this.planeTextureMesh);


    //     this.textureSceneTarget = new THREE.WebGLRenderTarget(
    //         this.config.width,
    //         this.config.height,
    //         {
    //         format: THREE.RGBAFormat,
    //         // magFilter: THREE.NearestFilter,
    //         // minFilter: THREE.NearestFilter,
    //         // generateMipmaps: false,
    //         // depthBuffer: false,
    //         // stencilBuffer: false,
    //         // type: THREE.FloatType,
    //         // depthTexture: false,
    //         // depthTextureType: THREE.FloatType,
    //         })

    //     // this.instance.render(this.textureScene, this.camera.instance);
    // }

    setInstance()
    {
        // this.background = '#ddf0ff'
        this.background = '#1e3342'

        // Renderer
        this.instance = new THREE.WebGLRenderer({
            // alpha: false,
            antialias: true,
        })
        this.instance.domElement.style.position = 'absolute'
        this.instance.domElement.style.top = 0
        this.instance.domElement.style.left = 0
        this.instance.domElement.style.width = '100%'
        this.instance.domElement.style.height = '100%'

        this.instance.setClearColor(this.background, 1)
        this.instance.setSize(this.config.width, this.config.height)
        this.instance.setPixelRatio(this.config.pixelRatio)

        this.instance.physicallyCorrectLights = false
        this.instance.outputColorSpace = THREE.SRGBColorSpace
        this.instance.toneMapping = THREE.ACESFilmicToneMapping
        this.instance.toneMappingExposure = 1
        
        this.instance.shadowMap.enabled = true
        this.instance.shadowMap.type = THREE.PCFSoftShadowMap
        // this.instance.shadowMap.autoUpdate = true

        this.context = this.instance.getContext()

        // Add stats panel
        if(this.stats)
        {
            this.stats.setRenderPanel(this.context)
        }
        
        // Debug
        if(this.debug)
        {
            // PARAMS
            this.PARAMS = {
                background: this.background,
                seed: this.seed,
            }

            // DEBUG FOLDER
            // this.debugFolder
            //     .addBinding(this.PARAMS, 'background')
            //     .on('change', (ev) => {
            //         this.instance.setClearColor(ev.value)
            //     });

            // this.debugFolder
            //     .addBinding(
            //         this.PARAMS,
            //         'seed',
            //     )
            //     .on('change', (ev) => {
            //         this.seed = ev.value
            //         this.prng = new Alea(this.seed);
            //     });
        }
    }

    setPostProcess()
    {
        this.postProcess = {}

        /**
         * Render pass
         */
        this.postProcess.renderPass = new RenderPass(this.scene, this.camera.instance)

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
                samples: 2
            }
        )
        this.postProcess.composer = new EffectComposer(this.instance, this.renderTarget)
        this.postProcess.composer.setSize(this.config.width, this.config.height)
        this.postProcess.composer.setPixelRatio(this.config.pixelRatio)

        this.postProcess.composer.addPass(this.postProcess.renderPass)
    }

    resize()
    {
        // Instance
        this.instance.setSize(this.config.width, this.config.height)
        this.instance.setPixelRatio(this.config.pixelRatio)

        // Post process
        this.postProcess.composer.setSize(this.config.width, this.config.height)
        this.postProcess.composer.setPixelRatio(this.config.pixelRatio)
    }

    update()
    {
        if(this.stats)
        {
            this.stats.beforeRender()
        }

        if(this.usePostprocess)
        {
            this.postProcess.composer.render()
        }
        else
        {
            // this.instance.setRenderTarget(this.textureSceneTarget);
            // this.instance.render(this.textureScene, this.camera.instance);
            // this.instance.setRenderTarget(null);
            this.instance.render(this.scene, this.camera.instance);
        }

        if(this.stats)
        {
            this.stats.afterRender()
        }
    }

    destroy()
    {
        this.instance.renderLists.dispose()
        this.instance.dispose()
        this.renderTarget.dispose()
        this.postProcess.composer.renderTarget1.dispose()
        this.postProcess.composer.renderTarget2.dispose()
    }
}