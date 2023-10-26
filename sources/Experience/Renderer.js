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
        this.stats = this.experience.stats
        this.time = this.experience.time
        this.sizes = this.experience.sizes
        this.scene = this.experience.scene
        this.colorSettings = this.experience.colorSettings
        this.camera = this.experience.camera
        this.world = this.experience.world

        this.progress = 1;
        this.height = 0;
        this.seed = this.colorSettings.seed;

        // Alea setup
        this.prng = this.colorSettings.prng;

        // Debug
        if(this.debug)
        {
            this.debugFolder = this.debug.addFolder({
                title: 'scene',
                expanded: true,
            })
        }
        
        this.usePostprocess = false

        this.setInstance()
        this.setPostProcess()
    }

    setInstance()
    {
        // this.background = '#ddf0ff'
        this.background = '#1e3342'

        // Renderer
        this.instance = new THREE.WebGLRenderer({
            // alpha: false,
            antialias: true
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
        // this.instance.outputColorSpace = THREE.SRGBColorSpace
        this.instance.toneMapping = THREE.ACESFilmicToneMapping
        this.instance.toneMappingExposure = .8
        
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
                progress: this.progress,
                height: this.height,
            }

            // DEBUG FOLDER
            this.debugFolder
                .addBinding(this.PARAMS, 'background')
                .on('change', (ev) => {
                    this.instance.setClearColor(ev.value)
                });

            this.debugFolder
                .addBinding(
                    this.PARAMS,
                    'seed',
                )
                .on('change', (ev) => {
                    this.seed = ev.value
                    this.prng = new Alea(this.seed);
                });

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
            this.instance.render(this.scene, this.camera.instance)
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