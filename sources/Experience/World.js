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
        this.renderer = this.experience.renderer;
        
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

        // // framebuffer pour le Voronoi noise
        // const textureWidth = 1024;
        // const textureHeight = 1024;
        // this.renderTarget = new THREE.WebGLRenderTarget(textureWidth, textureHeight);


        this.material = new City({
            // wireframe: true,
        })

        this.geometry = new THREE.PlaneGeometry(1, 1, 20, 20)

        this.plane = new THREE.Mesh(this.geometry, this.material)

        this.plane.rotation.set(-Math.PI * 0.5, 0, 0)
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

        // this.renderer.instance.setRenderTarget(this.renderTarget);
        // this.renderer.instance.render(this.scene, this.camera.instance);
        // this.renderer.instance.setRenderTarget(null);

        if (this.material) {
            this.material.update(
                this.elapsedTime,
                this.renderer.progress,
                this.renderer.height,
                // this.renderTarget.texture
            );
        }
    }

    destroy()
    {
    }
}