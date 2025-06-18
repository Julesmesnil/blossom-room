import * as THREE from 'three'
import Experience from '../Experience.js'

export default class Grass
{
    constructor(_options)
    {
        // Options
        this.experience = new Experience()
        this.config = this.experience.config
        this.debug = this.experience.debug
        this.scene = this.experience.scene
        this.time = this.experience.time
        this.colorSettings = this.experience.colorSettings

        // Parameters
        this.PLANE_SIZE = 4
        this.BLADE_COUNT = 35000
        this.BLADE_WIDTH = 0.005
        this.BLADE_HEIGHT = 0.015
        this.BLADE_HEIGHT_VARIATION = 0.008

        // Time Uniform
        this.timeUniform = { type: 'f', value: 0.0 }

        this.setGeometry()
        this.setMaterial()
        this.setMesh()
    }

    setGeometry()
    {
        this.positions = []
        this.uvs = []
        this.indices = []
        this.colors = []

        for (let i = 0; i < this.BLADE_COUNT; i++) {
            const VERTEX_COUNT = 5
            const surfaceMin = this.PLANE_SIZE / 2 * -1
            const surfaceMax = this.PLANE_SIZE / 2

            // Distribution circulaire pour suivre la forme du sol
            const radius = this.PLANE_SIZE / 2
            const r = radius * Math.sqrt(Math.random())
            const theta = Math.random() * 2 * Math.PI
            const x = r * Math.cos(theta)
            const z = r * Math.sin(theta)

            const pos = new THREE.Vector3(x, 0, z)
            const uv = [
                this.convertRange(pos.x, surfaceMin, surfaceMax, 0, 1), 
                this.convertRange(pos.z, surfaceMin, surfaceMax, 0, 1)
            ]

            const blade = this.generateBlade(pos, i * VERTEX_COUNT, uv)
            blade.verts.forEach(vert => {
                this.positions.push(...vert.pos)
                this.uvs.push(...vert.uv)
                this.colors.push(...vert.color)
            })
            blade.indices.forEach(indice => this.indices.push(indice))
        }

        this.geometry = new THREE.BufferGeometry()
        this.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(this.positions), 3))
        this.geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(this.uvs), 2))
        this.geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(this.colors), 3))
        this.geometry.setIndex(this.indices)
        this.geometry.computeVertexNormals()
    }

    setMaterial()
    {
        // Approche hybride : MeshLambertMaterial pour l'éclairage automatique + shader pour l'animation
        const baseColor = new THREE.Color(this.colorSettings.color2Hex)
        
        // Créer un matériau standard qui gère automatiquement les ombres
        this.material = new THREE.MeshLambertMaterial({
            color: baseColor,
            vertexColors: true,
            side: THREE.DoubleSide
        })

        // Modifier le matériau pour ajouter l'animation
        this.material.onBeforeCompile = (shader) => {
            // Ajouter les uniforms pour l'animation
            shader.uniforms.uTime = this.timeUniform
            shader.uniforms.uWindStrength = { value: 0.5 }
            shader.uniforms.uBaseColor = { value: baseColor }
            shader.uniforms.uTipColor = { value: new THREE.Color(this.colorSettings.color1Hex) }

            // Ajouter les déclarations uniforms en haut du vertex shader
            shader.vertexShader = shader.vertexShader.replace(
                'void main() {',
                `
                uniform float uTime;
                uniform float uWindStrength;
                
                void main() {`
            )

            // Modifier le vertex shader pour l'animation
            shader.vertexShader = shader.vertexShader.replace(
                '#include <begin_vertex>',
                `
                #include <begin_vertex>
                
                float waveSize = 18.0;
                float tipDistance = 0.012 * uWindStrength;
                float centerDistance = 0.005 * uWindStrength;

                // Animation basée sur la couleur (blanc = pointe, gris = milieu, noir = base)
                if (color.x > 0.6) {
                    transformed.x += sin((uTime * 0.001) + (uv.x * waveSize)) * tipDistance;
                    transformed.z += sin((uTime * 0.0015) + (uv.y * waveSize)) * tipDistance * 0.5;
                } else if (color.x > 0.0) {
                    transformed.x += sin((uTime * 0.001) + (uv.x * waveSize)) * centerDistance;
                }
                `
            )

            // Ajouter les déclarations uniforms en haut du fragment shader
            shader.fragmentShader = shader.fragmentShader.replace(
                'void main() {',
                `
                uniform vec3 uBaseColor;
                uniform vec3 uTipColor;
                
                void main() {`
            )

            // Modifier le fragment shader pour les couleurs
            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <color_fragment>',
                `
                #include <color_fragment>
                
                // Gradient de couleur du bas vers le haut
                float colorMix = vColor.x;
                vec3 grassColor = mix(uBaseColor, uTipColor, colorMix);
                
                // Ajout de variation subtile
                grassColor *= (0.8 + 0.4 * vColor.x);
                
                diffuseColor.rgb = grassColor;
                `
            )

            // Stocker la référence pour les mises à jour
            this.shaderUniforms = shader.uniforms
        }
    }

    setMesh()
    {
        this.mesh = new THREE.Mesh(this.geometry, this.material)
        this.mesh.position.set(0, -0.5, -1.6) // Même position que le sol
        this.scene.add(this.mesh)
        this.mesh.receiveShadow = true
        this.mesh.castShadow = true
    }

    generateBlade(center, vArrOffset, uv)
    {
        const MID_WIDTH = this.BLADE_WIDTH * 0.5
        const TIP_OFFSET = 0.003
        const height = this.BLADE_HEIGHT + (Math.random() * this.BLADE_HEIGHT_VARIATION)

        const yaw = Math.random() * Math.PI * 2
        const yawUnitVec = new THREE.Vector3(Math.sin(yaw), 0, -Math.cos(yaw))
        const tipBend = Math.random() * Math.PI * 2
        const tipBendUnitVec = new THREE.Vector3(Math.sin(tipBend), 0, -Math.cos(tipBend))

        // Positions des vertices
        const bl = new THREE.Vector3().addVectors(center, new THREE.Vector3().copy(yawUnitVec).multiplyScalar((this.BLADE_WIDTH / 2) * 1))
        const br = new THREE.Vector3().addVectors(center, new THREE.Vector3().copy(yawUnitVec).multiplyScalar((this.BLADE_WIDTH / 2) * -1))
        const tl = new THREE.Vector3().addVectors(center, new THREE.Vector3().copy(yawUnitVec).multiplyScalar((MID_WIDTH / 2) * 1))
        const tr = new THREE.Vector3().addVectors(center, new THREE.Vector3().copy(yawUnitVec).multiplyScalar((MID_WIDTH / 2) * -1))
        const tc = new THREE.Vector3().addVectors(center, new THREE.Vector3().copy(tipBendUnitVec).multiplyScalar(TIP_OFFSET))

        tl.y += height / 2
        tr.y += height / 2
        tc.y += height

        // Couleurs pour l'animation (noir = base, gris = milieu, blanc = pointe)
        const black = [0, 0, 0]
        const gray = [0.5, 0.5, 0.5]
        const white = [1.0, 1.0, 1.0]

        const verts = [
            { pos: bl.toArray(), uv: uv, color: black },
            { pos: br.toArray(), uv: uv, color: black },
            { pos: tr.toArray(), uv: uv, color: gray },
            { pos: tl.toArray(), uv: uv, color: gray },
            { pos: tc.toArray(), uv: uv, color: white }
        ]

        const indices = [
            vArrOffset,
            vArrOffset + 1,
            vArrOffset + 2,
            vArrOffset + 2,
            vArrOffset + 4,
            vArrOffset + 3,
            vArrOffset + 3,
            vArrOffset,
            vArrOffset + 2
        ]

        return { verts, indices }
    }

    convertRange(val, oldMin, oldMax, newMin, newMax)
    {
        return (((val - oldMin) * (newMax - newMin)) / (oldMax - oldMin)) + newMin
    }

    update()
    {
        if (this.shaderUniforms && this.time) {
            this.shaderUniforms.uTime.value = this.time.elapsed
        }
    }

    destroy()
    {
        if (this.mesh) {
            this.scene.remove(this.mesh)
            this.geometry.dispose()
            this.material.dispose()
        }
    }
} 