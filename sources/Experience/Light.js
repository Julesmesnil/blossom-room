import { AmbientLight, DirectionalLight, DirectionalLightHelper, PointLight, PointLightHelper, SpotLight, SpotLightHelper } from 'three'
import { ShadowMapViewer } from 'three/examples/jsm/utils/ShadowMapViewer.js';
import Experience from './Experience.js'

export default class Light
{
    constructor(_options)
    {
        // Options
        this.experience = new Experience()
        this.config = this.experience.config
        this.debug = this.experience.debug
        this.time = this.experience.time
        this.sizes = this.experience.sizes
        this.targetElement = this.experience.targetElement
        this.scene = this.experience.scene
        this.renderer = this.experience.renderer

        // Set up
        this.mode = 'debug' // defaultLight, debugLight

        this.setInstance()
        this.setModes()
    }

    setInstance()
    {
        // Set up
        // this.instance = new DirectionalLight(0xf8c08a, 1)
        this.instance = new DirectionalLight(0xf8c08a, 1)
        this.instance.position.set(2, 2, -3)
        // this.instance.position.set(3.9, 1.8, -3)
        this.instance.castShadow = true
        this.instance.shadow.camera.near = -2
        this.instance.shadow.camera.far = 10
        this.instance.shadow.camera.left = -2
        this.instance.shadow.camera.right = 3
        this.instance.shadow.camera.top = 1.5
        this.instance.shadow.camera.bottom = -2
        this.instance.shadow.mapSize.width = 2048
        this.instance.shadow.mapSize.height = 2048
        this.instance.shadow.normalBias = 0.01
        this.instance.intensity = 2
        this.scene.add(this.instance)

        this.AmbientLight = new AmbientLight(0xffffff, 0.5)
        this.scene.add(this.AmbientLight)

        // helper
        this.directionnalLightHelper = new DirectionalLightHelper(this.instance, 0.1)
        this.scene.add(this.directionnalLightHelper)

        // const lightShadowMapViewer = new ShadowMapViewer( this.instance );
        // lightShadowMapViewer.position.x = 10;
        // lightShadowMapViewer.position.y = 10;
        // lightShadowMapViewer.size.width = 1024 / 4;
        // lightShadowMapViewer.size.height = 1024 / 4;
        // lightShadowMapViewer.update();
        // this.lightShadowMapViewer = lightShadowMapViewer;
    }

    setModes()
    {
        this.modes = {}

        // Default
        this.modes.default = {}
        this.modes.default.instance = this.instance.clone()

        // Debug
        this.modes.debug = {}
        this.modes.debug.instance = this.instance.clone()
        this.modes.debug.instance.position.copy(this.instance.position)
        this.modes.debug.instance.intensity = this.instance.intensity
        this.modes.debug.instance.color = this.instance.color
    }


    resize()
    {
    }

    debugFolder()
    {
        this.PARAMS = {
            intensity: this.modes.debug.instance.intensity,
            color: this.modes.debug.instance.color,
            x: this.modes.debug.instance.position.x,
            y: this.modes.debug.instance.position.y,
            z: this.modes.debug.instance.position.z,
            shadowCameraNear: this.modes.debug.instance.shadow.camera.near,
            shadowCameraFar: this.modes.debug.instance.shadow.camera.far,
            shadowCameraLeft: this.modes.debug.instance.shadow.camera.left,
            shadowCameraRight: this.modes.debug.instance.shadow.camera.right,
            shadowCameraTop: this.modes.debug.instance.shadow.camera.top,
            shadowCameraBottom: this.modes.debug.instance.shadow.camera.bottom,
            shadowMapSizeWidth: this.modes.debug.instance.shadow.mapSize.width,
            shadowMapSizeHeight: this.modes.debug.instance.shadow.mapSize.height,
            shadowNormalBias: this.modes.debug.instance.shadow.normalBias,
        }
        this.debugFolder = this.debug.addFolder({
            title: 'light',
            expanded: true,
        })

        this.debugFolder.addBinding(
            this.PARAMS,
            'intensity',
            { label: 'intensity', min: 0, max: 2, step: 0.001 }
        )

        this.debugFolder.addBinding(
            this.PARAMS,
            'color',
            { label: 'color' }
        )

        this.debugFolder.addBinding(
            this.PARAMS,
            'x',
            { label: 'x', min: -5, max: 5, step: 0.001 }
        )

        this.debugFolder.addBinding(
            this.PARAMS,
            'y',
            { label: 'y', min: -5, max: 5, step: 0.001 }
        )

        this.debugFolder.addBinding(
            this.PARAMS,
            'z',
            { label: 'z', min: -5, max: 5, step: 0.001 }
        )

        // this.debugFolder.addBinding(
        //     this.PARAMS,
        //     'shadowCameraNear',
        //     { label: 'shadowCameraNear', min: -5, max: 5, step: 0.001 }
        // )

        // this.debugFolder.addBinding(
        //     this.PARAMS,
        //     'shadowCameraFar',
        //     { label: 'shadowCameraFar', min: -5, max: 5, step: 0.001 }
        // )

        // this.debugFolder.addBinding(
        //     this.PARAMS,
        //     'shadowCameraLeft',
        //     { label: 'shadowCameraLeft', min: -5, max: 5, step: 0.001 }
        // )

        // this.debugFolder.addBinding(
        //     this.PARAMS,
        //     'shadowCameraRight',
        //     { label: 'shadowCameraRight', min: -5, max: 5, step: 0.001 }
        // )

        // this.debugFolder.addBinding(
        //     this.PARAMS,
        //     'shadowCameraTop',
        //     { label: 'shadowCameraTop', min: -5, max: 5, step: 0.001 }
        // )

        // this.debugFolder.addBinding(
        //     this.PARAMS,
        //     'shadowCameraBottom',
        //     { label: 'shadowCameraBottom', min: -5, max: 5, step: 0.001 }
        // )

        // this.debugFolder.addBinding(
        //     this.PARAMS,
        //     'shadowMapSizeWidth',
        //     { label: 'shadowMapSizeWidth', min: 0, max: 4096, step: 1 }
        // )

        // this.debugFolder.addBinding(
        //     this.PARAMS,
        //     'shadowMapSizeHeight',
        //     { label: 'shadowMapSizeHeight', min: 0, max: 4096, step: 1 }
        // )

        // this.debugFolder.addBinding(
        //     this.PARAMS,
        //     'shadowNormalBias',
        //     { label: 'shadowNormalBias', min: 0, max: 1, step: 0.001 }
        // )
    }

    update()
    {
        // Update debug
        if(this.debugFolder)
        {
            this.modes.debug.instance.intensity = this.PARAMS.intensity
            this.modes.debug.instance.color = this.PARAMS.color
            this.modes.debug.instance.position.x = this.PARAMS.x
            this.modes.debug.instance.position.y = this.PARAMS.y
            this.modes.debug.instance.position.z = this.PARAMS.z
            // this.modes.debug.instance.shadow.camera.near = this.PARAMS.shadowCameraNear
            // this.modes.debug.instance.shadow.camera.far = this.PARAMS.shadowCameraFar
            // this.modes.debug.instance.shadow.camera.left = this.PARAMS.shadowCameraLeft
            // this.modes.debug.instance.shadow.camera.right = this.PARAMS.shadowCameraRight
            // this.modes.debug.instance.shadow.camera.top = this.PARAMS.shadowCameraTop
            // this.modes.debug.instance.shadow.camera.bottom = this.PARAMS.shadowCameraBottom
            // this.modes.debug.instance.shadow.mapSize.width = this.PARAMS.shadowMapSizeWidth
            // this.modes.debug.instance.shadow.mapSize.height = this.PARAMS.shadowMapSizeHeight
            // this.modes.debug.instance.shadow.normalBias = this.PARAMS.shadowNormalBias
        }


        // if (this.instance.shadow.map) {
        //     this.lightShadowMapViewer.update();
        //     this.lightShadowMapViewer.render( this.renderer.instance );
        // }


        // Update instance
        this.instance.copy(this.modes[this.mode].instance)
        // this.instance.lookAt(1, 0, 0)
    }

    destroy()
    {
    }
}
