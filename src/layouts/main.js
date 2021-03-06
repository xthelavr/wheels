import React, {Component, Fragment} from "react";
import * as THREE from "three";
import {carsFPath, colors, defaultOpts, opts, wheelsFPath, windowSize} from "../utils";

const three = THREE;

class Main extends Component {
  constructor() {
    super();
    this.state = {
      renderer: null,
      scene: null,
      camera: null,
      models: {},
      wheels: ["vossen", "enkei"],
      currentColor: "exColor3",
      currentWheel: "vossen"
    };
  }

  async componentDidMount() {
    await this.init();
    await document.getElementById("scene").appendChild(this.state.renderer.domElement);
    this.renderScene();
  }

  init = async () => {
    const renderer = new three.WebGLRenderer({antialias: true});
    renderer.context.getShaderInfoLog = () => "";
    renderer.setSize(windowSize.width, windowSize.height);
    renderer.setClearColor(colors.secondColor, 1);

    const scene = new three.Scene();

    const camera = new three.PerspectiveCamera(20, windowSize.width / windowSize.height, 0.2, 25000);
    camera.position.set(1500, 500, 500);
    scene.add(camera);

    const OrbitControls = require("../utils/orbitControls")(THREE);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.addEventListener("change", this.renderScene);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.enableDamping = false;
    controls.enableKeys = false;
    controls.rotateSpeed = 0.5;

    const light_1 = new three.PointLight(0xffffff, 0.5, 10000);
    light_1.position.set(50, 150, 0);
    const light_2 = new three.PointLight(0xffffff, 0.5, 10000);
    light_2.position.set(250, 500, 500);
    const light_3 = new three.PointLight(0xffffff, 0.5, 10000);
    light_3.position.set(550, 500, 500);
    const light_4 = new three.PointLight(0xffffff, 0.5, 10000);
    light_4.position.set(-250, -500, -500);
    const lightAmbient = new three.AmbientLight(0x404040);
    scene.add(light_1, light_2, light_3, light_4, lightAmbient);

    await this.setState({renderer: renderer, scene: scene, camera: camera});
    await this.loadOneTypeModels(carsFPath, "audi");
    await this.loadOneTypeModels(wheelsFPath, "vossen", "wheels");
    window.addEventListener("resize", this.onWindowResize, false);
  };

  loadOneTypeModels = async (models, defaultModel, type) => {
    for (const model in models) {
      if (models.hasOwnProperty(model)) {
        const object = await this.loadModel(models[model], model);
        if (model === defaultModel) {
          switch (type) {
            case "wheels":
              this.addWheelToScene(object);
              break;
            default:
              this.state.scene.add(object);
          }
        }
      }
    }
  };

  loadModel = (filepath, name) => {
    return new Promise((resolve) => {
      new three.JSONLoader().load(filepath, (geometry) => {
        const material = new three.MeshPhongMaterial({
          flatShading: three.FlatShading,
          color: defaultOpts.color
        });

        const model = new three.Mesh(geometry, material);
        this.setOpts(model, defaultOpts);
        const {models} = this.state;
        models[name] = model;
        this.setState({models: models});
        resolve(model);
      });
    });
  };

  addWheelToScene = (model) => {
    const wheel_1 = model.clone();
    const wheel_2 = model.clone();
    const wheel_3 = model.clone();
    const wheel_4 = model.clone();

    this.setOpts(wheel_1, opts.wheel_1);
    this.setOpts(wheel_2, opts.wheel_2);
    this.setOpts(wheel_3, opts.wheel_3);
    this.setOpts(wheel_4, opts.wheel_4);

    this.state.scene.add(wheel_1, wheel_2, wheel_3, wheel_4);
  };

  setOpts = (model, opts) => {
    model.name = opts.name;
    model.material.color.set(opts.color);
    model.position.x = opts.pX;
    model.position.y = opts.pY;
    model.position.z = opts.pZ;
    model.rotation.x = opts.rX;
    model.rotation.y = opts.rY;
    model.rotation.z = opts.rZ;
  };

  onWindowResize = () => {
    const {camera} = this.state;
    camera.aspect = windowSize.width / windowSize.height;
    camera.updateProjectionMatrix();
    this.setState({camera: camera});
    this.state.renderer.setSize(windowSize.width, windowSize.height);
    this.renderScene();
  };

  getCurrentWheels = () => {
    const {scene} = this.state;
    return {
      wheel_1: scene.getObjectByName("wheel_1"),
      wheel_2: scene.getObjectByName("wheel_2"),
      wheel_3: scene.getObjectByName("wheel_3"),
      wheel_4: scene.getObjectByName("wheel_4")
    };
  };

  handleChangeColor = (e, c) => {
    const color = colors[c];
    opts.wheel_1.color = color;
    opts.wheel_2.color = color;
    opts.wheel_3.color = color;
    opts.wheel_4.color = color;

    const wheels = this.getCurrentWheels();
    this.removeWheels();
    this.addWheelToScene(wheels.wheel_1);
    this.renderScene();
    this.setState({currentColor: c});
  };

  removeWheels = () => {
    const wheels = this.getCurrentWheels();
    this.state.scene.remove(
      wheels.wheel_1,
      wheels.wheel_2,
      wheels.wheel_3,
      wheels.wheel_4
    );
  };

  handleChangeWheel = (e, wheel) => {
    this.removeWheels();
    this.addWheelToScene(this.state.models[wheel]);
    this.renderScene();
    this.setState({currentWheel: wheel});
  };

  renderScene = () => {
    this.state.renderer.render(this.state.scene, this.state.camera);
  };

  render() {
    const {wheels, models} = this.state;
    return (
      <Fragment>
        {
          !wheels || !Object.keys(models).length ?
            <div className="alert alert-warning">Loading...</div> :

            <Fragment>
              <div id="scene" className="d-flex justify-content-center"/>

              <div className="d-flex justify-content-center">
                <div className="wheels-block">
                  {
                    Object.keys(wheels).map((id, index) => {
                      const wheel = wheels[id];
                      return (
                        <button
                          className="ml-2 mr-2 btn btn-primary"
                          onClick={(e) => this.handleChangeWheel(e, wheel)}
                          key={index}
                          disabled={wheel === this.state.currentWheel}
                        >
                          {wheel}
                        </button>
                      );
                    })
                  }
                </div>

                <div className="d-flex colors-block ml-5">
                  {
                    Object.keys(colors).map((color, index) =>
                      <button
                        className="ml-1 mr-1 btn btn-primary"
                        disabled={color === this.state.currentColor}
                        key={index}
                        onClick={(e) => this.handleChangeColor(e, color)}
                      />
                    )
                  }
                </div>
              </div>
            </Fragment>
        }
      </Fragment>
    );
  }
}

export default Main;
