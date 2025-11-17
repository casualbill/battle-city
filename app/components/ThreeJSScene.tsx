import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { State } from '../reducers'
import { BLOCK_SIZE as B } from '../utils/constants'

interface ThreeJSSceneProps {
  state: State
}

const ThreeJSScene = ({ state }: ThreeJSSceneProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // 创建场景
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x000000)
    sceneRef.current = scene

    // 创建相机
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    camera.position.set(10 * B, 10 * B, 15 * B) // 45度俯视角
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    // 创建渲染器
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // 添加控制器
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.maxPolarAngle = Math.PI / 2.1 // 限制最大俯视角
    controls.rotateSpeed = 0.5
    controlsRef.current = controls

    // 键盘控制视角旋转
    const handleKeyDown = (event: any) => {
      if (!camera) return
      const rotationSpeed = 0.05
      
      switch (event.key) {
        case 'q':
        case 'Q':
          camera.rotation.y += rotationSpeed
          break
        case 'e':
        case 'E':
          camera.rotation.y -= rotationSpeed
          break
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    // 添加光源
    // 主光源
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5)
    directionalLight.position.set(10 * B, 10 * B, 15 * B)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    directionalLight.shadow.camera.near = 0.5
    directionalLight.shadow.camera.far = 50 * B
    scene.add(directionalLight)

    // 环境光
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5)
    scene.add(ambientLight)

    // 添加网格辅助线
    const gridHelper = new THREE.GridHelper(20 * B, 20, 0x444444, 0x222222)
    gridHelper.position.y = -0.1
    scene.add(gridHelper)

    // 处理窗口大小变化
    const handleResize = () => {
      if (!camera || !renderer) return
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', handleResize)

    // 动画循环
    const animate = () => {
      requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    // 清理函数
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('keydown', handleKeyDown)
      renderer.dispose()
      controls.dispose()
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement)
      }
    }
  }, [])

  // 更新场景中的游戏元素
  useEffect(() => {
    if (!sceneRef.current) return

    const scene = sceneRef.current

    // 清除旧的游戏元素
    const gameElements = scene.children.filter((child: any) => child.userData.isGameElement)
    gameElements.forEach((child: any) => scene.remove(child))

    // 渲染3D地形和元素
    render3DElements(scene, state)
  }, [state])

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}

// 重用的几何体和材质
const blockGeometry = new THREE.BoxGeometry(B, B / 2, B)
const riverGeometry = new THREE.BoxGeometry(B, B / 4, B)
const forestGeometry = new THREE.CylinderGeometry(B / 2, B / 2, B, 6)
const eagleGeometry = new THREE.BoxGeometry(B * 2, B, B * 2)
const tankGeometry = new THREE.BoxGeometry(B, B / 2, B)
const turretGeometry = new THREE.CylinderGeometry(B / 4, B / 4, B / 2, 6)
const barrelGeometry = new THREE.CylinderGeometry(B / 8, B / 8, B, 6)
const bulletGeometry = new THREE.SphereGeometry(B / 8, 8, 8)
const explosionGeometry = new THREE.SphereGeometry(B, 8, 8)
const powerUpGeometry = new THREE.BoxGeometry(B * 0.8, B * 0.8, B * 0.8)

// 材质
const brickMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 })
const steelMaterial = new THREE.MeshStandardMaterial({ color: 0x808080, metalness: 0.5, roughness: 0.3 })
const riverMaterial = new THREE.MeshStandardMaterial({ color: 0x4682b4, transparent: true, opacity: 0.8 })
const forestMaterial = new THREE.MeshStandardMaterial({ color: 0x228b22 })
const eagleMaterial = new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0x333300 })
const bulletMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0x555500 })
const explosionMaterial = new THREE.MeshStandardMaterial({ color: 0xff4500, emissive: 0xff4500 })
const powerUpMaterial = new THREE.MeshStandardMaterial({ color: 0xff69b4, emissive: 0x550033 })

function render3DElements(scene: THREE.Scene, state: State) {
  const { map, tanks, bullets, explosions, powerUps } = state
  const { bricks, steels, rivers, forests, eagle } = map.toObject()

  // 渲染砖墙
  bricks.forEach((brick: any) => {
    const mesh = new THREE.Mesh(blockGeometry, brickMaterial)
    mesh.position.set(brick.x, B / 4, brick.y)
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.userData.isGameElement = true
    scene.add(mesh)
  })

  // 渲染钢墙
  steels.forEach((steel: any) => {
    const mesh = new THREE.Mesh(blockGeometry, steelMaterial)
    mesh.position.set(steel.x, B / 4, steel.y)
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.userData.isGameElement = true
    scene.add(mesh)
  })

  // 渲染河流
  rivers.forEach((river: any) => {
    const mesh = new THREE.Mesh(riverGeometry, riverMaterial)
    mesh.position.set(river.x, B / 8, river.y)
    mesh.receiveShadow = true
    mesh.userData.isGameElement = true
    scene.add(mesh)
  })

  // 渲染森林
  forests.forEach((forest: any) => {
    const mesh = new THREE.Mesh(forestGeometry, forestMaterial)
    mesh.position.set(forest.x, B / 2, forest.y)
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.userData.isGameElement = true
    scene.add(mesh)
  })

  // 渲染基地
  if (eagle && typeof eagle !== 'boolean') {
    const eagleGeometry = new THREE.BoxGeometry(B * 2, B, B * 2)
    const eagleMesh = new THREE.Mesh(eagleGeometry, eagleMaterial)
    eagleMesh.position.set(eagle.x + B, B / 2, eagle.y + B)
    eagleMesh.castShadow = true
    eagleMesh.receiveShadow = true
    eagleMesh.userData.isGameElement = true
    scene.add(eagleMesh)
  }

  // 渲染坦克 - 坦克几何体已经在外部定义

  tanks.forEach((tank: any) => {
    if (!tank.alive) return

    // 坦克主体颜色
    const tankColor = tank.color === 'green' ? 0x006400 : 
                     tank.color === 'red' ? 0x8b0000 : 
                     tank.color === 'yellow' ? 0x8b8b00 : 0x696969

    // 坦克主体
    const tankMaterial = new THREE.MeshStandardMaterial({ color: tankColor, metalness: 0.1, roughness: 0.8 })
    const tankMesh = new THREE.Mesh(tankGeometry, tankMaterial)
    tankMesh.position.set(tank.x, B / 4, tank.y)
    tankMesh.castShadow = true
    tankMesh.receiveShadow = true
    tankMesh.userData.isGameElement = true

    // 坦克顶部装甲
    const topArmorGeometry = new THREE.BoxGeometry(B * 0.9, B / 8, B * 0.9)
    const topArmorMaterial = new THREE.MeshStandardMaterial({ color: tankColor, metalness: 0.2, roughness: 0.7 })
    const topArmorMesh = new THREE.Mesh(topArmorGeometry, topArmorMaterial)
    topArmorMesh.position.set(0, B / 8, 0)
    topArmorMesh.castShadow = true
    topArmorMesh.receiveShadow = true
    tankMesh.add(topArmorMesh)

    // 炮塔
    const turretMaterial = new THREE.MeshStandardMaterial({ color: tankColor, metalness: 0.3, roughness: 0.6 })
    const turretMesh = new THREE.Mesh(turretGeometry, turretMaterial)
    turretMesh.position.set(0, B / 4, 0)
    turretMesh.castShadow = true
    turretMesh.receiveShadow = true
    tankMesh.add(turretMesh)

    // 炮管
    const barrelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.4 })
    const barrelMesh = new THREE.Mesh(barrelGeometry, barrelMaterial)
    barrelMesh.position.set(0, 0, B / 2)
    barrelMesh.castShadow = true
    barrelMesh.receiveShadow = true
    turretMesh.add(barrelMesh)

    // 履带 - 左侧
    const leftTrackGeometry = new THREE.BoxGeometry(B / 8, B / 4, B)
    const leftTrackMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 })
    const leftTrackMesh = new THREE.Mesh(leftTrackGeometry, leftTrackMaterial)
    leftTrackMesh.position.set(-B / 2 + B / 16, 0, 0)
    leftTrackMesh.castShadow = true
    leftTrackMesh.receiveShadow = true
    tankMesh.add(leftTrackMesh)

    // 履带 - 右侧
    const rightTrackGeometry = new THREE.BoxGeometry(B / 8, B / 4, B)
    const rightTrackMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 })
    const rightTrackMesh = new THREE.Mesh(rightTrackGeometry, rightTrackMaterial)
    rightTrackMesh.position.set(B / 2 - B / 16, 0, 0)
    rightTrackMesh.castShadow = true
    rightTrackMesh.receiveShadow = true
    tankMesh.add(rightTrackMesh)

    // 履带轮 - 左侧
    const wheelGeometry = new THREE.CylinderGeometry(B / 12, B / 12, B / 8, 6)
    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 })
    
    for (let i = -3; i <= 3; i++) {
      const wheelMesh = new THREE.Mesh(wheelGeometry, wheelMaterial)
      wheelMesh.rotation.z = Math.PI / 2
      wheelMesh.position.set(-B / 2 + B / 16, -B / 8, i * B / 6)
      wheelMesh.castShadow = true
      wheelMesh.receiveShadow = true
      tankMesh.add(wheelMesh)
    }

    // 履带轮 - 右侧
    for (let i = -3; i <= 3; i++) {
      const wheelMesh = new THREE.Mesh(wheelGeometry, wheelMaterial)
      wheelMesh.rotation.z = Math.PI / 2
      wheelMesh.position.set(B / 2 - B / 16, -B / 8, i * B / 6)
      wheelMesh.castShadow = true
      wheelMesh.receiveShadow = true
      tankMesh.add(wheelMesh)
    }

    // 根据坦克方向旋转坦克和炮塔
    switch (tank.direction) {
      case 'up':
        tankMesh.rotation.y = 0
        break
      case 'right':
        tankMesh.rotation.y = Math.PI / 2
        break
      case 'down':
        tankMesh.rotation.y = Math.PI
        break
      case 'left':
        tankMesh.rotation.y = -Math.PI / 2
        break
    }

    scene.add(tankMesh)
  })

  // 渲染子弹
  const bulletGeometry = new THREE.SphereGeometry(B / 8, 8, 8)
  const bulletMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 })

  bullets.forEach((bullet: any) => {
    const bulletMesh = new THREE.Mesh(bulletGeometry, bulletMaterial)
    bulletMesh.position.set(bullet.x, B / 2, bullet.y)
    bulletMesh.castShadow = true
    bulletMesh.userData.isGameElement = true
    scene.add(bulletMesh)
  })

  // 渲染爆炸
  explosions.forEach((explosion: any) => {
    const explosionGeometry = new THREE.SphereGeometry(B * explosion.scale / 2, 8, 8)
    const explosionMaterial = new THREE.MeshStandardMaterial({ color: 0xff4500, emissive: 0xff4500 })
    const explosionMesh = new THREE.Mesh(explosionGeometry, explosionMaterial)
    explosionMesh.position.set(explosion.x, B / 2, explosion.y)
    explosionMesh.castShadow = true
    explosionMesh.userData.isGameElement = true
    scene.add(explosionMesh)
  })

  // 渲染道具
  const powerUpGeometry = new THREE.BoxGeometry(B * 0.8, B * 0.8, B * 0.8)
  const powerUpMaterial = new THREE.MeshStandardMaterial({ color: 0xff69b4 })

  powerUps.forEach((powerUp: any) => {
    const powerUpMesh = new THREE.Mesh(powerUpGeometry, powerUpMaterial)
    powerUpMesh.position.set(powerUp.x, B / 2, powerUp.y)
    powerUpMesh.castShadow = true
    powerUpMesh.userData.isGameElement = true
    scene.add(powerUpMesh)
  })
}

export default ThreeJSScene