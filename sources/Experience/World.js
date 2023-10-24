import * as THREE from 'three'
import Voronoi from 'voronoi'
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
        this.renderer = this.experience.renderer

        
        this.pointAmount = 100; // debugeur
        this.voronoi = new Voronoi();
        this.bbox = { xl: 0, xr: 2, yt: 2, yb: 0 };

        // Set up
        this.mode = 'debug'

        this.resources.on('groupEnd', (_group) =>
        {
            if(_group.name === 'base')
            {
                this.createPoints();
                this.createFloors();
                this.createScene();
                this.setup3D()
            }
        })
    }

    createPoints()
    {

        this.vpoints = [];
        for (let i = 0; i < this.pointAmount; i++) {
            let x = (this.renderer.prng() * 2) - .5; // debugeur
            let z = (this.renderer.prng() * 1.5) - .25; // debugeur
            let add = true;

            for (let j = 0; j < this.vpoints.length; j++) {
                let p = this.vpoints[j];
                let dx = p.x - x;
                let dz = p.z - z;
                if (dx * dx + dz * dz < 0.02) { // debugeur
                    add = false;
                    break;
                }
            }

            if (add) {
                this.vpoints.push({ x: x, z: z });
            }
        }

        this.vdata = this.voronoi.compute(this.vpoints, this.bbox);
    }

    createFloors()
    {
        // this.scene.background = this.resources.items.env;
        this.floor = this.resources.items.floor.scene

        this.floor.traverse((o) => {
            if (o.material?.name == 'base') {
                o.material = new THREE.MeshStandardMaterial({
                    color: 0x68dba7,
                })
                o.material.roughness = 0.9;
                o.material.metalness = 0.3;
            }
            if (o.material?.name == 'glass') {
                o.material = new THREE.MeshStandardMaterial()
                // add an environment map to the material
                o.material.envMap = this.resources.items.env;
                o.material.envMapIntensity = 1;
                o.material.roughness = 0.1;
                o.material.metalness = 0.8;
            }
            o.castShadow = true;
            o.receiveShadow = true;
        })
        this.floor.scale.set(0.05, 0.05, 0.05)

        let cubeOffset = .50 - .05; // debugeur
        this.cubeArray = [];
        for (var i = 0; i < this.vdata.cells.length; i++) {
            let zValue = this.renderer.prng();
            let numCubes = Math.abs(Math.floor(zValue * 10));

        
            for (let j = 0; j < numCubes; j++) {
                let cubeHeight = .1
        
                let cube = this.floor.clone();
        
                cube.position.set(
                    this.vdata.cells[i].site.x - cubeOffset,
                    -.5 + (cubeHeight * j + .05),
                    -1 + (this.vdata.cells[i].site.z - cubeOffset)
                );

                if (numCubes >1 && j === numCubes - 1) {
                    cube.material = new THREE.MeshStandardMaterial({ color: 0x3A59FF }); // Dernier cube en bleu
                }
        
                this.scene.add(cube);
                this.cubeArray.push(cube);
            }
        }
    }

    createScene()
    {
        this.room = this.resources.items.scene.scene

        this.room.traverse((o) => {
            if (o.material?.name == 'base') {
                o.material = new THREE.MeshPhysicalMaterial({
                    color: 0xff8378,
                    metalness: 0.2,
                    roughness: 1,
                    clearcoat: 0.6,
                    clearcoatRoughness: 1,
                    reflectivity: 0.45,
                })
            }
            o.castShadow = true;
            o.receiveShadow = true;
        })
        this.room.scale.set(0.5, 0.5, 0.5)
        this.room.rotation.set(0, Math.PI * 1.5, 0)
        this.room.position.set(
            0,
            0,
            1
        )

        this.scene.add(this.room)
    }


    setup3D()
    {
        this.material = new City({
            // wireframe: true,
        })
        this.geometry = new THREE.PlaneGeometry(3, 2, 20, 20)
        this.plane = new THREE.Mesh(this.geometry, this.material)

        this.plane.castShadow = true;
        this.plane.receiveShadow = true;
        this.plane.rotation.set(-Math.PI * 0.5, 0, 0)
        this.plane.position.set(0, -.5, -1)
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