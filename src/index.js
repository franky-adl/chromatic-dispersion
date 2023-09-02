// ThreeJS and Third-party deps
import * as THREE from "three"
import * as dat from 'dat.gui'
import Stats from "three/examples/jsm/libs/stats.module"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"

// Core boilerplate code deps
import { createCamera, createRenderer, runApp, updateLoadingProgressBar, getDefaultUniforms } from "./core-utils"

import vertexShader from "./shaders/vertex.glsl"
import fragmentShader from "./shaders/fragment.glsl"

global.THREE = THREE
// previously this feature is .legacyMode = false, see https://www.donmccurdy.com/2020/06/17/color-management-in-threejs/
// turning this on has the benefit of doing certain automatic conversions (for hexadecimal and CSS colors from sRGB to linear-sRGB)
THREE.ColorManagement.enabled = true

/**************************************************
 * 0. Tweakable parameters for the scene
 *************************************************/
const params = {
  // general scene params
  iorR: 1.15,
  iorG: 1.18,
  iorB: 1.22
}
const uniforms = {
  ...getDefaultUniforms(),
  uTexture: {
    value: null,
  },
  uIorR: {
    value: 1.0,
  },
  uIorG: {
    value: 1.0,
  },
  uIorB: {
    value: 1.0,
  },
  uRefractPower: {
    value: 0.2,
  },
  uShininess: { value: 40.0 },
  uDiffuseness: { value: 0.2 },
  uLight: {
    value: new THREE.Vector3(-1.0, 1.0, 1.0),
  },
}


/**************************************************
 * 1. Initialize core threejs components
 *************************************************/
// Create the scene
let scene = new THREE.Scene()

// Create the renderer via 'createRenderer',
// 1st param receives additional WebGLRenderer properties
// 2nd param receives a custom callback to further configure the renderer
let renderer = createRenderer({ antialias: true }, (_renderer) => {
  // best practice: ensure output colorspace is in sRGB, see Color Management documentation:
  // https://threejs.org/docs/#manual/en/introduction/Color-management
  _renderer.outputColorSpace = THREE.SRGBColorSpace
  // set to false because we want to have multiple renders stacked for each frame
  // if it's true, each render would wipe the previous render in the same frame
  _renderer.autoClear = false
})

// Create the camera
// Pass in fov, near, far and camera position respectively
let camera = createCamera(50, 1, 1000, { x: 0, y: 0, z: 6 })


/**************************************************
 * 2. Build your scene in this threejs app
 * This app object needs to consist of at least the async initScene() function (it is async so the animate function can wait for initScene() to finish before being called)
 * initScene() is called after a basic threejs environment has been set up, you can add objects/lighting to you scene in initScene()
 * if your app needs to animate things(i.e. not static), include a updateScene(interval, elapsed) function in the app as well
 *************************************************/
let app = {
  async initScene() {
    // OrbitControls
    this.controls = new OrbitControls(camera, renderer.domElement)
    this.controls.enableDamping = true
    // this.controls.enableZoom = false

    // for rendering just the background texture
    this.envFbo = new THREE.WebGLRenderTarget(
      window.innerWidth * window.devicePixelRatio,
      window.innerHeight * window.devicePixelRatio
    )

    await updateLoadingProgressBar(0.1)

    // add ambient light
    let light = new THREE.AmbientLight(0xffffff, 50)
    scene.add(light)

    // create scene backdrop
    ballGeo = new THREE.IcosahedronGeometry(0.5, 8)
    ballMat = new THREE.MeshStandardMaterial({color: new THREE.Color(0xffffff)})
    for (let i = -7.5; i <= 7.5; i += 2.5) {
      for (let j = -7.5; j <= 7.5; j += 2.5) {
        let ballMesh = new THREE.Mesh(ballGeo, ballMat)
        ballMesh.position.set(i, j, -12)
        scene.add(ballMesh)
      }
    }
    // create the refractive mesh
    uniforms.uTexture.value = this.envFbo.texture
    meshGeo = new THREE.TorusGeometry(2, 1, 32, 100)
    meshMat = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      vertexColors: true
    })
    this.mesh = new THREE.Mesh(meshGeo, meshMat)
    this.mesh.position.set(0,0,-3)
    scene.add(this.mesh)
    await updateLoadingProgressBar(0.5)

    // GUI controls
    const gui = new dat.GUI()

    // Stats - show fps
    this.stats1 = new Stats()
    this.stats1.showPanel(0) // Panel 0 = fps
    this.stats1.domElement.style.cssText = "position:absolute;top:0px;left:0px;"
    // this.container is the parent DOM element of the threejs canvas element
    this.container.appendChild(this.stats1.domElement)

    await updateLoadingProgressBar(1.0, 100)
  },
  // @param {number} interval - time elapsed between 2 frames
  // @param {number} elapsed - total time elapsed since app start
  updateScene(interval, elapsed) {
    this.controls.update()
    this.stats1.update()

    renderer.clear()

    // render env to fbo
    this.mesh.visible = false
    renderer.setRenderTarget(this.envFbo)
    // clear the fbo before rendering a new frame
    renderer.clear()
    renderer.render(scene, camera)

    // render env to screen
    renderer.setRenderTarget(null)
    this.mesh.visible = true
    this.mesh.material.uniforms.uIorR.value = params.iorR
    this.mesh.material.uniforms.uIorG.value = params.iorG
    this.mesh.material.uniforms.uIorB.value = params.iorB
    
    renderer.render(scene, camera)
  },
  resize() {
    this.envFbo.setSize(
      window.innerWidth * window.devicePixelRatio,
      window.innerHeight * window.devicePixelRatio
    )
  }
}

/**************************************************
 * 3. Run the app
 * 'runApp' will do most of the boilerplate setup code for you:
 * e.g. HTML container, window resize listener, mouse move/touch listener for shader uniforms, THREE.Clock() for animation
 * Executing this line puts everything together and runs the app
 * ps. if you don't use custom shaders, pass undefined to the 'uniforms'(2nd-last) param
 * ps. if you don't use post-processing, pass undefined to the 'composer'(last) param
 *************************************************/
runApp(app, scene, renderer, camera, true, uniforms, undefined)
