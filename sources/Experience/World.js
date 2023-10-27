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
        this.seedManager = this.experience.seedManager
        this.scene = this.experience.scene
        this.camera = this.experience.camera
        this.resources = this.experience.resources
        this.colorSettings = this.experience.colorSettings
        this.renderer = this.experience.renderer
        this.light = this.experience.light

        
        this.pointAmount = this.seedManager.prng() * 100; // debugeur
        this.voronoi = new Voronoi();
        this.bbox = { xl: 0, xr: 2, yt: 2, yb: 0 };
        this.createPoints();

        // Set up
        this.mode = 'debug'

        this.isSphere = true;
        this.sphereRadius = 0.2; // Radius of the circle
        this.spherePosition = new THREE.Vector2(0.5, 0.5); // Initial position
        this.isBox = false;
        this.boxSize = new THREE.Vector3(0.1, 0.1, 0.1); // Initial position
        this.boxPosition = new THREE.Vector2(0.5, 0.5); // Initial position

        this.resources.on('groupEnd', (_group) =>
        {
            if(_group.name === 'base')
            {
                this.createPoints()
                this.createFloors()
                this.createRoom()
                this.createSky()
                // this.createMorph()
                // this.debugFolder() // Debug
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
            isSphere: this.isSphere,
            sphereRadius: this.sphereRadius,
            spherePosition: this.spherePosition,
            isBox: this.isBox,
            boxSize: this.boxSize,
            boxPosition: this.boxPosition,
        }

        // refer to the scene folder
        this.debugFolder = this.debug.addFolder({
            title: 'room',
            expanded: false,
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

            console.log(this.customDepthMaterial)
            
        // SPHERE
        this.debugFolder.addBinding(this.PARAMS,'isSphere',{ label: 'isSphere' })
            .on('change', (ev) => {
                this.customMaterial.uniforms.uIsSphere.value = ev.value;
                this.customDepthMaterial.uniforms.uIsSphere.value = ev.value;
            });
        this.debugFolder.addBinding(this.PARAMS, 'sphereRadius',{ min: 0, max: 1, step: 0.01 })
            .on('change', (ev) => {
                this.customMaterial.uniforms.uSphereRadius.value = ev.value;
                this.customDepthMaterial.uniforms.uSphereRadius.value = ev.value;
            });
        this.debugFolder.addBinding(this.PARAMS, 'spherePosition',{ min: 0, max: 1, step: 0.01 })
            .on('change', (ev) => {
                this.customMaterial.uniforms.uSpherePosition.value = ev.value;
                this.customDepthMaterial.uniforms.uSpherePosition.value = ev.value;
            });
        this.debugFolder.addBinding(this.PARAMS, 'isBox',{ label: 'isBox' })
            .on('change', (ev) => {
                this.customMaterial.uniforms.uIsBox.value = ev.value;
                this.customDepthMaterial.uniforms.uIsBox.value = ev.value;
            });
        this.debugFolder.addBinding(this.PARAMS, 'boxSize',{ min: 0, max: 1, step: 0.01 })
            .on('change', (ev) => {
                this.customMaterial.uniforms.uBoxSize.value = ev.value;
                this.customDepthMaterial.uniforms.uBoxSize.value = ev.value;
            });
        this.debugFolder.addBinding(this.PARAMS, 'boxPosition',{ min: 0, max: 1, step: 0.01 })
            .on('change', (ev) => {
                this.customMaterial.uniforms.uBoxPosition.value = ev.value;
                this.customDepthMaterial.uniforms.uBoxPosition.value = ev.value;
            });
        

    }

    createPoints()
    {

        this.vpoints = [];
        for (let i = 0; i < this.pointAmount; i++) {
            let z = (this.seedManager.prng() * 3) - 1.75; // debugeur
            let x = (this.seedManager.prng() * 2) - .5; // debugeur
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
            if (o.material?.name == 'base1') {
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
            let zValue = this.seedManager.prng();
            let numCubes = Math.abs(Math.floor(zValue * 10));

            let cubeOffsetY = -.5
            let cubeOffsetZ = -.4

        
            for (let j = 0; j < numCubes; j++) {
                let cubeHeight = .1

                if (numCubes > 1 && j === numCubes - 1) {
                    let roof = this.roof.clone();
                    roof.position.set(
                        this.vdata.cells[i].site.x - cubeOffset,
                        cubeOffsetY + (cubeHeight * j + .05),
                        cubeOffsetZ + (this.vdata.cells[i].site.z - cubeOffset)
                        );
                    this.scene.add(roof);
                    this.cubeArray.push(roof);
                } else {
                    let cube = this.floor.clone();
        
                    cube.position.set(
                        this.vdata.cells[i].site.x - cubeOffset,
                        cubeOffsetY + (cubeHeight * j + .05),
                        cubeOffsetZ + (this.vdata.cells[i].site.z - cubeOffset)
                    );

                    this.scene.add(cube);
                    this.cubeArray.push(cube);
                }
            }
        }
    }

    createRoom()
    {
        this.room = this.resources.items.scene.scene
        // this.room = this.resources.items.scene2.scene

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

        this.room.renderOrder = -1;

        this.scene.add(this.room)
    }

    createSky()
    {

        this.skyMaterial = new Sky({
            // wirefrale: true,
        })
        this.geometry = new THREE.PlaneGeometry(2, 1.5, 20, 20)
        this.sky = new THREE.Mesh(this.geometry, this.skyMaterial)

        this.geometry = new THREE.PlaneGeometry(3, 2, 20, 20)
        this.sky = new THREE.Mesh(this.geometry, this.skyMaterial)

        this.sky.position.set(0, .50, -3.6)
        this.scene.add(this.sky)
    }

    createMorph() {

        this.customDepthMaterial = new THREE.MeshDepthMaterial({
            depthPacking: THREE.RGBADepthPacking,
            map: this.renderer.textureSceneTarget.texture,
            alphaTest: 0.5,
        });
    
        const boxGeometry = new THREE.BoxGeometry(1.5, 1.5, .1);
        this.customMaterial = new THREE.ShaderMaterial({
            transparent: true,
            uniforms: {
                uTime: { value: 0.0 },
                uIsSphere: { value: this.isSphere },
                uSphereRadius: { value: this.sphereRadius }, // Radius of the circle
                uSpherePosition: { value: this.spherePosition }, // Initial position
                uIsBox: { value: this.isBox },
                uBoxSize: { value: this.boxSize }, // Initial position
                uBoxPosition: { value: this.boxPosition }, // Initial position
                uTexture: { value: this.renderer.textureSceneTarget.texture }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float uTime;
                uniform bool uIsSphere;
                uniform float uSphereRadius;
                uniform vec2 uSpherePosition;
                uniform bool uIsBox;
                uniform vec3 uBoxSize;
                uniform vec2 uBoxPosition;
                uniform sampler2D uTexture;

                varying vec2 vUv;
    
                void main() {

                    // vec2    center = uSpherePosition;
                    // float   distToCenter = length(vUv - center);
                    // float  circle = step(uSphereRadius, distToCenter);
                    
                    // // vec3    boxPosition = vec3(uBoxPosition, .5);
                    // // vec3    boxSize = vec3(.2, .2, .2);
                    // // float   box = step(uBoxPosition.x, vUv.x) + step(uBoxPosition.y, vUv.y) + step(.1, 0.);
                    
                    // // discard the black part of the texture
                    // if(circle == 0.0 && uIsSphere) discard;


                    // gl_FragColor = vec4(0.4, 0.8, 0.2, 1.0);
                    gl_FragColor = texture2D(uTexture, vUv);

                }
            `,
        });
        
        const customMesh = new THREE.Mesh(boxGeometry, this.customMaterial);
        customMesh.position.set(0, 0, .75);
        customMesh.castShadow = true;
        customMesh.receiveShadow = true;
        
        customMesh.customDepthMaterial = this.customDepthMaterial;
        // this.customMaterial.uniforms.shadowMap = { value: shadowMap.texture };
        // this.customMaterial.uniforms.uShadowBias = { value: 0.005 };

        // this.renderer.instance.render(customMesh, this.camera.instance, shadowMap);

        this.scene.add(customMesh);
    }
    
    setup3D()
    {
        this.planeMaterial = new THREE.MeshStandardMaterial({
            color: this.colorSettings.color2Hex,
        })
        this.geometry = new THREE.PlaneGeometry(3, 4, 20, 20)
        this.geometry.rotateX(-Math.PI * 0.5)
        this.plane = new THREE.Mesh(this.geometry, this.planeMaterial)

        this.plane.castShadow = true;
        this.plane.receiveShadow = true;
        // this.plane.rotation.set(-Math.PI * 0.5, 0, 0)
        this.plane.position.set(0, -.5, -1.6)
        this.scene.add(this.plane)

        this.Flowers = new Flowers()
        this.Tree = new Tree()
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
                this.renderer.step,
                this.light.modes.debug.arcRotation
            );
        }

        if(this.customMaterial)
        {
            this.customMaterial.uniforms.uTexture.value = this.renderer.textureSceneTarget.texture;
        }

    }

    destroy()
    {
    }
}