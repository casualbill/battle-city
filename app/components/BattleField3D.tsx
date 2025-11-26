import * as THREE from 'three';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { State } from '../reducers';
import { BLOCK_SIZE as B } from '../utils/constants';

class BattleField3D extends Component<State> {
  private mountRef: HTMLDivElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private tanks: Map<number, THREE.Group> = new Map(); // Store tank meshes by tankId

  componentDidMount() {
    if (!this.mountRef) return;

    // Initialize scene
    this.scene = new THREE.Scene();

    // Initialize orthographic camera for top-down view
    const aspect = window.innerWidth / window.innerHeight;
    const battlefieldSize = 13 * B; // Full battlefield size
    this.camera = new THREE.OrthographicCamera(-battlefieldSize * aspect / 2, battlefieldSize * aspect / 2, battlefieldSize / 2, -battlefieldSize / 2, 0.1, 1000);
    this.camera.position.set(0, 100, 0); // Higher view for better visibility
    this.camera.lookAt(0, 0, 0);

    // Initialize renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000000);
    this.renderer.shadowMap.enabled = true;
    this.mountRef.appendChild(this.renderer.domElement);

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    // Add directional light with shadow
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);

    // Add ground plane
    const groundGeometry = new THREE.PlaneGeometry(13 * B, 13 * B);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x2c3e50 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Render loop
    this.animate();
  }

  componentDidUpdate(prevProps: State) {
    // Update tanks when the state changes
    this.updateTanks();
  }

  componentWillUnmount() {
    if (this.mountRef && this.renderer.domElement) {
      this.mountRef.removeChild(this.renderer.domElement);
    }
  }

  animate = () => {
    requestAnimationFrame(this.animate);
    this.renderer.render(this.scene, this.camera);
  };

  createTankModel = (color: number = 0x00ff00): THREE.Group => {
    // Create a simple tank model
    const tankGroup = new THREE.Group();

    // Tank body
    const bodyGeometry = new THREE.BoxGeometry(B - 0.2, 0.8, B - 0.2);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.4;
    body.castShadow = true;
    tankGroup.add(body);

    // Tank turret
    const turretGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.3, 16);
    const turretMaterial = new THREE.MeshStandardMaterial({ color: color * 0.8 });
    const turret = new THREE.Mesh(turretGeometry, turretMaterial);
    turret.position.y = 0.8;
    turret.castShadow = true;
    tankGroup.add(turret);

    // Tank gun
    const gunGeometry = new THREE.CylinderGeometry(0.1, 0.1, B * 0.5, 16);
    const gunMaterial = new THREE.MeshStandardMaterial({ color: color * 0.6 });
    const gun = new THREE.Mesh(gunGeometry, gunMaterial);
    gun.position.y = 1.0;
    gun.position.z = B * 0.25;
    gun.castShadow = true;
    tankGroup.add(gun);

    return tankGroup;
  };

  updateTanks = () => {
    const { tanks } = this.props;
    console.log('Tanks in state:', tanks.size); // Debug log

    // Remove tanks that are no longer in the state
    this.tanks.forEach((mesh, tankId) => {
      if (!tanks.has(tankId)) {
        this.scene.remove(mesh);
        this.tanks.delete(tankId);
      }
    });

    // Add or update tanks in the state
    tanks.forEach((tankRecord, tankId) => {
      const { x, y, direction, side, alive } = tankRecord;
      console.log('Processing tank:', tankId, x, y, direction, side, alive); // Debug log

      // Skip if tank is not alive
      if (!alive) {
        if (this.tanks.has(tankId)) {
          this.scene.remove(this.tanks.get(tankId));
          this.tanks.delete(tankId);
        }
        return;
      }

      // Set color based on side
      const color = side === 'player' ? 0x00ff00 : 0xff0000;

      // Get or create tank mesh
      let tankMesh = this.tanks.get(tankId);
      if (!tankMesh) {
        tankMesh = this.createTankModel(color);
        this.scene.add(tankMesh);
        this.tanks.set(tankId, tankMesh);
        console.log('Added tank mesh:', tankId); // Debug log
      }

      // Update tank position
      tankMesh.position.x = x;
      tankMesh.position.z = y;

      // Update tank rotation based on direction
      let rotation = 0;
      switch (direction) {
        case 'up':
          rotation = 0;
          break;
        case 'right':
          rotation = Math.PI / 2;
          break;
        case 'down':
          rotation = Math.PI;
          break;
        case 'left':
          rotation = -Math.PI / 2;
          break;
        default:
          rotation = 0;
      }
      tankMesh.rotation.y = rotation;
    });
  };

  render() {
    return <div ref={(ref) => (this.mountRef = ref)} style={{ width: '100%', height: '100vh' }} />;
  }
}

export default connect<State>((state) => state)(BattleField3D);