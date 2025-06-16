import * as THREE from 'three'
import Experience from './Experience.js'

export default class Camera
{
    constructor(_options)
    {
        // Options
        this.experience = new Experience()
        this.config = this.experience.config
        this.debug = this.experience.debug
        this.time = this.experience.time
        this.sizes = this.experience.sizes
        this.targetElement = this.experience.targetElement
        this.scene = this.experience.scene

        // Set up
        this.mode = 'debug' // defaultCamera \ debugCamera

        // Variables pour les contrôles personnalisés
        this.mouse = { x: 0, y: 0 }
        this.isMouseTracking = false
        
        this.setInstance()
        this.setModes()
        this.setCustomControls()
    }

    setInstance()
    {
        // Set up
        this.instance = new THREE.PerspectiveCamera(25, this.config.width / this.config.height, 0.1, 150)
        this.instance.rotation.reorder('YXZ')

        this.scene.add(this.instance)
    }

    setModes()
    {
        this.modes = {}

        // Default
        this.modes.default = {}
        this.modes.default.instance = this.instance.clone()
        this.modes.default.instance.rotation.reorder('YXZ')

        // Debug
        this.modes.debug = {}
        this.modes.debug.instance = this.instance.clone()
        this.modes.debug.instance.rotation.reorder('YXZ')
        this.modes.debug.instance.position.set(0, 0, 3.5)
    }

    setCustomControls()
    {
        // Position initiale de la caméra
        this.basePosition = new THREE.Vector3(0, 0, 3.5)
        
        // Angles par défaut pour une vue frontale normale
        const defaultPolar = Math.PI / 2 // 90 degrés = vue horizontale
        const defaultAzimuth = 0 // 0 degré = face à la scène
        
        this.currentRotation = { x: defaultPolar, y: defaultAzimuth }
        this.targetRotation = { x: defaultPolar, y: defaultAzimuth }
        
        // Variables pour le smoothing
        this.smoothFactor = 0.08 // Plus petit = plus fluide mais plus lent
        this.targetPosition = new THREE.Vector3(0, 0, 3.5)
        this.currentPosition = new THREE.Vector3(0, 0, 3.5)
        
        // État du tracking - s'assurer qu'il est initialisé correctement
        this.isMouseTracking = false
        this.isReloading = false
        
        // Sensibilité et limites
        this.sensitivity = 0.002
        this.maxPolarAngle = Math.PI / 1.9
        this.minPolarAngle = Math.PI / 2.1
        this.maxAzimuthAngle = Math.PI / 35
        this.minAzimuthAngle = -Math.PI / 35
        
        // Calculer la position initiale correcte
        this.updateCameraPosition()
        
        // Bind functions pour pouvoir les supprimer dans destroy()
        this.onMouseMoveBound = this.onMouseMove.bind(this)
        this.onMouseClickBound = this.onMouseClick.bind(this)
        this.onMouseEnterBound = this.onMouseEnter.bind(this)
        this.onMouseLeaveBound = this.onMouseLeave.bind(this)
        
        // Event listeners pour les mouvements de souris (sans clic)
        this.targetElement.addEventListener('mousemove', this.onMouseMoveBound)
        
        // Event listener pour le clic (recharger avec nouvelle seed)
        this.targetElement.addEventListener('click', this.onMouseClickBound)
        
        // Event listeners pour détecter si on entre/sort de l'élément
        this.targetElement.addEventListener('mouseenter', this.onMouseEnterBound)
        
        this.targetElement.addEventListener('mouseleave', this.onMouseLeaveBound)
        
        // Forcer l'activation du tracking si la souris est déjà sur l'élément
        setTimeout(() => {
            const rect = this.targetElement.getBoundingClientRect()
            // Vérifier si la souris est déjà sur l'élément au démarrage
            this.isMouseTracking = true
        }, 100)
    }

    onMouseEnter()
    {
        if (!this.isReloading) {
            this.isMouseTracking = true
        }
    }

    onMouseLeave()
    {
        this.isMouseTracking = false
    }

    onMouseMove(event)
    {
        if (!this.isMouseTracking || this.isReloading) return
        
        // Convertir les coordonnées de la souris en valeurs normalisées (-1 à 1)
        const rect = this.targetElement.getBoundingClientRect()
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
        
        // Calculer la rotation cible basée sur la position de la souris
        const azimuth = this.mouse.x * this.maxAzimuthAngle
        const polar = THREE.MathUtils.lerp(this.minPolarAngle, this.maxPolarAngle, (this.mouse.y + 1) / 2)
        
        // Mettre à jour la rotation cible (pas directement la rotation actuelle)
        this.targetRotation.x = polar
        this.targetRotation.y = azimuth
        
        // Le smooth sera appliqué dans updateCameraPosition()
    }

    onMouseClick(event)
    {
        // Empêcher les clics multiples
        if (this.isReloading) return
        
        this.isReloading = true
        this.isMouseTracking = false
        
        // Générer une nouvelle seed et recharger la page
        const newSeed = this.experience.seedManager.getRandomSeed()
        this.experience.seedManager.setUrlSeed(newSeed)
        
        // Petit délai pour éviter les conflits
        setTimeout(() => {
            window.location.reload()
        }, 50)
    }

    updateCameraPosition()
    {
        // Smooth interpolation vers la rotation cible
        this.currentRotation.x = THREE.MathUtils.lerp(this.currentRotation.x, this.targetRotation.x, this.smoothFactor)
        this.currentRotation.y = THREE.MathUtils.lerp(this.currentRotation.y, this.targetRotation.y, this.smoothFactor)
        
        // Convertir les angles en position 3D autour du point central
        const radius = 3.5
        const x = radius * Math.sin(this.currentRotation.x) * Math.sin(this.currentRotation.y)
        const y = radius * Math.cos(this.currentRotation.x)
        const z = radius * Math.sin(this.currentRotation.x) * Math.cos(this.currentRotation.y)
        
        // Mise à jour de la position cible
        this.targetPosition.set(x, y, z)
        
        // Smooth interpolation vers la position cible
        this.currentPosition.lerp(this.targetPosition, this.smoothFactor)
        
        // Appliquer la position smoothée à la caméra
        this.modes.debug.instance.position.copy(this.currentPosition)
        this.modes.debug.instance.lookAt(0, 0, 0)
    }

    resize()
    {
        this.instance.aspect = this.config.width / this.config.height
        this.instance.updateProjectionMatrix()

        this.modes.default.instance.aspect = this.config.width / this.config.height
        this.modes.default.instance.updateProjectionMatrix()

        this.modes.debug.instance.aspect = this.config.width / this.config.height
        this.modes.debug.instance.updateProjectionMatrix()
    }

    update()
    {
        // Mise à jour continue du smoothing
        this.updateCameraPosition()
        
        // Apply coordinates
        this.instance.position.copy(this.modes[this.mode].instance.position)
        this.instance.quaternion.copy(this.modes[this.mode].instance.quaternion)
        this.instance.updateMatrixWorld() // To be used in projection
    }

    destroy()
    {
        // Supprimer les event listeners
        this.targetElement.removeEventListener('mousemove', this.onMouseMoveBound)
        this.targetElement.removeEventListener('click', this.onMouseClickBound)
        this.targetElement.removeEventListener('mouseenter', this.onMouseEnterBound)
        this.targetElement.removeEventListener('mouseleave', this.onMouseLeaveBound)
    }
}
