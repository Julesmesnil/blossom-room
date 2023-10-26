import {} from 'three'
import Alea from 'alea'
import Experience from '../Experience.js'

export default class ColorSettings
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

        // Set up
        this.mode = 'debug' // defaultLight, debugLight
        this.colorMode = ['Analog', 'Monochromatic', 'Complementary', 'Triadic', 'Random']
        
        this.seed = Math.random().toFixed(9);
        // this.seed = 0.3861250778342058;
        // this.seed = 0.945517351;
        // this.seed = 0.974445839;
        // this.seed = 0.787155139;
        this.prng = new Alea(this.seed);
        console.log('seed', this.seed);


        // Variables
        this.saturation = 60;
        this.lightness = 50;
        this.col1Range = -15;
        this.col1RangePlus = 2 * this.col1Range;

        // HSL
        this.baseHSL = {h: this.prng() * 360, s: this.saturation, l: this.lightness}
        const color1HSL = {
            h: this.baseHSL.h + (this.col1Range + this.prng() * this.col1RangePlus),
            s: this.baseHSL.s,
            l: this.lightness
        }
        const color2HSL = {
            h: this.baseHSL.h + (-120 + this.prng() * 240),
            s: this.baseHSL.s - this.col1Range,
            l: this.baseHSL.l - this.col1Range
        }

        // RGB
        this.baseRgb = this.hsl2RGB(this.baseHSL.h / 360, this.baseHSL.s / 100, this.baseHSL.l / 100);
        this.color1Rgb = this.hsl2RGB(color1HSL.h / 360, color1HSL.s / 100, color1HSL.l / 100);
        this.color2Rgb = this.hsl2RGB(color2HSL.h / 360, color2HSL.s / 100, color2HSL.l / 100);

        // HEX
        this.baseHex = this.rgb2HEX(this.baseRgb[0], this.baseRgb[1], this.baseRgb[2]);
        this.color1Hex = this.rgb2HEX(this.color1Rgb[0], this.color1Rgb[1], this.color1Rgb[2]);
        this.color2Hex = this.rgb2HEX(this.color2Rgb[0], this.color2Rgb[1], this.color2Rgb[2]);
    }

    hsl2RGB(h, s, l){
        let r, g, b;
    
        if (s == 0) {
            r = g = b = l; // achromatic
        } else {
            function hue2rgb(p, q, t){
                if(t < 0) t += 1;
                if(t > 1) t -= 1;
                if(t < 1/6) return p + (q - p) * 6 * t;
                if(t < 1/2) return q;
                if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            }
    
            let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            let p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        
        let c = [~~(r * 255), ~~(g * 255), ~~(b * 255)];

        return c;

    }

    rgb2HEX(r, g, b)
    {
        let rHex = r.toString(16);
        let gHex = g.toString(16);
        let bHex = b.toString(16);
      
        if (rHex.length < 2) {
          rHex = "0" + rHex;
        }
        if (gHex.length < 2) {
          gHex = "0" + gHex;
        }
        if (bHex.length < 2) {
          bHex = "0" + bHex;
        }

        return '#' + rHex + gHex + bHex;
    }

    setModes()
    {
        // Modes
        this.modes = {}

        // Default
        this.modes.default = {}

        // Debug
        this.modes.debug = {}
    }


    debugFolder()
    {
        /**
         * @param {Debug} PARAMS
         */
        this.PARAMS = {
            saturation: this.saturation,
            lightness: this.lightness,
            col1Range: this.col1Range,
        }

        // this.debugFolder = this.debug.addFolder({
        //     title: 'light',
        //     expanded: true,
        // })

        // this.debugFolder.addBinding(
        //     this.PARAMS,'saturation',
        //     { label: 'saturation', min: 0, max: 100 }
        // )

        // this.debugFolder.addBinding(
        //     this.PARAMS,'lightness',
        //     { label: 'lightness', min: 0, max: 100 }
        // )

    }

    update()
    {
        // Update debug
        if(this.debugFolder)
        {
            // this.debugFolder.update()

            // this.saturation = this.PARAMS.saturation;
            // this.lightness = this.PARAMS.lightness;
            // this.col1Range = this.PARAMS.col1Range;
        }
    }

    destroy()
    {
    }
}
