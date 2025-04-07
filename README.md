# Audio Visualizer
![ScreenRecording2025-04-07at1 29 40PM-ezgif com-optimize](https://github.com/user-attachments/assets/94334677-7d35-4c8b-a57a-a0690ba6f32f)


A React component that creates interactive 3D audio visualizations with Three.js and WebGL shaders.

## Overview

This package creates immersive 3D visualizations that respond to audio frequencies in real-time. It features:

- 3D icosahedron mesh that deforms based on audio frequencies
- WebGL shader-based animations
- Interactive camera controls with mouse movement
- Audio playback controls with timeline
- Customizable colors and dimensions
- Bloom post-processing effects

## Installation

```bash
npm i @dafilabs/audio-visualizer
# or
yarn add @dafilabs/audio-visualizer
```

### Dependencies

This package requires the following dependencies:

- React
- Three.js
- React Hooks (useState, useEffect, useRef)

## Basic Usage

```jsx
import { AudioVisualizer } from 'audio-visualizer-3d';

function App() {
  return (
    <div className="app">
      <h1>Audio Visualizer Demo</h1>
      <AudioVisualizer 
        src="/path/to/audio.mp3"
        width={600}
        height={400}
      />
    </div>
  );
}

export default App;
```

## API Reference

### AudioVisualizer Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `src` | string | (Required) | Path to the audio file to visualize |
| `width` | number | 400 | Width of the visualizer in pixels |
| `height` | number | 400 | Height of the visualizer in pixels |
| `uniforms` | object | See below | Custom shader uniforms for visualization |

#### Default uniforms:

```javascript
{
  u_time: { value: 0.0 },
  u_frequency: { value: 0.0 },
  u_red: { value: 0.61 },
  u_green: { value: 0.61 },
  u_blue: { value: 0.89 }
}
```

## Advanced Configuration

You can customize the appearance by providing custom uniform values:

```jsx
import { AudioVisualizer } from 'audio-visualizer-3d';

function App() {
  const customUniforms = {
    u_time: { value: 0.0 },
    u_frequency: { value: 0.0 },
    u_red: { value: 0.8 },    // More red
    u_green: { value: 0.3 },  // Less green
    u_blue: { value: 0.9 }    // More blue
  };

  return (
    <AudioVisualizer 
      src="/path/to/audio.mp3"
      width={800}
      height={600}
      uniforms={customUniforms}
    />
  );
}
```

## Under the Hood

The package consists of two main components:

1. `AudioVisualizer` - A simplified wrapper component that handles state and default values
2. `AudioVisualizerShader` - The core component that integrates Three.js, shaders, and audio analysis

### The Visualization Process

1. Audio is loaded and analyzed using Three.js's `AudioAnalyser`
2. Frequency data is passed to shader uniforms
3. The vertex shader deforms a 3D icosahedron mesh based on Perlin noise and frequency data
4. The fragment shader applies color based on RGB uniform values
5. Post-processing adds bloom effects for enhanced visuals
6. Camera position responds to mouse movement for interactive experience

### Shader Details

The visualizer uses two main shaders:

#### Vertex Shader
Deforms the mesh using Perlin noise techniques, creating dynamic movement based on audio frequency.

#### Fragment Shader
Applies color to the mesh based on the RGB uniform values provided.

## Performance Tips

- Adjust dimensions for performance on lower-end devices
- For mobile, consider using smaller dimensions (300x300 or less)
- Larger audio files may take longer to load and analyze

## Troubleshooting

### Common Issues

1. **Audio doesn't play on initial load**
   - Browser policies often require user interaction before audio can play
   - Add a play button or user interaction trigger

2. **Performance issues**
   - Reduce the size of the visualizer
   - Use simpler audio files (smaller size, lower bitrate)

3. **Loading indicator never disappears**
   - Check that the audio file path is correct
   - Ensure audio format is supported by the browser

## Browser Support

- Chrome 49+
- Firefox 45+
- Safari 12+
- Edge 79+

WebGL and Web Audio API support required.
