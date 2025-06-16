import { AmbientLight, Color, DirectionalLight, DirectionalLightHelper, PointLight, PointLightHelper, SpotLight, SpotLightHelper } from 'three'
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
        this.arcRotation = this.renderer.prng()

        this.setInstance()
        this.setModes()
        this.setTimeAnimation()
    }

    setInstance()
    {
        // Set up
        this.instance = new DirectionalLight(0xf8c08a, 1)
        // this.instance.position.set(2, 2, -3)
        this.instance.position.set(3.9, 1.8, -3)
        this.instance.castShadow = true
        this.instance.shadow.camera.near = -2
        this.instance.shadow.camera.far = 10
        this.instance.shadow.camera.left = -3
        this.instance.shadow.camera.right = 4
        this.instance.shadow.camera.top = 2
        this.instance.shadow.camera.bottom = -3
        this.instance.shadow.mapSize.width = 1024
        this.instance.shadow.mapSize.height = 1024
        this.instance.shadow.normalBias = 0.0001
        this.instance.intensity = 2
        this.scene.add(this.instance)

        this.AmbientLight = new AmbientLight(0xffffff, 0.2)
        this.scene.add(this.AmbientLight)

        // helper
        // this.directionnalLightHelper = new DirectionalLightHelper(this.instance, 0.1)
        // this.scene.add(this.directionnalLightHelper)

        const lightShadowMapViewer = new ShadowMapViewer( this.instance );
        lightShadowMapViewer.position.x = 10;
        lightShadowMapViewer.position.y = 10;
        lightShadowMapViewer.size.width = 1024 / 4;
        lightShadowMapViewer.size.height = 1024 / 4;
        lightShadowMapViewer.enabled = false;
        lightShadowMapViewer.update();
        this.lightShadowMapViewer = lightShadowMapViewer;
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
        this.modes.debug.arcRotation = this.arcRotation

        this.currentColor = this.instance.color.clone();
    }

    setTimeAnimation()
    {
        // Ambient Light intensity
        this.maxIntensity = .5;
        this.minIntensity = 0.2;

        // Directional Light color
        this.nightColor = new Color('#4775A2');

        // Directional Light position
        this.radius = 5;
        this.centerX = 0;
        this.centerZ = 0;
    }

    debugFolder()
    {
        /**
         * @param {Debug} PARAMS
         */
        this.PARAMS = {
            intensity: this.instance.intensity,
            color: this.instance.color,
            x: this.instance.position.x,
            y: this.instance.position.y,
            z: this.instance.position.z,
            ambientIntensity: this.AmbientLight.intensity,
            arcRotation: this.arcRotation,
            ShadowMapViewer: true,
        }

        this.debugFolder = this.debug.addFolder({
            title: 'light',
            // expanded: true,
            expanded: false,
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

        // this.debugFolder.addBinding(
        //     this.PARAMS,
        //     'x',
        //     { label: 'x', min: -5, max: 5, step: 0.001 }
        // )

        // this.debugFolder.addBinding(
        //     this.PARAMS,
        //     'y',
        //     { label: 'y', min: -5, max: 5, step: 0.001 }
        // )

        // this.debugFolder.addBinding(
        //     this.PARAMS,
        //     'z',
        //     { label: 'z', min: -5, max: 5, step: 0.001 }
        // )

        // this.debugFolder.addBinding(
        //     this.PARAMS,
        //     'ambientIntensity',
        //     { label: 'ambientIntensity', min: 0, max: 1, step: 0.001 }
        // )

        this.debugFolder.addBinding(
            this.PARAMS,
            'arcRotation',
            { label: 'arcRotation', min: 0, max: 1, step: 0.001 }
        )

        this.debugFolder.addBinding(
            this.PARAMS,
            'ShadowMapViewer',
            { label: 'ShadowMapViewer' }
        ).on('change', (ev) => {
            this.lightShadowMapViewer.enabled = ev.value
        });
    }

    update()
    {

        // Ambient Light intensity
        const currentIntensity = this.maxIntensity + (this.minIntensity - this.maxIntensity) * Math.abs(0.5 - this.arcRotation) * 2;
        this.AmbientLight.intensity = currentIntensity;

        const radius = 5;
        const centerX = 0;
        const centerZ = 0;
        const x = centerX + radius * Math.cos(Math.PI * this.arcRotation);
        const y = centerZ + radius * Math.sin(Math.PI * this.arcRotation);
        this.instance.position.set(x, y, -3);

        const dayColor = this.currentColor;
        const currentColor = new Color();
        currentColor.lerpColors(dayColor, this.nightColor, Math.abs(0.5 - this.arcRotation) * 2);
        this.instance.color.copy(currentColor);


        // // Update debug
        // if(this.debugFolder)
        // {
        //     this.modes.debug.instance.intensity = this.PARAMS.intensity
        //     this.modes.debug.instance.color = this.PARAMS.color
        //     this.modes.debug.instance.position.x = this.PARAMS.x
        //     this.modes.debug.instance.position.y = this.PARAMS.y
        //     this.modes.debug.instance.position.z = this.PARAMS.z
        //     this.AmbientLight.intensity = this.PARAMS.ambientIntensity
        //     this.modes.debug.arcRotation = this.PARAMS.arcRotation;

        //     // Ambient Light intensity
        //     const currentIntensity = this.maxIntensity + (this.minIntensity - this.maxIntensity) * Math.abs(0.5 - this.modes.debug.arcRotation) * 2;
        //     this.AmbientLight.intensity = currentIntensity;

        //     // Directional Light position
        //     const radius = 5;
        //     const centerX = 0;
        //     const centerZ = 0;
        //     const x = centerX + radius * Math.cos(Math.PI * this.modes.debug.arcRotation);
        //     const y = centerZ + radius * Math.sin(Math.PI * this.modes.debug.arcRotation);
        //     this.modes.debug.instance.position.set(x, y, -3);

        //     // Directional Light color
        //     const dayColor = this.currentColor;
        //     const currentColor = new Color();
        //     currentColor.lerpColors(dayColor, this.nightColor, Math.abs(0.5 - this.modes.debug.arcRotation) * 2);
        //     this.modes.debug.instance.color.copy(currentColor);

        //     if (this.instance.shadow.map) {
        //         this.lightShadowMapViewer.update();
        //         this.lightShadowMapViewer.render( this.renderer.instance );
        //     }

        //     // Use Bloom postprocess or not
        //     // if (this.PARAMS.arcRotation > 0.9 || this.PARAMS.arcRotation < .1) {
        //     //     this.renderer.usePostprocess = true;
        //     // } else {
        //     //     this.renderer.usePostprocess = false;
        //     // }

            
        //     // Update instance
        //     this.instance.copy(this.modes[this.mode].instance)
        //     this.instance.lookAt(1, 0, 0)
        // }
    }

    destroy()
    {
    }
}
