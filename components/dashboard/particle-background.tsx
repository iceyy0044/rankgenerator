"use client"

import { useEffect, useRef } from "react"
import * as PIXI from "pixi.js"
import { Emitter } from "@pixi/particle-emitter"

const ParticleBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (typeof window !== "undefined" && canvasRef.current) {
      const app = new PIXI.Application({
        view: canvasRef.current,
        resizeTo: window,
        backgroundAlpha: 0,
        autoDensity: true,
        resolution: window.devicePixelRatio || 1,
      })

      const particleContainer = new PIXI.ParticleContainer()
      app.stage.addChild(particleContainer)

      const emitter = new Emitter(
        particleContainer,
        {
          lifetime: {
            min: 20,
            max: 50,
          },
          frequency: 0.008,
          spawnChance: 1,
          particlesPerWave: 1,
          emitterLifetime: -1,
          maxParticles: 1000,
          pos: {
            x: 0,
            y: 0,
          },
          addAtBack: false,
          behaviors: [
            {
              type: "alpha",
              config: {
                alpha: {
                  list: [
                    { value: 0, time: 0 },
                    { value: 0.1, time: 0.1 },
                    { value: 0, time: 1 },
                  ],
                },
              },
            },
            {
              type: "scale",
              config: {
                scale: {
                  list: [
                    { value: 0.1, time: 0 },
                    { value: 0.3, time: 1 },
                  ],
                },
              },
            },
            {
              type: "moveSpeed",
              config: {
                speed: {
                  list: [
                    { value: 20, time: 0 },
                    { value: 10, time: 1 },
                  ],
                  isStepped: false,
                },
              },
            },
            {
              type: "rotation",
              config: {
                accel: 0,
                minStart: 0,
                maxStart: 360,
                minSpeed: 0,
                maxSpeed: 0,
              },
            },
            {
              type: "spawnShape",
              config: {
                type: "rect",
                data: {
                  x: 0,
                  y: 0,
                  width: window.innerWidth,
                  height: window.innerHeight,
                },
              },
            },
          ],
        }
      )

      let elapsed = Date.now()

      const tick = () => {
        const now = Date.now()
        emitter.update((now - elapsed) * 0.001)
        elapsed = now
        requestAnimationFrame(tick)
      }

      PIXI.Assets.load("/icon.svg").then((texture) => {
        emitter.particleImages = [texture]
        emitter.emit = true
        tick()
      })

      return () => {
        app.destroy()
      }
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full z-0"
    />
  )
}

export default ParticleBackground
