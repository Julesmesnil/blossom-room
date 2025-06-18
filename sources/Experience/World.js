import * as THREE from 'three'
import Voronoi from 'voronoi'
import Experience from './Experience.js'

import Sky from './Components/Sky.js'
import Flowers from './Components/Flowers.js'
import Tree from './Components/Tree.js'
import Grass from './Components/Grass.js'

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
                // this.createGrass()
                this.createRoom()
                this.createSky()
                // this.createMorph()
                // this.debugFolder() // Debug
                // this.makeBlurScene()
                this.setup3D()
            }
        })
    }

    makeBlurScene()
    {
        this.blurGeometry = new THREE.PlaneGeometry(1, 1);
        this.blurMaterial = new THREE.ShaderMaterial({
            uniforms: {
                tDiffuse: { value: null }, // This will be the input texture
                resolution: { value: new THREE.Vector2() }, // Set this in your render loop
                blurAmount: { value: 1.5 } // Adjust this value for the blur intensity
            },
            vertexShader: `
                varying vec2 vUv;

                void main() {
                vUv = uv;
                gl_Position = vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform vec2 resolution;
                uniform float blurAmount;

                varying vec2 vUv;
                
                void main() {

                    vec3 col = texture2D(tDiffuse, vUv).rgb;

                    gl_FragColor = vec4(col, 1.0);
                }          
            `,
        })

        this.blurMesh = new THREE.Mesh(this.blurGeometry, this.blurMaterial);

        this.scene.add(this.blurMesh);
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

    createGrass()
    {
        this.grass = new Grass()
    }

    createSky()
    {
        this.skyMaterial = new Sky({
            wireframe: false, // Désactiver le wireframe pour voir le shader
            side: THREE.DoubleSide, // Rendre les deux côtés visibles pour débugger
        })
        
        // SKYBOX SPHÉRIQUE : Créer une grande sphère qui entoure toute la scène
        this.geometry = new THREE.SphereGeometry(3.9, 32, 16) // Rayon 4 pour la bonne taille
        
        // Méthode alternative : inverser les normales manuellement
        const positions = this.geometry.attributes.position.array
        const normals = this.geometry.attributes.normal.array
        
        // Inverser toutes les normales
        for (let i = 0; i < normals.length; i += 3) {
            normals[i] *= -1     // x
            normals[i + 1] *= -1 // y  
            normals[i + 2] *= -1 // z
        }
        
        // Inverser l'ordre des faces pour le culling
        this.geometry.scale(-1, 1, 1)
        
        this.sky = new THREE.Mesh(this.geometry, this.skyMaterial)
        
        // Centrer la sphère sur la scène
        this.sky.position.set(0, 0, 0)
        
        // Rendre la sphère non-affectée par les transformations de caméra (toujours au fond)
        this.sky.renderOrder = -1000
        
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
        this.geometry = new THREE.PlaneGeometry(4.2, 4, 1, 1)
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
                this.light.arcRotation
            );
        }

        if(this.customMaterial)
        {
            this.customMaterial.uniforms.uTexture.value = this.renderer.textureSceneTarget.texture;
        }

        if(this.blurMaterial)
        {
            
        }

        // ANIMATION VENT : Mettre à jour l'animation des sapins
        if(this.Tree)
        {
            this.Tree.update()
        }

        // ANIMATION HERBE : Mettre à jour l'animation de l'herbe
        // if(this.grass)
        // {
        //     this.grass.update()
        // }

    }

    destroy()
    {
    }
}