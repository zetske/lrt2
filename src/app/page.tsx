"use client";

import WebGLCanvas from "./Canvas";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <div className="z-0 absolute w-screen h-screen inset-0 grid justify-center items-center">
        <WebGLCanvas />
      </div>
      <div className="z-10 text-center space-y-3" style={{ textShadow: '2px 2px 4px white' }}>
        {/* <h1 className="text-5xl leading-10">The new standard in LRT rewards.</h1> */}
        {/* <h3 className="text-xl leading-10">Learn about LRT²</h3> */}
        <h3 className="text-xl leading-10">LRT²</h3>
      </div>
    </main>
  );
}
