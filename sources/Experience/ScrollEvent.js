import { MathUtils } from 'three'
import Experience from './Experience.js'

export default class ScrollEvent
{
    constructor()
    {
        this.experience = new Experience()
        this.config = this.experience.config
        this.scene = this.experience.scene
        this.resources = this.experience.resources
        this.debug = this.experience.debug

        this.target = -3.5
        this.current = -3.5
        this.speed = 0.05
        this.factor = 0.0005 // Réduit de 0.0005 à 0.0002 pour moins de sensibilité
        this.velocity = 0

        this.scrollEvent()
        
        // debug
        if(this.debug)
        {
            this.debugFolder = this.debug.addFolder('ScrollEvent')
            this.debugFolder.close()

            // change this.modes.debug.instance position and rotation
            this.debugFolder.add(this, 'factor').step(0.001).min(0).max(0.01).name('Scroll Factor')
        }
    }

    scrollEvent()
    {
        window.addEventListener('mousewheel', (e) =>
        {            
            this.target += e.deltaY * this.factor;
            // Limiter la valeur target pour un bon contrôle autour de la position initiale
            this.target = MathUtils.clamp(this.target, -3.5, -1.5);
        })
    }
 

    resize()
    {
    }

    update()
    {
        this.velocity = this.current - this.target;
        this.current = MathUtils.lerp(this.current, this.target, this.speed);
    }

    destroy()
    {
    }
}