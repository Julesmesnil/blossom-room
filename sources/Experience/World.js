import * as THREE from 'three'
import Voronoi from 'voronoi'
import Experience from './Experience.js'

import Sky from './Components/Sky.js'
import Flowers from './Components/Flowers.js'
import Tree from './Components/Tree.js'

export default class World
{
    constructor(_options)
    {
        this.experience = new Experience()
        this.config = this.experience.config
        this.debug = this.experience.debug
        this.scene = this.experience.scene
        this.resources = this.experience.resources
        this.colorSettings = this.experience.colorSettings
        this.renderer = this.experience.renderer

        
        this.pointAmount = 100; // debugeur
        this.voronoi = new Voronoi();
        this.bbox = { xl: 0, xr: 2, yt: 2, yb: 0 };
        this.createPoints();

        // Set up
        this.mode = 'debug'

        this.resources.on('groupEnd', (_group) =>
        {
            if(_group.name === 'base')
            {
                this.createPoints()
                this.createFloors()
                this.createRoom()
                this.createSky()
                // this.createMorph()
                this.debugFolder() // Debug
                this.setup3D()
            }
        })
    }
  

    debugFolder()
    {
        /**
         * @param {Debug} PARAMS
        */
        this.PARAMS = {
            color: this.colorSettings.baseHex,
        }

        // refer to the scene folder
        this.debugFolder = this.debug.addFolder({
            title: 'room',
            expanded: true,
        })

        this.debugFolder
            .addBinding(this.PARAMS, 'color')
            .on('change', (ev) => {
                this.room.traverse((o) => {
                    if (o instanceof THREE.Mesh) {
                        o.material.color.set(ev.value);
                    }
                })
            });
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
        this.roof = this.resources.items.roof.scene

        this.floor.traverse((o) => {
            if (o.material?.name == 'base') {
                o.material = new THREE.MeshStandardMaterial({
                    color: this.colorSettings.color1Hex,
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

        this.roof.traverse((o) => {
            if (o.material?.name == 'base') {
                o.material = new THREE.MeshStandardMaterial({
                    color: this.colorSettings.color1Hex,
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
        this.roof.scale.set(0.05, 0.05, 0.05)


        let cubeOffset = .50 - .05; // debugeur
        this.cubeArray = [];
        for (var i = 0; i < this.vdata.cells.length; i++) {
            let zValue = this.renderer.prng();
            let numCubes = Math.abs(Math.floor(zValue * 10));

        
            for (let j = 0; j < numCubes; j++) {
                let cubeHeight = .1

                if (numCubes > 1 && j === numCubes - 1) {
                    let roof = this.roof.clone();
                    roof.position.set(
                        this.vdata.cells[i].site.x - cubeOffset,
                        -.5 + (cubeHeight * j + .05),
                        -1 + (this.vdata.cells[i].site.z - cubeOffset)
                        );
                    this.scene.add(roof);
                    this.cubeArray.push(roof);
                } else {
                    let cube = this.floor.clone();
        
                    cube.position.set(
                        this.vdata.cells[i].site.x - cubeOffset,
                        -.5 + (cubeHeight * j + .05),
                        -1 + (this.vdata.cells[i].site.z - cubeOffset)
                    );

                    this.scene.add(cube);
                    this.cubeArray.push(cube);
                }
            }
        }
        console.log(this.cubeArray.length);
    }

    createRoom()
    {
        this.room = this.resources.items.scene.scene

        this.room.traverse((o) => {
            if (o.material?.name == 'base') {
                o.material = new THREE.MeshPhysicalMaterial({
                    color: this.colorSettings.baseHex,
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
        this.room.scale.set(.8, 0.5, 0.5)
        this.room.rotation.set(0, Math.PI * 1.5, 0)
        this.room.position.set(
            0,
            0,
            1.5
        )

        this.scene.add(this.room)
    }

    createSky()
    {

        this.skyMaterial = new Sky({
            // wirefrale: true,
        })
        this.geometry = new THREE.PlaneGeometry(2, 1.5, 20, 20)
        this.sky = new THREE.Mesh(this.geometry, this.skyMaterial)

        // this.sky.rotation.set(Math.PI * 1.5, 0, 0)
        this.sky.position.set(0, .25, -2)
        this.scene.add(this.sky)
    }

    // createMorph() {
    //     const boxGeometry = new THREE.BoxGeometry(.5, .5, .2);
    //     const sphereGeometry = new THREE.SphereGeometry(0.2, 32, 32);
    //     const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    //     this.sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    
    //     this.customMaterial = new THREE.ShaderMaterial({
    //         uniforms: {
    //             uTime: { value: 0.0 },
    //             spherePosition: { value: new THREE.Vector3(0, 0, 0) }, // Initial position
    //         },
    //         vertexShader: `
    //             varying vec2 vUv;
    //             void main() {
    //                 vUv = uv;
    //                 gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    //             }
    //         `,
    //         fragmentShader: `
    //             uniform float uTime;
    //             uniform vec3 spherePosition;
    //             varying vec2 vUv;
    
    //             // Box SDF (Signed Distance Function)
    //             float box(vec3 p, vec3 size) {
    //                 vec3 d = abs(p) - size;
    //                 return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0);
    //             }
    
    //             void main() {
    //                 vec3 rayOrigin = cameraPosition;
    //                 vec3 rayDirection = normalize(vec3(vUv.xy - 0.5, 1.0));
    
    //                 float t = 0.0;
    //                 float maxDistance = 10.0;
    //                 vec3 p;
    
    //                 for (int i = 0; i < 100; i++) {
    //                     p = rayOrigin + t * rayDirection;
                        
    //                     // Update the box SDF in real-time
    //                     float boxSDF = box(p - spherePosition, vec3(1.0, 1.0, 1.0));
    
    //                     if (boxSDF < 0.001 || t > maxDistance) {
    //                         gl_FragColor = vec4(.5, .7, 0.0, 1.0);
    //                         return;
    //                     }
    
    //                     t += boxSDF;
    //                 }
    
    //                 gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    //             }
    //         `,
    //     });
    
    //     const customMesh = new THREE.Mesh(boxGeometry, this.customMaterial);
    //     this.scene.add(customMesh);
    //     this.scene.add(this.sphere);
    
    //     // Update the sphere's position in the animation loop
    //     // this.spherePosition = customMaterial.uniforms.spherePosition.value;
    //     // this.sphereSpeed = 0.02; // Adjust as needed
    //     // this.experience.on('update', () => {
    //     //     spherePosition.x = Math.sin(this.time * sphereSpeed) * 2; // Example dynamic position
    //     // });
    // }
    


    setup3D()
    {
        this.planeMaterial = new THREE.MeshStandardMaterial({
            color: this.colorSettings.color2Hex,
        })
        this.geometry = new THREE.PlaneGeometry(3, 2, 20, 20)
        this.plane = new THREE.Mesh(this.geometry, this.planeMaterial)

        this.plane.castShadow = true;
        this.plane.receiveShadow = true;
        this.plane.rotation.set(-Math.PI * 0.5, 0, 0)
        this.plane.position.set(0, -.5, -1)
        this.scene.add(this.plane)

        this.Flowers = new Flowers()
    }

    resize()
    {
    }

    update()
    {
        this.deltaTime = this.time - window.performance.now();
        this.elapsedTime = window.performance.now() * 0.001;
        this.time = window.performance.now();

        if (this.skyMaterial) {
            this.skyMaterial.update(
                this.elapsedTime,
                this.renderer.progress,
                this.renderer.height,
            );
        }

        if(this.customMaterial)
        {
            this.sphereSpeed = 0.5; // Adjust as needed
            this.customMaterial.uniforms.uTime.value = this.elapsedTime;
            this.customMaterial.uniforms.spherePosition.value.x = this.sphere.position.x
            // this.sphere.position.x = Math.sin(this.elapsedTime * this.sphereSpeed); // Example dynamic position
        }
    }

    destroy()
    {
    }
}