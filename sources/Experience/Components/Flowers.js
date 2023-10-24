import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import Experience from '../Experience.js'
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js'

export default class Flowers
{
    constructor(_options)
    {
        this.experience = new Experience()
        this.config = this.experience.config
        this.scene = this.experience.scene
        this.resources = this.experience.resources
        this.renderer = this.experience.renderer;
        this.world = this.experience.world;
        console.log(this.world)

        this.count = 10000;
        this.ages = new Float32Array(this.count);
        this.scales = new Float32Array(this.count);
        this.dummy = new THREE.Object3D();

        this._position = new THREE.Vector3();
        this._normal = new THREE.Vector3();
        this._scale = new THREE.Vector3();

        this.easeOutCubic = function ( t ) {
            return ( -- t ) * t * t + 1;
        };

        this.scaleCurve = function ( t ) {
            return Math.abs( this.easeOutCubic( ( t > 0.5 ? 1 - t : t ) * 2 ) );
        };

        this.loader = new GLTFLoader();
        this.loader.load('/assets/Flower.glb', (gltf) =>{

            this.flower = gltf.scene;
            this.flower.traverse((o) => {
                if (o.isMesh) {
                    o.castShadow = o.receiveShadow = true;
                }
            });
            this._stemMesh = this.flower.getObjectByName('Stem');
            this._blossomMesh = this.flower.getObjectByName('Blossom');
            this.stemGeometry = this._stemMesh.geometry.clone();
            this.blossomGeometry = this._blossomMesh.geometry.clone();

            this.defaultTransform = new THREE.Matrix4()
                .makeRotationX( Math.PI )
                .multiply( new THREE.Matrix4().makeScale( .05, .05, .05 ) );

            this.stemGeometry.applyMatrix4( this.defaultTransform );
            this.blossomGeometry.applyMatrix4( this.defaultTransform );

            this.stemMaterial = this._stemMesh.material;
            this.blossomMaterial = this._blossomMesh.material;

            this.stemMesh = new THREE.InstancedMesh( this.stemGeometry, this.stemMaterial, this.count );
            this.blossomMesh = new THREE.InstancedMesh( this.blossomGeometry, this.blossomMaterial, this.count );

            // Assign random colors to the blossoms.
            this.color = new THREE.Color();
            this.blossomPalette = [ 0xF20587, 0xF2D479, 0xF2C879, 0xF2B077, 0xF24405, 0xCCFF00, 0xFFFF00, 0xFFCCCC, 0xCC66FF, 0xCC0000, 0xFF00FF, 0xFF0033, 0x6600FF, 0x6699FF, 0x00FF33 ];

            for ( let i = 0; i < this.count; i ++ ) {

                this.color.setHex( this.blossomPalette[ Math.floor( this.renderer.prng() * this.blossomPalette.length ) ] );
                this.blossomMesh.setColorAt( i, this.color );

            }

            // Instance matrices will be updated every frame.
            this.stemMesh.instanceMatrix.setUsage( THREE.DynamicDrawUsage );
            this.blossomMesh.instanceMatrix.setUsage( THREE.DynamicDrawUsage );

            this.resample();

            this.scene.add(this.stemMesh);
            this.scene.add(this.blossomMesh);

            this.update()

        });

    }

    resize()
    {
    }

    resample() {

        let offset = 0;
        const count = Math.floor(this.count / this.world.cubeArray.length);

        this.world.cubeArray.forEach((cube) => {
            // Création d'un échantilloneur de surface pour chaque cube
            const sampler = new MeshSurfaceSampler(cube).setWeightAttribute('uv').build();
            cube.userData.sampler = sampler;

            for ( let i = 0; i < count; i ++ ) { // debug
                const index = i + offset
                this.ages[ index ] = this.renderer.prng();
                this.scales[ index ] = this.scaleCurve( this.ages[ index ] );

                this.resampleParticle( index, cube );
            }

            offset += count;
        });

        this.stemMesh.instanceMatrix.needsUpdate = true;
        this.blossomMesh.instanceMatrix.needsUpdate = true;
    }

    resampleParticle( i, cube ) {

        // On utilise l'échantillonneur (sampler) pour extraire une position (_position) et une normale (_normal) d'un point de la surface du cube.
        cube.userData.sampler.sample( this._position, this._normal );
        this._normal.add( cube.position );

        // Copie de notre fleur
        this.dummy.position.copy( this._position ).add(cube.position);
        this.dummy.scale.set( this.scales[ i ], this.scales[ i ], this.scales[ i ] );
        this.dummy.lookAt( this._normal );
        this.dummy.updateMatrix();

        // On met à jour la matrice d'instance du maillage stemMesh et blossomMesh à l'indice i avec la matrice du dummy.
        this.stemMesh.setMatrixAt( i, this.dummy.matrix );
        this.blossomMesh.setMatrixAt( i, this.dummy.matrix );
    }

    updateParticle( index, cube ) {

        // Update lifecycle.
        this.ages[ index ] += 0.005;
            if (this.ages[ index ] >= 1) {
                this.ages[ index ] = 0.001;
                this.scales[ index ] = this.scaleCurve( this.ages[ index ] );
                this.resampleParticle( index, cube );

                return;
            }

        // Update scale.
        this.prevScale = this.scales[ index ];
        this.scales[ index ] = this.scaleCurve( this.ages[ index ] );
        this._scale.set( this.scales[ index ] / this.prevScale, this.scales[ index ] / this.prevScale, this.scales[ index ] / this.prevScale );

        // Update transform.
        this.stemMesh.getMatrixAt( index, this.dummy.matrix );
        this.dummy.matrix.scale( this._scale );
        this.stemMesh.setMatrixAt( index, this.dummy.matrix );
        this.blossomMesh.setMatrixAt( index, this.dummy.matrix );

    }

    animate() {
        if ( this.stemMesh && this.blossomMesh ) {

            let offset = 0;
            const count = Math.floor(this.count / this.world.cubeArray.length);

            this.world.cubeArray.forEach((cube) => {
                for (let i = 0; i < count; i++) {
                    const index = i + offset
                    this.updateParticle(index, cube);

                }
                offset += count;
            });

            this.stemMesh.instanceMatrix.needsUpdate = true;
            this.blossomMesh.instanceMatrix.needsUpdate = true;

            this.stemMesh.geometry.computeBoundingSphere();
            this.blossomMesh.geometry.computeBoundingSphere();

        }
    }

    update()
    {
        this.deltaTime = this.time - window.performance.now();
        this.elapsedTime = window.performance.now() * 0.001;
        this.time = window.performance.now();

        requestAnimationFrame(() =>
        {
            this.update()
        })

        this.animate();

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