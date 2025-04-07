


import AudioVisiualizerShader from "./AudioVisualizer";
import { useState } from "react";

interface AudioVisualizerProps {
  src: string;
  width?: number;
  height?: number;
  uniforms?: {
    u_time: { value: number };
    u_frequency: { value: number };
    u_red: { value: number };
    u_green: { value: number };
    u_blue: { value: number };
  };
}

export default function AduioVisualizer(props: AudioVisualizerProps) {
  const value1 = {
    u_time: { value: 0.0 },
    u_frequency: { value: 0.0 },
    u_red: { value: 0.61 },
    u_green: { value: 0.61 },
    u_blue: { value: 0.89 },
  };

  const value2 = {
    u_time: { value: 0.0 },
    u_frequency: { value: 0.0 },
    u_red: { value: 0.4 },
    u_green: { value: 0.71 },
    u_blue: { value: 1 },
  };
  const [isLoaded,setIsLoaded]=useState<boolean>(false);
  const [isLoaded2,setIsLoaded2]=useState<boolean>(false);
  return (
    <div >
 <AudioVisiualizerShader
                 type="small"
                key={props.src}
                uniforms={props?.uniforms? props.uniforms : value1}
                width={props.width ? props.width : 400}
                height={props.height ? props.height : 400}
                src={props.src}
                scrollerPosition={false ? 0 :70 / 100}
                isLoaded={isLoaded}
                isLoaded2={isLoaded2}
                setIsLoaded={setIsLoaded}
                setIsLoaded2={setIsLoaded2}
                index={0}
              />
     
    </div>
  );
}