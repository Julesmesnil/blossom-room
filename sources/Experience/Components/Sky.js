import { Color, DoubleSide, ShaderMaterial, Vector4 } from 'three';

import vertex from '../shader/vertex.glsl';
import fragment from '../shader/fragment.glsl';

import glsl from 'glslify';

export default class Sky extends ShaderMaterial {

    /** 
     * @param {import('three').MeshBasicMaterial} params
    */
    constructor(_options) {
        super({
            ..._options,
            // side: DoubleSide,
        })

        this.props = {
            uTime: { value: 0 },
            uProgress: { value: 1. },
            uHeight: { value: 0. },
            uStep: { value: 0.4 },
            uColor1: { value: new Color('#E1D3B3') },
            uColor2: { value: new Color('#81BFE6') },
            resolution: { value: new Vector4() },
        };

        this.targetColor1 = new Color('#4140C2');
        this.targetColor2 = new Color('#0D1E8A');
    }



    /** 
     * @param {import('three').Shader} shader
     * @param {import('three').WebGLRenderer} renderer
    */
    onBeforeCompile(_shader, renderer) {
        super.onBeforeCompile(_shader, renderer);


        _shader.uniforms.uTime = { value: this.props.uTime.value };
        _shader.uniforms.uProgress = { value: this.props.uProgress.value };
        _shader.uniforms.uHeight = { value: this.props.uHeight.value };
        _shader.uniforms.uStep = { value: this.props.uStep.value };
        _shader.uniforms.uColor1 = { value: this.props.uColor1.value };
        _shader.uniforms.uColor2 = { value: this.props.uColor2.value };
        _shader.uniforms.resolution = { value: this.props.resolution.value };


        _shader.vertexShader = vertex;
        _shader.fragmentShader = fragment;

        this.userData.shader = _shader;
    }

    lerp(start, end, t) {
        return (1 - t) * start + t * end;
    }
      
    calculateA(B) {
        if (B <= 0 || B >= 1) {
          return 1;
        } else if (B === 0.5) {
          return 0;
        } else if (B < 0.5) {
          return this.lerp(1, 0, B / 0.5);
        } else {
          return this.lerp(0, 1, (B - 0.5) / 0.5);
        }
    }

    update(time, progress, height, step, arcRotation) {
        if (this.userData.shader) {
            this.userData.shader.uniforms.uTime.value = time;
            this.userData.shader.uniforms.uProgress.value = progress;
            this.userData.shader.uniforms.uHeight.value = height;
            this.userData.shader.uniforms.uStep.value = step;
              
            step = this.calculateA(arcRotation);
            let lerpedColor1 = this.props.uColor1.value.clone().lerp(this.targetColor1, step);
            let lerpedColor2 = this.props.uColor2.value.clone().lerp(this.targetColor2, step);

            this.userData.shader.uniforms.uColor1.value = lerpedColor1;
            this.userData.shader.uniforms.uColor2.value = lerpedColor2;
        }
    }

}