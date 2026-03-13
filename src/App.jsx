import { useState, useRef, useMemo, useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Environment, useGLTF, MeshTransmissionMaterial, OrbitControls } from '@react-three/drei'
import { useControls } from 'leva'
import * as THREE from 'three'
import './App.css'

function BackgroundVideo() {
  const { viewport } = useThree()
  const [video] = useState(() => {
    const vid = document.createElement('video')
    vid.src = 'assets/flip_phone_sun.mp4'
    vid.crossOrigin = 'Anonymous'
    vid.loop = true
    vid.muted = true
    vid.play().catch(e => console.error("Video play failed:", e))
    return vid
  })

  // We map the video to the background and fix the brightness issue
  const texture = useMemo(() => {
    const t = new THREE.VideoTexture(video)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [video])

  // Calculate cover sizing
  useEffect(() => {
    if (!video) return
    const onResize = () => {
      const windowAspect = window.innerWidth / window.innerHeight
      const videoAspect = 1920 / 1080 // Assuming 1080p source video

      let scaleX = 1
      let scaleY = 1

      if (windowAspect > videoAspect) {
        // Window is wider than video, so cut off top/bottom
        scaleY = videoAspect / windowAspect
      } else {
        // Window is taller than video, so cut off sides
        scaleX = windowAspect / videoAspect
      }

      texture.repeat.set(scaleX, scaleY)
      texture.offset.set((1 - scaleX) / 2, (1 - scaleY) / 2)
    }

    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [texture, video, viewport])

  return (
    <primitive attach="background" object={texture} />
  )
}

function ExtrudedText(props) {
  // Load the model
  const { nodes } = useGLTF('assets/ghyll-3d-model-web.glb')
  
  // Find the first mesh geometry in the GLTF
  const meshRef = useRef()
  const geometry = Object.values(nodes).find(n => n.type === 'Mesh' || n.isMesh)?.geometry
  
  // Remove UVs
  if (geometry && geometry.attributes.uv) {
    geometry.deleteAttribute('uv')
  }
  
  // Setup Leva controls to match user's V1 defaults, plus new V2 features
  const config = useControls({
    color: '#f20606', // updated from screenshot
    thickness: { value: 2.0, min: 0, max: 10, step: 0.1 },
    roughness: { value: 0.10, min: 0, max: 1, step: 0.01 },
    ior: { value: 3.00, min: 1, max: 3, step: 0.01 },
    metalness: { value: 0.00, min: 0, max: 1, step: 0.01 },
    clearcoat: { value: 0.12, min: 0, max: 1, step: 0.01 },
    clearcoatRoughness: { value: 0.91, min: 0, max: 1, step: 0.01 },
    envMapIntensity: { value: 1.33, min: 0, max: 5, step: 0.01 },
    transmission: { value: 1.00, min: 0, max: 1 },
    // V2 New Features from MeshTransmissionMaterial:
    chromaticAberration: { value: 1.05, min: 0, max: 10, step: 0.01 },
    anisotropy: { value: 0.10, min: 0, max: 1, step: 0.01 },
    distortion: { value: 0.05, min: 0, max: 1, step: 0.01 },
    distortionScale: { value: 0.13, min: 0.01, max: 1, step: 0.01 },
    temporalDistortion: { value: 0.08, min: 0, max: 1, step: 0.01 },
  })

  return (
    <mesh ref={meshRef} geometry={geometry} {...props}>
      <MeshTransmissionMaterial 
        {...config} 
        backside={false}
        samples={16}
        resolution={1024}
        transmissionSampler
      />
    </mesh>
  )
}

function App() {
  const { ambientLightIntensity, directionalLightIntensity } = useControls('Lighting', {
    ambientLightIntensity: { value: 0.50, min: 0, max: 5, step: 0.01 },
    directionalLightIntensity: { value: 1.00, min: 0, max: 10, step: 0.01 }
  })

  return (
    <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
      {/* Video Background */}
      <BackgroundVideo />
      
      {/* Environment map lighting */}
      <Environment files="assets/abandoned_hopper_terminal_04_1k.hdr" />
      
      {/* Lighting */}
      <ambientLight intensity={ambientLightIntensity} />
      <directionalLight position={[10, 10, 10]} intensity={directionalLightIntensity} />

      {/* Renders our 3D Model with transmission material */}
      <ExtrudedText position={[0, -0.5, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 1]} />

      {/* OrbitControls for user interaction */}
      <OrbitControls makeDefault />
    </Canvas>
  )
}

export default App
