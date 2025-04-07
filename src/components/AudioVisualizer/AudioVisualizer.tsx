

import * as THREE from "three";
import { useEffect, useRef, useState } from "react";

import { EffectComposer, RenderPass, UnrealBloomPass } from "three-stdlib";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { AudioAnalyser } from "three";



const vertexShader = `
uniform float u_time;
uniform float u_frequency;

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+10.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
vec3 fade(vec3 t) { return t*t*t*(t*(t*6.0-15.0)+10.0); }

float pnoise(vec3 P, vec3 rep) {
  vec3 Pi0 = mod(floor(P), rep);
  vec3 Pi1 = mod(Pi0 + vec3(1.0), rep);
  Pi0 = mod289(Pi0);
  Pi1 = mod289(Pi1);
  vec3 Pf0 = fract(P);
  vec3 Pf1 = Pf0 - vec3(1.0);
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;

  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);

  vec4 gx0 = ixy0 * (1.0 / 7.0);
  vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);

  vec4 gx1 = ixy1 * (1.0 / 7.0);
  vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);

  vec3 g000 = vec3(gx0.x, gy0.x, gz0.x);
  vec3 g100 = vec3(gx0.y, gy0.y, gz0.y);
  vec3 g010 = vec3(gx0.z, gy0.z, gz0.z);
  vec3 g110 = vec3(gx0.w, gy0.w, gz0.w);
  vec3 g001 = vec3(gx1.x, gy1.x, gz1.x);
  vec3 g101 = vec3(gx1.y, gy1.y, gz1.y);
  vec3 g011 = vec3(gx1.z, gy1.z, gz1.z);
  vec3 g111 = vec3(gx1.w, gy1.w, gz1.w);

  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x;
  g010 *= norm0.y;
  g100 *= norm0.z;
  g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x;
  g011 *= norm1.y;
  g101 *= norm1.z;
  g111 *= norm1.w;

  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);

  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
  return 2.2 * n_xyz;
}

void main() {
    float noise = 3.0 * pnoise(position + u_time, vec3(10.0));
    float displacement = (u_frequency / 30.0) * (noise / 10.0);
    vec3 newPosition = position + normal * displacement;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
`;

const fragmentShader = `
uniform float u_red;
uniform float u_green;
uniform float u_blue;

void main() {
    gl_FragColor = vec4(vec3(u_red, u_green, u_blue), 1.0);
}
`;

interface Props {
  src: string;
  width: number;
  height: number;
  uniforms: any;
  scrollerPosition: any;
  index: number;
  isLoaded: boolean;
  setIsLoaded: any;
  isLoaded2: boolean;
  setIsLoaded2: any;
  type?: string;
  autoplay?: boolean;
}

// Tailwind to CSS mapping:
// absolute -> position: 'absolute'
// bottom-0 -> bottom: '0px'
// left-0 -> left: '0px'
// right-0 -> right: '0px'
// bg-black/60 -> backgroundColor: 'rgba(0, 0, 0, 0.6)'
// p-2 -> padding: '0.5rem' (8px)
// flex -> display: 'flex'
// flex-col -> flexDirection: 'column'
// items-center -> alignItems: 'center'
// w-full -> width: '100%'
// mb-1 -> marginBottom: '0.25rem' (4px)
// text-white -> color: 'white'
// text-xs -> fontSize: '0.75rem' (12px), lineHeight: '1rem' (16px) - Note: line-height added for completeness, might not be needed depending on exact layout
// mr-2 -> marginRight: '0.5rem' (8px)
// ml-2 -> marginLeft: '0.5rem' (8px)
// h-1 -> height: '0.25rem' (4px)
// bg-gray-600 -> backgroundColor: '#4B5563' (Note: This is overridden by the inline style gradient)
// rounded-lg -> borderRadius: '0.5rem' (8px)
// appearance-none -> appearance: 'none'
// cursor-pointer -> cursor: 'pointer'
// justify-center -> justifyContent: 'center'
// bg-blue-600 -> backgroundColor: '#2563EB'
// hover:bg-blue-700 -> Pseudo-class, cannot be directly converted to inline style. Will be omitted.
// rounded-full -> borderRadius: '9999px'
// w-8 -> width: '2rem' (32px)
// h-8 -> height: '2rem' (32px)
// focus:outline-none -> Pseudo-class, cannot be directly converted. Applying 'outline: none' directly.
// w-5 -> width: '1.25rem' (20px)
// h-5 -> height: '1.25rem' (20px)


const AudioVisualizerShader = ({ 
  src, 
  width, 
  height, 
  uniforms, 
  scrollerPosition, 
  index, 
  isLoaded, 
  isLoaded2, 
  setIsLoaded, 
  setIsLoaded2, 
  type, 
  autoplay = true 
}: Props) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const soundRef = useRef<THREE.Audio | null>(null);
  const analyserRef = useRef<THREE.AudioAnalyser | null>(null);
  const volumeRef = useRef<number>(scrollerPosition / 100);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const animationRef = useRef<number | null>(null);

  // Format time from seconds to MM:SS
  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Toggle play/pause
  const togglePlayPause = () => {
    if (!soundRef.current) return;
    
    if (isPlaying) {
      soundRef.current.pause();
    } else {
      soundRef.current.play();
      soundRef.current.context.resume(); // Ensure context is resumed on user interaction
    }
    
    setIsPlaying(!isPlaying);
  };

  const handleTimelineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!soundRef.current || !soundRef.current.buffer) return;
  
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
  
    const sound = soundRef.current;
    const buffer = sound.buffer;
  
    // Stop the current playback before seeking
    if (sound.isPlaying) {
      sound.stop();
    }
  
    // Set the offset property for the *next* playback
    sound.offset = Math.min(newTime, buffer!.duration);
  
    // If it was playing before, start playing again from the new offset
    if (isPlaying) {
       // Start playback immediately at the new offset
       // The third argument '0' means start immediately
       sound.play(); 
    }
    // If it was paused, it remains paused but the offset is set for the next play action.
  };

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, -2, 14);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    // Ensure mountRef.current is not null before appending
    const currentMountRef = mountRef.current; 
    currentMountRef.appendChild(renderer.domElement);

    const listener = new THREE.AudioListener();
    camera.add(listener);
    const sound = new THREE.Audio(listener);
    soundRef.current = sound;

    const analyser = new AudioAnalyser(sound, 32);
    analyserRef.current = analyser;

    // Audio loader with loading state
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load(
      src,
      (buffer) => {
        sound.setBuffer(buffer);
        sound.setLoop(true);
        sound.setVolume(0.9);
        
        setDuration(buffer.duration);
        
        setIsLoaded(true);
        setIsLoaded2(true);
        
        if (autoplay) {
          sound.play();
          setIsPlaying(true);
        }
      },
      undefined,
      (error) => console.error("Audio loading error:", error)
    );

    // Rest of the setup
    const geometry = new THREE.IcosahedronGeometry(4, 8);
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      wireframe: true
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Post-processing setup
    const bloomParams = {
      threshold: 0.5,
      strength: 0.5,
      radius: 0.8
    };

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      bloomParams.strength,
      bloomParams.radius,
      bloomParams.threshold
    );
    composer.addPass(bloomPass);
    composer.addPass(new OutputPass());

    // Mouse interaction
    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e: MouseEvent) => {
        mouseX = (e.clientX - window.innerWidth / 2) / 100;
        mouseY = (e.clientY - window.innerHeight / 2) / 100;
    };
    document.addEventListener("mousemove", handleMouseMove);


    const clock = new THREE.Clock();
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      
      camera.position.x += (mouseX - camera.position.x) * 0.05;
      camera.position.y += (-mouseY - camera.position.y) * 0.05;
      camera.lookAt(scene.position);

      uniforms.u_time.value = clock.getElapsedTime();
       if (analyserRef.current) {
         uniforms.u_frequency.value = analyserRef.current.getAverageFrequency();
       }

      // Update current time if audio is playing
      if (sound && sound.isPlaying && sound.source?.context?.currentTime) {
        setCurrentTime(sound.context.currentTime);
      }
      


      composer.render();
    };

    animate();

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      document.removeEventListener("mousemove", handleMouseMove);

      if (soundRef.current && soundRef.current.isPlaying) {
        soundRef.current.stop();
      }
      soundRef.current = null; // Help garbage collection
      analyserRef.current = null;
      
      geometry.dispose();
      material.dispose();
      // Dispose passes if they have a dispose method
      // bloomPass.dispose(); // UnrealBloomPass does not have dispose in three-stdlib? Check version/docs
      // renderPass and outputPass generally don't need explicit disposal beyond the composer

      composer.dispose(); // Dispose composer resources if available (check EffectComposer docs for your version)

      renderer.dispose();
      if (currentMountRef && renderer.domElement) {
          try {
            currentMountRef.removeChild(renderer.domElement);
          } catch (e) {
              // Ignore error if element already removed
          }
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, width, height, uniforms, autoplay, setIsLoaded, setIsLoaded2]); // Adjusted dependencies

  useEffect(() => {
    if (soundRef.current) {
      let newVolume = scrollerPosition > 1 && scrollerPosition != 100 ? scrollerPosition / 100 : scrollerPosition;
      // Clamp volume between 0 and 1
      newVolume = Math.max(0, Math.min(1, newVolume)); 
      soundRef.current.setVolume(newVolume);
      volumeRef.current = newVolume;
    }
  }, [scrollerPosition]);

  return (
    <>
    <div 
      style={{ 
        width: `${width}px`, 
        height: `${height}px`,
        position: 'relative', // Keep relative positioning for absolute children
        backgroundColor: '#212121' // Background color remains
      }}
    >
      {/* Three.js canvas container */}
      <div style={{ pointerEvents: (isLoaded && isLoaded2) ? 'auto' : 'none' }}>
        <div 
          style={{ 
            width: '100%', 
            height: '100%',
            opacity: (isLoaded && isLoaded2) ? 1 : 0,
            transition: 'opacity 0.5s ease-in-out'
          }} 
          ref={mountRef} 
        />
      </div>
      
      {(isLoaded && isLoaded2) && (
        <>
          {/* Audio controls container */}
          <div 
            style={{
              position: 'absolute',
              bottom: '0px',
              left: '0px',
              right: '0px',
              backgroundColor: 'rgba(0, 0, 0, 0.6)', // bg-black/60
              padding: '0.5rem', // p-2
              display: 'flex', // flex
              flexDirection: 'column' // flex-col
            }}
          >
            {/* Timeline slider */}
            <div 
              style={{
                display: 'flex', // flex
                alignItems: 'center', // items-center
                width: '100%', // w-full
                marginBottom: '0.25rem' // mb-1
              }}
            >
              <span 
                style={{
                  color: 'white', // text-white
                  fontSize: '0.75rem', // text-xs
                  // lineHeight: '1rem', // text-xs includes line-height, add if needed
                  marginRight: '0.5rem' // mr-2
                }}
              >
                {formatTime(currentTime)}
              </span>
              <input
                type="range"
                min="0"
                max={duration}
                value={currentTime}
               onChange={()=>{}}
                // className removed
                style={{
                  width: '100%', // w-full
                  height: '0.25rem', // h-1
                  borderRadius: '0.5rem', // rounded-lg
                  appearance: 'none', // appearance-none
                  cursor: 'pointer', // cursor-pointer
                  // background color is handled by the gradient below
                  // backgroundColor: '#4B5563', // bg-gray-600 (fallback, but gradient overrides)
                  background: `linear-gradient(to right, #4a9eff ${(currentTime / duration) * 100}%, #666 ${(currentTime / duration) * 100}%)`
                }}
              />
              <span 
                style={{
                  color: 'white', // text-white
                  fontSize: '0.75rem', // text-xs
                  // lineHeight: '1rem', 
                  marginLeft: '0.5rem' // ml-2
                }}
              >
                {formatTime(duration)}
              </span>
            </div>
            {/* Play/pause button container */}
            <div 
              style={{
                display: 'flex', // flex
                justifyContent: 'center' // justify-center
              }}
            >
              <button
                onClick={togglePlayPause}
                // className removed
                style={{
                  backgroundColor: '#2563EB', // bg-blue-600
                  // hover:bg-blue-700 cannot be applied inline
                  color: 'white', // text-white
                  borderRadius: '9999px', // rounded-full
                  width: '2rem', // w-8
                  height: '2rem', // h-8
                  display: 'flex', // flex
                  alignItems: 'center', // items-center
                  justifyContent: 'center', // justify-center
                  outline: 'none', // focus:outline-none (applied directly)
                  border: 'none', // Add border:none for typical button reset
                  cursor: 'pointer' // Add cursor pointer for button affordance
                }}
                // Adding basic hover effect via JS (optional, CSS classes are better)
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1D4ED8'} // Approx blue-700
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563EB'} // Back to blue-600
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="currentColor" 
                  // className removed
                  style={{
                    width: '1.25rem', // w-5
                    height: '1.25rem' // h-5
                  }}
                >
                  {isPlaying ? (
                    // Pause icon
                    <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" />
                  ) : (
                    // Play icon
                    <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </>
      )}
       
    </div>
 
    </>
  );
};

export default AudioVisualizerShader;