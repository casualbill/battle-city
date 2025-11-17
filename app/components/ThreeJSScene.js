import React from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { BLOCK_SIZE as B } from '../utils/constants';

export default React.createClass({
  containerRef: null,
  sceneRef: null,
  cameraRef: null,
  rendererRef: null,
  controlsRef: null,
  animationId: null,

  componentDidMount: function() {
    if (!this.containerRef) return;

    // 创建场景
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    this.sceneRef = scene;

    // 创建相机
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(10 * B, 10 * B, 15 * B);
    camera.lookAt(0, 0, 0);
    this.cameraRef = camera;

    // 创建渲染器
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.containerRef.appendChild(renderer.domElement);
    this.rendererRef = renderer;

    // 添加控制器
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.1;
    controls.rotateSpeed = 0.5;
    this.controlsRef = controls;

    // 键盘控制视角旋转
    const handleKeyDown = (event) => {
      if (!this.cameraRef) return;
      const rotationSpeed = 0.05;
      
      switch (event.key) {
        case 'q':
        case 'Q':
          this.cameraRef.rotation.y += rotationSpeed;
          break;
        case 'e':
        case 'E':
          this.cameraRef.rotation.y -= rotationSpeed;
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // 添加光源
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(10 * B, 10 * B, 15 * B);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50 * B;
    scene.add(directionalLight);

    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    // 添加网格辅助线
    const gridHelper = new THREE.GridHelper(20 * B, 20, 0x444444, 0x222222);
    gridHelper.position.y = -0.1;
    scene.add(gridHelper);

    // 处理窗口大小变化
    const handleResize = () => {
      if (!this.cameraRef || !this.rendererRef) return;
      this.cameraRef.aspect = window.innerWidth / window.innerHeight;
      this.cameraRef.updateProjectionMatrix();
      this.rendererRef.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // 动画循环
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);

      if (this.controlsRef) {
        this.controlsRef.update();
      }

      if (this.sceneRef) {
        this.render3DElements(this.sceneRef);
      }

      if (this.rendererRef && this.sceneRef && this.cameraRef) {
        this.rendererRef.render(this.sceneRef, this.cameraRef);
      }
    };
    animate();
  },

  componentWillUnmount: function() {
    // 清理资源
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    window.removeEventListener('keydown', () => {});
    window.removeEventListener('resize', () => {});

    if (this.rendererRef) {
      this.rendererRef.dispose();
    }

    // 重置所有引用
    this.containerRef = null;
    this.sceneRef = null;
    this.cameraRef = null;
    this.rendererRef = null;
    this.controlsRef = null;
    this.animationId = null;
  },

  render3DElements: function(scene) {
    // 清除旧的游戏元素
    scene.children = scene.children.filter(child => !child.userData.isGameElement);

    // 获取游戏状态
    const { state } = this.props;
    const terrain = state.terrain;
    const tanks = state.tanks;
    const bullets = state.bullets;
    const eagle = state.eagle;

    // 创建几何体和材质
    const blockGeometry = new THREE.BoxGeometry(B, B / 2, B);
    const brickMaterial = new THREE.MeshPhongMaterial({ color: 0xff6600 });
    const steelMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });
    const riverMaterial = new THREE.MeshPhongMaterial({ color: 0x0000ff, transparent: true, opacity: 0.5 });
    const forestMaterial = new THREE.MeshPhongMaterial({ color: 0x008800 });
    const eagleMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });

    // 渲染砖墙
    terrain.bricks.forEach(brick => {
      const brickMesh = new THREE.Mesh(blockGeometry, brickMaterial);
      brickMesh.position.set(brick.x + B / 2, B / 4, brick.y + B / 2);
      brickMesh.castShadow = true;
      brickMesh.receiveShadow = true;
      brickMesh.userData.isGameElement = true;
      scene.add(brickMesh);
    });

    // 渲染钢板
    terrain.steels.forEach(steel => {
      const steelMesh = new THREE.Mesh(blockGeometry, steelMaterial);
      steelMesh.position.set(steel.x + B / 2, B / 4, steel.y + B / 2);
      steelMesh.castShadow = true;
      steelMesh.receiveShadow = true;
      steelMesh.userData.isGameElement = true;
      scene.add(steelMesh);
    });

    // 渲染河流
    terrain.rivers.forEach(river => {
      const riverMesh = new THREE.Mesh(blockGeometry, riverMaterial);
      riverMesh.position.set(river.x + B / 2, B / 8, river.y + B / 2);
      riverMesh.receiveShadow = true;
      riverMesh.userData.isGameElement = true;
      scene.add(riverMesh);
    });

    // 渲染森林
    terrain.forests.forEach(forest => {
      const forestMesh = new THREE.Mesh(blockGeometry, forestMaterial);
      forestMesh.position.set(forest.x + B / 2, B / 2, forest.y + B / 2);
      forestMesh.castShadow = true;
      forestMesh.receiveShadow = true;
      forestMesh.userData.isGameElement = true;
      scene.add(forestMesh);
    });

    // 渲染基地
    if (eagle) {
      const eagleGeometry = new THREE.BoxGeometry(B * 2, B, B * 2);
      const eagleMesh = new THREE.Mesh(eagleGeometry, eagleMaterial);
      eagleMesh.position.set(eagle.x + B, B / 2, eagle.y + B);
      eagleMesh.castShadow = true;
      eagleMesh.receiveShadow = true;
      eagleMesh.userData.isGameElement = true;
      scene.add(eagleMesh);
    }

    // 渲染坦克
    tanks.forEach((tank, index) => {
      // 坦克主体
      const tankBodyGeometry = new THREE.BoxGeometry(B, B / 2, B);
      const tankColor = tank.team === 0 ? 0x00ff00 : 0xff0000;
      const tankBodyMaterial = new THREE.MeshPhongMaterial({ color: tankColor });
      const tankBodyMesh = new THREE.Mesh(tankBodyGeometry, tankBodyMaterial);
      tankBodyMesh.position.set(tank.x + B / 2, B / 2, tank.y + B / 2);
      tankBodyMesh.castShadow = true;
      tankBodyMesh.receiveShadow = true;
      tankBodyMesh.userData.isGameElement = true;
      scene.add(tankBodyMesh);

      // 坦克炮管
      const cannonGeometry = new THREE.BoxGeometry(B / 3, B / 4, B * 1.5);
      const cannonMaterial = new THREE.MeshPhongMaterial({ color: tankColor });
      const cannonMesh = new THREE.Mesh(cannonGeometry, cannonMaterial);
      cannonMesh.position.set(tank.x + B / 2, B / 2, tank.y + B * 1.25);
      cannonMesh.castShadow = true;
      cannonMesh.receiveShadow = true;
      cannonMesh.userData.isGameElement = true;
      scene.add(cannonMesh);

      // 坦克履带
      const trackGeometry = new THREE.BoxGeometry(B, B / 4, B / 3);
      const trackMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });

      // 左侧履带
      const leftTrack1Mesh = new THREE.Mesh(trackGeometry, trackMaterial);
      leftTrack1Mesh.position.set(tank.x + B / 4, B / 4, tank.y + B / 4);
      leftTrack1Mesh.castShadow = true;
      leftTrack1Mesh.receiveShadow = true;
      leftTrack1Mesh.userData.isGameElement = true;
      scene.add(leftTrack1Mesh);

      const leftTrack2Mesh = new THREE.Mesh(trackGeometry, trackMaterial);
      leftTrack2Mesh.position.set(tank.x + B / 4, B / 4, tank.y + B * 3 / 4);
      leftTrack2Mesh.castShadow = true;
      leftTrack2Mesh.receiveShadow = true;
      leftTrack2Mesh.userData.isGameElement = true;
      scene.add(leftTrack2Mesh);

      // 右侧履带
      const rightTrack1Mesh = new THREE.Mesh(trackGeometry, trackMaterial);
      rightTrack1Mesh.position.set(tank.x + B * 3 / 4, B / 4, tank.y + B / 4);
      rightTrack1Mesh.castShadow = true;
      rightTrack1Mesh.receiveShadow = true;
      rightTrack1Mesh.userData.isGameElement = true;
      scene.add(rightTrack1Mesh);

      const rightTrack2Mesh = new THREE.Mesh(trackGeometry, trackMaterial);
      rightTrack2Mesh.position.set(tank.x + B * 3 / 4, B / 4, tank.y + B * 3 / 4);
      rightTrack2Mesh.castShadow = true;
      rightTrack2Mesh.receiveShadow = true;
      rightTrack2Mesh.userData.isGameElement = true;
      scene.add(rightTrack2Mesh);
    });

    // 渲染子弹
    bullets.forEach((bullet, index) => {
      const bulletGeometry = new THREE.BoxGeometry(B / 6, B / 6, B / 2);
      const bulletMaterial = new THREE.MeshPhongMaterial({ color: 0xffff00 });
      const bulletMesh = new THREE.Mesh(bulletGeometry, bulletMaterial);
      bulletMesh.position.set(bullet.x + B / 2, B / 4, bullet.y + B / 2);
      bulletMesh.castShadow = true;
      bulletMesh.receiveShadow = true;
      bulletMesh.userData.isGameElement = true;
      scene.add(bulletMesh);
    });
  },

  render: function() {
    return React.createElement('div', { ref: (el) => this.containerRef = el, style: { width: '100%', height: '100%' } }, null);
  }
});