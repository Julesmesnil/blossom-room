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
            this.debugFolder = this.debug.addFolder({
                title: 'Renderer',
                expanded: false,
            })
        }
        
        this.usePostprocess = false

        // OPTIMISATION : Système de performance adaptive
        this.performanceMode = 'auto' // 'high', 'medium', 'low', 'auto'
        this.frameCount = 0
        this.fpsHistory = []
        this.lastFPSCheck = performance.now()

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
            powerPreference: "high-performance",
            stencil: false,
        })
        this.instance.domElement.style.position = 'absolute'
        this.instance.domElement.style.top = 0
        this.instance.domElement.style.left = 0
        this.instance.domElement.style.width = '100%'
        this.instance.domElement.style.height = '100%'

        this.instance.setClearColor(this.background, 1)
        this.instance.setSize(this.config.width, this.config.height)
        this.instance.setPixelRatio(Math.min(this.config.pixelRatio, 2))

        this.instance.physicallyCorrectLights = false
        this.instance.outputColorSpace = THREE.SRGBColorSpace
        this.instance.toneMapping = THREE.ACESFilmicToneMapping
        this.instance.toneMappingExposure = 1
        
        THREE.ColorManagement.enabled = true
        
        this.instance.shadowMap.enabled = true
        this.instance.shadowMap.type = THREE.PCFSoftShadowMap
        this.instance.shadowMap.autoUpdate = true

        // Fog linéaire pour masquer les bords de la map
        this.setupFog()

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
                progress: this.progress,
                height: this.height,
                step: this.step,
                seed: this.seed,
                performanceMode: this.performanceMode,
                fogNear: 5.0,
                fogFar: 9.0
            }

            this.debugFolder.addBinding(this.PARAMS, 'progress', { min: 0, max: 1, step: 0.01 })
                .on('change', (ev) => {
                    this.progress = ev.value
                })

            this.debugFolder.addBinding(this.PARAMS, 'height', { min: -1, max: 1, step: 0.01 })
                .on('change', (ev) => {
                    this.height = ev.value
                })

            this.debugFolder.addBinding(this.PARAMS, 'step', { min: 0, max: 1, step: 0.01 })
                .on('change', (ev) => {
                    this.step = ev.value
                })

            this.debugFolder.addBinding(this.PARAMS, 'performanceMode', {
                options: {
                    Auto: 'auto',
                    Low: 'low',
                    Medium: 'medium',
                    High: 'high'
                }
            }).on('change', (ev) => {
                this.performanceMode = ev.value
            })

            // Contrôles du fog
            this.debugFolder.addBinding(this.PARAMS, 'fogNear', { min: 1, max: 10, step: 0.1 })
                .on('change', (ev) => {
                    this.updateFog(ev.value, null, null)
                })

            this.debugFolder.addBinding(this.PARAMS, 'fogFar', { min: 5, max: 20, step: 0.1 })
                .on('change', (ev) => {
                    this.updateFog(null, ev.value, null)
                })

            // Contrôles pour l'adaptation fog selon caméra
            this.PARAMS.fogAdaptation = true
            this.debugFolder.addBinding(this.PARAMS, 'fogAdaptation')
                .on('change', (ev) => {
                    this.fogAdaptationEnabled = ev.value
                })
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

        // Post process - Vérification de sécurité pour éviter l'erreur
        if (this.postProcess && this.postProcess.composer) {
            this.postProcess.composer.setSize(this.config.width, this.config.height)
            this.postProcess.composer.setPixelRatio(this.config.pixelRatio)
        }
    }

    checkPerformance()
    {
        this.frameCount++
        const now = performance.now()
        
        // Vérifier les FPS toutes les secondes
        if (now - this.lastFPSCheck > 5000) {
            const fps = this.frameCount
            this.fpsHistory.push(fps)
            this.frameCount = 0
            this.lastFPSCheck = now
            
            // Garder seulement les 5 dernières mesures
            if (this.fpsHistory.length > 5) {
                this.fpsHistory.shift()
            }
            
            // Calculer la moyenne
            const avgFPS = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length
            
            // Ajuster automatiquement la qualité
            if (this.performanceMode === 'auto') {
                if (avgFPS < 30) {
                    // Performance faible - réduire la qualité
                    this.instance.setPixelRatio(1)
                    this.instance.shadowMap.enabled = false
                    console.log('🔴 Performance mode: LOW')
                } else if (avgFPS < 45) {
                    // Performance moyenne - qualité réduite
                    this.instance.setPixelRatio(1.5)
                    this.instance.shadowMap.enabled = true
                    console.log('🟡 Performance mode: MEDIUM')
                } else {
                    // Bonne performance - qualité normale
                    this.instance.setPixelRatio(Math.min(this.config.pixelRatio, 2))
                    this.instance.shadowMap.enabled = true
                    console.log('🟢 Performance mode: HIGH')
                }
            }
        }
    }

    update()
    {
        // OPTIMISATION : Vérifier les performances
        this.checkPerformance()

        // Synchroniser la couleur du fog avec le cycle jour/nuit
        if (this.experience.light && this.experience.light.arcRotation !== undefined) {
            this.updateFogColor(this.experience.light.arcRotation)
        }

        // ADAPTATION FOG SELON ZOOM : Adapter le fog selon la position de la caméra
        if (this.fogAdaptationEnabled && this.experience.camera && this.experience.camera.instance) {
            this.adaptFogToCamera()
        }

        if(this.stats)
        {
            this.stats.beforeRender()
        }

        if(this.usePostprocess && this.postProcess && this.postProcess.composer)
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
        
        if (this.renderTarget) {
            this.renderTarget.dispose()
        }
        
        if (this.postProcess && this.postProcess.composer) {
            this.postProcess.composer.renderTarget1.dispose()
            this.postProcess.composer.renderTarget2.dispose()
        }
    }

    setupFog()
    {
        // FOG DYNAMIQUE : Couleur qui suit le cycle jour/nuit comme le Sky
        const fogColor = new THREE.Color('#E1D3B3') // Couleur harmonisée avec le ciel de jour
        const fogNear = 5.0 // Augmenté pour réduire l'intensité (commence plus loin)
        const fogFar = 9.0 // Légèrement augmenté aussi
        
        this.scene.fog = new THREE.Fog(fogColor, fogNear, fogFar)
        
        // Assurer que le fog utilise la même couleur que le background
        this.instance.setClearColor(fogColor, 1)
        
        // Stocker pour ajustements dynamiques
        this.fogColor = fogColor
        this.fogNear = fogNear
        this.fogFar = fogFar
        
        // Couleurs cibles pour la transition jour/nuit (harmonisées avec le Sky)
        this.fogDayColor = new THREE.Color('#E1D3B3') // Jour - beige comme le Sky (uColor1)
        this.fogNightColor = new THREE.Color('#4140C2') // Nuit - bleu comme le Sky (targetColor1)
        
        // ADAPTATION FOG SELON ZOOM : Activer l'adaptation par défaut
        this.fogAdaptationEnabled = true
    }

    // Méthode pour ajuster le fog dynamiquement (mise à jour pour fog linéaire)
    updateFog(near = null, far = null, color = null)
    {
        if (this.scene.fog) {
            if (near !== null) {
                this.scene.fog.near = near
                this.fogNear = near
            }
            if (far !== null) {
                this.scene.fog.far = far
                this.fogFar = far
            }
            if (color !== null) {
                this.scene.fog.color.copy(color)
                this.instance.setClearColor(color, 1)
                this.fogColor = color
            }
        }
    }

    // Méthode pour synchroniser la couleur du fog avec le cycle jour/nuit
    updateFogColor(arcRotation)
    {
        if (this.scene.fog && this.fogDayColor && this.fogNightColor) {
            // Utiliser la même fonction que le Sky pour calculer le facteur
            const calculateA = (B) => {
                if (B <= 0 || B >= 1) {
                    return 1;
                } else if (B === 0.5) {
                    return 0;
                } else if (B < 0.5) {
                    return (1 - B / 0.5) * 1 + (B / 0.5) * 0; // lerp(1, 0, B / 0.5)
                } else {
                    return (1 - (B - 0.5) / 0.5) * 0 + ((B - 0.5) / 0.5) * 1; // lerp(0, 1, (B - 0.5) / 0.5)
                }
            }

            const step = calculateA(arcRotation);
            const lerpedFogColor = this.fogDayColor.clone().lerp(this.fogNightColor, step);
            
            // Ajuster aussi la distance du fog : plus proche la nuit pour être plus visible
            const fogNearDay = 5.0;
            const fogNearNight = 3.5; // Plus proche la nuit
            const lerpedFogNear = fogNearDay * (1 - step) + fogNearNight * step;
            
            this.scene.fog.color.copy(lerpedFogColor);
            this.scene.fog.near = lerpedFogNear;
            this.instance.setClearColor(lerpedFogColor, 1);
        }
    }

    // ADAPTATION FOG SELON ZOOM : Méthode pour maintenir le fog aux mêmes coordonnées absolues
    adaptFogToCamera()
    {
        if (!this.scene.fog) return;

        const cameraZ = this.experience.camera.instance.position.z;
        
        // Valeurs de base (quand caméra à Z = 3.5)
        const baseFogNear = 5.0;
        const baseFogFar = 9.0;
        const baseCameraZ = 3.5;
        
        // COMPENSATION EXACTE : Le fog doit rester aux mêmes coordonnées absolues dans l'espace monde
        // Si la caméra bouge de X unités, on ajuste le fog de X unités pour qu'il reste au même endroit
        const cameraMovement = cameraZ - baseCameraZ;
        
        // Compenser exactement le mouvement de caméra
        // Si caméra recule de 1 unité, fog doit avancer de 1 unité pour rester au même endroit
        const compensatedFogNear = baseFogNear + cameraMovement;
        const compensatedFogFar = baseFogFar + cameraMovement;
        
        // Appliquer les nouvelles valeurs (seulement si elles ont changé significativement)
        const threshold = 0.05; // Seuil plus fin pour plus de précision
        if (Math.abs(this.scene.fog.near - compensatedFogNear) > threshold) {
            this.scene.fog.near = compensatedFogNear;
        }
        if (Math.abs(this.scene.fog.far - compensatedFogFar) > threshold) {
            this.scene.fog.far = compensatedFogFar;
        }
    }
}