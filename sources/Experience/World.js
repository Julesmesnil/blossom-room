import * as THREE from 'three'
import Voronoi from 'voronoi'
import Experience from './Experience.js'

import City from './Components/City.js'
import Flowers from './Components/Flowers.js'

export default class World
{
    constructor(_options)
    {
        this.experience = new Experience()
        this.config = this.experience.config
        this.scene = this.experience.scene
        this.resources = this.experience.resources
        this.renderer = this.experience.renderer;

        this.pointAmount = 500;
        this.voronoi = new Voronoi();
        this.bbox = { xl: 0, xr: 2, yt: 2, yb: 0 };
        this.createPoints();
        this.addLights();

        this.resources.on('groupEnd', (_group) =>
        {
            if(_group.name === 'base')
            {
                this.setup3D()
            }
        })
    }

    addLights(){

        const light1 = new THREE.AmbientLight( 0xffffff, 0.3 );
        this.scene.add( light1 );

        this.light2 = new THREE.DirectionalLight( 0xffffff, 0.8 * Math.PI );
        this.light2.castShadow = true;
        this.light2.shadow.camera.near = .1;
        this.light2.shadow.camera.far = 20;
        this.light2.shadow.bias = - 0.01;
        this.light2.shadow.camera.right = 10;
        this.light2.shadow.camera.left = - 10;
        this.light2.shadow.camera.top	= 10;
        this.light2.shadow.camera.bottom = - 10;

        this.light2.shadow.mapSize.width = 2048;
        this.light2.shadow.mapSize.height = 2048;
        this.light2.position.set(2.7, 3, 0); // ~60°

        this.scene.add( this.light2 );

    }

    createPoints()
    {

        this.vpoints = [];
        for (let i = 0; i < this.pointAmount; i++) {
            // create a random point in the space from 0,0 to 2,1
            // check around the point if a point is already there and if so, don't add it
            let x = this.renderer.prng();
            let z = this.renderer.prng();
            let add = true;

            for (let j = 0; j < this.vpoints.length; j++) {
                let p = this.vpoints[j];
                let dx = p.x - x;
                let dz = p.z - z;
                if (dx * dx + dz * dz < 0.02) {
                    add = false;
                }
            }

            if (add) {
                this.vpoints.push({ x: x, z: z });
            }
        }

        this.vdata = this.voronoi.compute(this.vpoints, this.bbox);
        console.log(this.vdata);

    }


    setup3D()
    {

        this.material = new City({
            // wireframe: true,
        })

        this.geometry = new THREE.PlaneGeometry(2, 2, 20, 20)

        this.plane = new THREE.Mesh(this.geometry, this.material)

        this.plane.rotation.set(-Math.PI * 0.5, 0, 0)
        this.plane.position.set(0, 0, 0)
        this.scene.add(this.plane)


        let cubeOffset = .45;
        this.cubeArray = [];
        for (var i = 0; i < this.vdata.cells.length; i++) {
            this.cube = new THREE.Mesh(
                new THREE.BoxGeometry(
                    .1,
                    this.renderer.prng(), // y,
                    .1
                ),
                this.material
            )

            this.cube.position.set(
                this.vdata.cells[i].site.x - cubeOffset,
                0,
                this.vdata.cells[i].site.z - cubeOffset
            )
            this.scene.add(this.cube)
            this.cubeArray.push(this.cube);
        }

        this.flowers = new Flowers({})
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
            this.material.update(
                this.elapsedTime,
                this.renderer.progress,
                this.renderer.height,
            );
        }
    }

    destroy()
    {
    }
}