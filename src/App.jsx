import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function App() {
  // State for the 50 boxes (1-50)
  const [boxStates, setBoxStates] = useState(() => {
    // Initialize all boxes as unscratched (0)
    const initialState = {}
    for (let i = 1; i <= 50; i++) {
      initialState[i] = 0 // 0 = unscratched, 1 = red/green scratch, 2 = chase, 3 = reset
    }
    return initialState
  })

  // State for uploaded background image
  const [backgroundImage, setBackgroundImage] = useState(null)
  
  // State for pokeball rain
  const [pokeballRain, setPokeballRain] = useState(false)
  const [pokeballs, setPokeballs] = useState([])
  const [rainInterval, setRainInterval] = useState(null)

  // Handle box click with 3-state cycle
  const handleBoxClick = (boxNumber) => {
    setBoxStates(prev => ({
      ...prev,
      [boxNumber]: (prev[boxNumber] + 1) % 3
    }))
  }

  // Handle image upload for background
  const handleImageUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setBackgroundImage(e.target.result)
      }
      reader.readAsDataURL(file)
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

  // Get box styling based on state
  const getBoxStyling = (state) => {
    switch (state) {
      case 0: // Unscratched - white/gray
        return 'bg-gray-200 text-black border-gray-800'
      case 1: // First click - green scratch
        return 'bg-green-600 text-white border-gray-800'
      case 2: // Second click - red scratch
        return 'bg-red-600 text-white border-gray-800'
      default: // Reset to unscratched
        return 'bg-gray-200 text-black border-gray-800'
    }
  }

  return (
    <div className="min-h-screen p-4" style={{
      backgroundImage: backgroundImage ? 
        `url(${backgroundImage})` :
        `
          linear-gradient(45deg, transparent 25%, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.1) 50%, transparent 50%, transparent 75%, rgba(255,255,255,0.1) 75%),
          linear-gradient(-45deg, transparent 25%, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.05) 50%, transparent 50%, transparent 75%, rgba(255,255,255,0.05) 75%),
          linear-gradient(to bottom, #2d1b69, #1e3a8a, #1e40af, #3b82f6)
        `,
      backgroundSize: backgroundImage ? 'cover' : '20px 20px, 20px 20px, 100% 100%',
      backgroundPosition: backgroundImage ? 'center' : 'initial',
      backgroundRepeat: backgroundImage ? 'no-repeat' : 'initial',
      backgroundColor: '#1e3a8a'
    }}>
      <div className="max-w-4xl mx-auto">
        {/* Header with Mewtwo sprite */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-4 mb-4">
            {/* Left Mewtwo - Pokeball rain toggle */}
            <div className="relative">
              <motion.img 
                src="/150.gif"
                alt="Mewtwo Rain Toggle"
                className={`w-20 h-20 object-contain cursor-pointer ${pokeballRain ? 'ring-4 ring-red-400 rounded-full' : ''}`}
                animate={{ 
                  y: [0, -10, 0],
                  rotate: [0, -5, 5, 0]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Rain toggle clicked');
                  togglePokeballRain();
                }}
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-black/20 transition-all duration-200 flex items-center justify-center rounded-lg pointer-events-none">
                <span className="text-white text-sm font-bold opacity-0 hover:opacity-100 transition-opacity bg-black/50 px-2 py-1 rounded">
                  Rain
                </span>
              </div>
            </div>
            
            <div>
              <h1 className="text-6xl font-black text-yellow-400 mb-2" style={{
                fontFamily: 'Impact, Arial Black, sans-serif',
                textShadow: '4px 4px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000'
              }}>
                PackPopShop
              </h1>
              <h2 className="text-3xl font-bold text-white mb-1" style={{
                fontFamily: 'Arial Black, sans-serif',
                textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000'
              }}>
                SLAB BOX
              </h2>
              <h3 className="text-xl font-semibold text-gray-300" style={{
                fontFamily: 'Arial, sans-serif',
                textShadow: '1px 1px 0 #000'
              }}>
                2 FLOORS INSURANCE
              </h3>
            </div>
            
            {/* Right Mewtwo - Background upload */}
            <div className="relative">
              <motion.img 
                src="/150.gif"
                alt="Mewtwo Background Upload"
                className="w-20 h-20 object-contain cursor-pointer"
                animate={{ 
                  y: [0, -10, 0],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1.5
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Background upload clicked');
                  document.getElementById('imageUpload').click();
                }}
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-black/20 transition-all duration-200 flex items-center justify-center rounded-lg pointer-events-none">
                <span className="text-white text-sm font-bold opacity-0 hover:opacity-100 transition-opacity bg-black/50 px-2 py-1 rounded">
                  BG
                </span>
              </div>
              <input
                id="imageUpload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Main grid - 50 boxes in 10x5 layout with no spacing */}
        <div className="bg-white p-4 rounded-lg shadow-2xl">
          <div className="grid grid-cols-10 gap-0 border-2 border-gray-800">
            {Array.from({ length: 50 }, (_, i) => i + 1).map(number => (
              <motion.div
                key={number}
                onClick={() => handleBoxClick(number)}
                className={`
                  relative flex items-center justify-center 
                  cursor-pointer font-bold text-lg
                  h-16 w-full border border-gray-800
                  transition-all duration-200
                  ${getBoxStyling(boxStates[number])}
                  hover:scale-105 hover:z-10
                `}
                whileTap={{ scale: 0.95 }}
              >
                {/* Box number - hide when scratched */}
                <span className={`relative z-10 select-none transition-opacity duration-200 ${
                  boxStates[number] === 1 || boxStates[number] === 2 ? 'opacity-0' : 'opacity-100'
                }`}>
                  {number}
                </span>
                
                {/* Green brush stroke scratch effect for state 1 */}
                {boxStates[number] === 1 && (
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute inset-0 bg-green-600"></div>
                    <div className="absolute top-1 left-2 w-8 h-1 bg-green-400 transform rotate-12 rounded-full opacity-80"></div>
                    <div className="absolute top-3 right-1 w-6 h-1 bg-green-500 transform -rotate-45 rounded-full opacity-70"></div>
                    <div className="absolute bottom-2 left-1 w-10 h-1 bg-green-300 transform rotate-45 rounded-full opacity-90"></div>
                    <div className="absolute bottom-1 right-3 w-4 h-1 bg-green-400 transform -rotate-12 rounded-full opacity-75"></div>
                    <div className="absolute top-2 left-4 w-3 h-1 bg-green-200 transform rotate-75 rounded-full opacity-85"></div>
                    <div className="absolute bottom-3 left-6 w-5 h-1 bg-green-500 transform -rotate-30 rounded-full opacity-80"></div>
                  </div>
                )}
                
                {/* Red brush stroke scratch effect for state 2 */}
                {boxStates[number] === 2 && (
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute inset-0 bg-red-600"></div>
                    <div className="absolute top-1 left-1 w-9 h-1 bg-red-400 transform rotate-15 rounded-full opacity-80"></div>
                    <div className="absolute top-4 right-2 w-7 h-1 bg-red-500 transform -rotate-30 rounded-full opacity-70"></div>
                    <div className="absolute bottom-1 left-3 w-8 h-1 bg-red-300 transform rotate-60 rounded-full opacity-90"></div>
                    <div className="absolute bottom-3 right-1 w-5 h-1 bg-red-400 transform -rotate-15 rounded-full opacity-75"></div>
                    <div className="absolute top-3 left-5 w-4 h-1 bg-red-200 transform rotate-90 rounded-full opacity-85"></div>
                    <div className="absolute bottom-2 left-7 w-6 h-1 bg-red-500 transform -rotate-45 rounded-full opacity-80"></div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

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
    </div>
  )
}

export default App
