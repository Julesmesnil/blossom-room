import * as THREE from "three";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";
import Experience from "../Experience.js";

import Ambient from "/assets/morning-ambient.mp3";

export default class Sound {
  constructor(_options) {
    this.experience = new Experience();
    this.config = this.experience.config;
    this.scene = this.experience.scene;
    this.debug = this.experience.debug;
    this.seedManager = this.experience.seedManager;
    this.resources = this.experience.resources;
    this.renderer = this.experience.renderer;
    this.world = this.experience.world;
    this.colorSettings = this.experience.colorSettings;

    // Set up
    this.mode = "debug";

    this.ambient = new Audio(Ambient);
    // this.ambient.play()
    this.ambient.loop = true;
    this.ambient.volume = 0.3;

    // this.debugFolder();
  }

  resize() {}

  debugFolder() {
    /**
     * @param {Debug} PARAMS
     */
    this.PARAMS = {
    };

    const btn = this.debug.addButton({
        title: 'Play',
        label: 'Sound',   // optional
      });

      let isPlaying = false;

      btn.on('click', () => {
        if (isPlaying) {
          this.ambient.pause();
          isPlaying = false;
        } else {
          this.ambient.play();
          isPlaying = true;
        }
      });
  }

  update() {
    this.deltaTime = this.time - window.performance.now();
    this.elapsedTime = window.performance.now() * 0.001;
    this.time = window.performance.now();
  }

  destroy() {}
}
