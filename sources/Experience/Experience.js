import * as THREE from 'three'
import { Pane } from 'tweakpane';
import * as EssentialsPlugin from '@tweakpane/plugin-essentials';

import Time from './Utils/Time.js'
import Sizes from './Utils/Sizes.js'
import Stats from './Utils/Stats.js'

import SeedManager from './Components/SeedManager.js';
import ColorSettings from './Components/ColorSettings.js';
import Resources from './Resources.js'
import Renderer from './Renderer.js'
import Camera from './Camera.js'
import Light from './Light.js'
import World from './World.js'

import assets from './assets.js'

export default class Experience
{
    static instance

    constructor(_options = {})
    {
        if(Experience.instance)
        {
            return Experience.instance
        }
        Experience.instance = this

        // Options
        this.targetElement = _options.targetElement

        if(!this.targetElement)
        {
            console.warn('Missing \'targetElement\' property')
            return
        }

        this.time = new Time()
        this.sizes = new Sizes()
        this.setConfig()
        this.setDebug()
        this.seedManager()
        this.setStats()
        this.setScene()
        this.setCamera()
        this.setColorSettings()
        this.setRenderer()
        this.setLight()
        this.setResources()
        this.setWorld()
        
        this.sizes.on('resize', () =>
        {
            this.resize()
        })

        this.update()
    }

    setConfig()
    {
        this.config = {}
    
        // Debug
        this.config.debug = window.location.hash === '#debug'

        // Pixel ratio
        this.config.pixelRatio = Math.min(Math.max(window.devicePixelRatio, 1), 2)

        // Width and height
        const boundings = this.targetElement.getBoundingClientRect()
        this.config.width = boundings.width
        this.config.height = boundings.height || window.innerHeight
    }

    setDebug()
    {
        if(this.config.debug)
        {
            this.debug = new Pane({
                width: 800
            });

            this.debug.registerPlugin(EssentialsPlugin);
        }
    }

    seedManager()
    {
        this.seedManager = new SeedManager()
    }

    setStats()
    {
        if(this.config.debug)
        {
            this.stats = new Stats(true)
        }
    }
    
    setScene()
    {
        this.scene = new THREE.Scene()
    }

    setCamera()
    {
        this.camera = new Camera()
    }

    setColorSettings()
    {
        this.colorSettings = new ColorSettings()
        if(this.config.debug)
        {
            this.colorSettings.debugFolder()
        }
    }

    setLight()
    {
        this.light = new Light()
        if(this.config.debug)
        {
            this.light.debugFolder()
        }
    }

    setRenderer()
    {
        this.renderer = new Renderer({ rendererInstance: this.rendererInstance })

        this.targetElement.appendChild(this.renderer.instance.domElement)
    }

    setResources()
    {
        this.resources = new Resources(assets)
    }

    setWorld()
    {
        this.world = new World()
    }

    update()
    {
        if(this.stats)
            this.stats.update()
        
        this.camera.update()

        if(this.colorSettings)
            this.colorSettings.update()

        if(this.world)
            this.world.update()
        
        if(this.renderer)
            this.renderer.update()

        if(this.light)
            this.light.update()

        window.requestAnimationFrame(() =>
        {
            this.update()
        })
    }

    resize()
    {
        // Config
        const boundings = this.targetElement.getBoundingClientRect()
        this.config.width = boundings.width
        this.config.height = boundings.height

        this.config.pixelRatio = Math.min(Math.max(window.devicePixelRatio, 1), 2)

        if(this.camera)
            this.camera.resize()

        if(this.renderer)
            this.renderer.resize()

        if(this.world)
            this.world.resize()
    }

    destroy()
    {
        
    }
}
