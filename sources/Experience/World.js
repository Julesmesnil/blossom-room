import * as THREE from 'three'
import Experience from './Experience.js'

import City from './Components/City.js'

export default class World
{
    constructor(_options)
    {
        this.experience = new Experience()
        this.config = this.experience.config
        this.scene = this.experience.scene
        this.resources = this.experience.resources
        
        this.resources.on('groupEnd', (_group) =>
        {
            if(_group.name === 'base')
            {
                this.setup3D()
            }
        })
    }

    setup3D()
    {
        // this.resources.items.lennaTexture.encoding = THREE.sRGBEncoding

        this.material = new City()

        this.geometry = new THREE.PlaneGeometry(1, 1, 1, 1)

        this.plane = new THREE.Mesh(this.geometry, this.material)
        this.scene.add(this.plane)
    }

    resize()
    {
    }

    update()
    {
        this.deltaTime = this.time - window.performance.now();
        this.elapsedTime = window.performance.now() * 0.001;
        this.time = window.performance.now();


        if (this.material) {
            this.material.update(this.elapsedTime, this.experience.renderer.progress);
        }
    }

    destroy()
    {
    }
}