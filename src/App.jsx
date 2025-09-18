import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import PackPopShop from './PackPopShop'

function App() {
  // State for uploaded background image
  const [backgroundImage, setBackgroundImage] = useState('/orchids.jpg')
  const [isCustomBackground, setIsCustomBackground] = useState(false)
  
  // State for pokeball rain
  const [pokeballRain, setPokeballRain] = useState(false)
  const [pokeballs, setPokeballs] = useState([])
  const [rainInterval, setRainInterval] = useState(null)

  // Handle image upload for background
  const handleImageUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setBackgroundImage(e.target.result)
        setIsCustomBackground(true)
      }
      reader.readAsDataURL(file)
    }
  }

  // Toggle between default backgrounds
  const toggleDefaultBackground = () => {
    // If currently using a custom background, switch to orchids first
    if (isCustomBackground) {
      setBackgroundImage('/orchids.jpg')
      setIsCustomBackground(false)
    } else {
      // Toggle between orchids and flamers
      setBackgroundImage(backgroundImage === '/orchids.jpg' ? '/flamers.webp' : '/orchids.jpg')
    }
  }

  // Toggle pokeball rain
  const togglePokeballRain = () => {
    if (!pokeballRain) {
      // Start rain
      setPokeballRain(true)
      const interval = setInterval(() => {
        const newPokeball = {
          id: Date.now() + Math.random(),
          x: Math.random() * window.innerWidth,
          y: -50,
          sprite: Math.floor(Math.random() * 26) + 1, // pokeball_01.png to pokeball_26.png
          rotation: Math.random() * 360,
          speed: 2 + Math.random() * 3
        }
        
        setPokeballs(prev => [...prev, newPokeball])
      }, 300)
      setRainInterval(interval)
    } else {
      // Stop rain
      setPokeballRain(false)
      if (rainInterval) {
        clearInterval(rainInterval)
        setRainInterval(null)
      }
      // Clear existing pokeballs after a delay
      setTimeout(() => {
        setPokeballs([])
      }, 3000)
    }
  }

  // Animate falling pokeballs
  useEffect(() => {
    if (pokeballs.length > 0) {
      const animationInterval = setInterval(() => {
        setPokeballs(prev => 
          prev.map(pokeball => ({
            ...pokeball,
            y: pokeball.y + pokeball.speed,
            rotation: pokeball.rotation + 2
          })).filter(pokeball => pokeball.y < window.innerHeight + 100)
        )
      }, 16) // ~60fps

      return () => clearInterval(animationInterval)
    }
  }, [pokeballs.length])

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (rainInterval) {
        clearInterval(rainInterval)
      }
    }
  }, [rainInterval])

  return (
    <div className="min-h-screen relative" style={{
      backgroundImage: backgroundImage ? 
        `url(${backgroundImage})` :
        `linear-gradient(to bottom right, #8b5cf6, #06b6d4, #10b981)`,
      backgroundSize: backgroundImage ? 'cover' : '100% 100%',
      backgroundPosition: backgroundImage ? 'center' : 'initial',
      backgroundRepeat: backgroundImage ? 'no-repeat' : 'initial'
    }}>
      {/* PackPopShop component with Mewtwo sprites passed as props */}
      <PackPopShop 
        backgroundImage={backgroundImage}
        pokeballRain={pokeballRain}
        togglePokeballRain={togglePokeballRain}
        onImageUpload={handleImageUpload}
        toggleDefaultBackground={toggleDefaultBackground}
        isCustomBackground={isCustomBackground}
      />

      {/* Pokeball Rain */}
      {pokeballs.map(pokeball => (
        <div
          key={pokeball.id}
          className="fixed pointer-events-none z-10"
          style={{
            left: `${pokeball.x}px`,
            top: `${pokeball.y}px`,
            transform: `rotate(${pokeball.rotation}deg)`,
            width: '30px',
            height: '30px'
          }}
        >
          <img
            src={`/final_pokeball_sprites/pokeball_${pokeball.sprite.toString().padStart(2, '0')}.png`}
            alt="Pokeball"
            className="w-full h-full object-contain"
          />
        </div>
      ))}
    </div>
  )
}

export default App
