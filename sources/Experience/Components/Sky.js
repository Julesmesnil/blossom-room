import { DoubleSide, ShaderMaterial, Vector4 } from 'three';

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
            side: DoubleSide,
        })
    }



    /** 
     * @param {import('three').Shader} shader
     * @param {import('three').WebGLRenderer} renderer
    */
    onBeforeCompile(_shader, renderer) {
        super.onBeforeCompile(_shader, renderer);


        _shader.uniforms.uTime = { value: 0 };
        _shader.uniforms.uProgress = { value: 1. };
        _shader.uniforms.uHeight = { value: 0. };
        _shader.uniforms.resolution = { value: new Vector4() }; 
        // _shader.uniforms.noisetexture = { value: new THREE.TextureLoader().load(noisetexture) };


        _shader.vertexShader = vertex;
        _shader.fragmentShader = fragment;

        // this.userData.shader = _shader;
    }

    update(time, progress, height) {
        if (this.userData.shader) {
            this.userData.shader.uniforms.uTime.value = time;
            this.userData.shader.uniforms.uProgress.value = progress;
            this.userData.shader.uniforms.uHeight.value = height;
        }
    }

}