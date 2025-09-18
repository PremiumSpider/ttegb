import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function PackPopShop({ backgroundImage, pokeballRain, togglePokeballRain, onImageUpload }) {
  // State for edit mode
  const [isEditMode, setIsEditMode] = useState(false)
  
  // State for bag count
  const [bagCount, setBagCount] = useState(50)
  
  // State for the boxes (dynamic count)
  const [boxStates, setBoxStates] = useState(() => {
    // Initialize all boxes as unscratched (0)
    const initialState = {}
    for (let i = 1; i <= 50; i++) {
      initialState[i] = 0 // 0 = unscratched, 1 = red/green scratch, 2 = chase, 3 = reset
    }
    return initialState
  })

  // State for font size control (0-7, where 2 is now default - increased by 2 levels)
  const [fontSizeLevel, setFontSizeLevel] = useState(2)
  
  // State for orientation detection
  const [orientation, setOrientation] = useState(
    window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
  )

  // Handle box click with 3-state cycle
  const handleBoxClick = (boxNumber) => {
    setBoxStates(prev => ({
      ...prev,
      [boxNumber]: (prev[boxNumber] + 1) % 3
    }))
  }

  // Font size control functions
  const handleFontSizeChange = (increment) => {
    setFontSizeLevel(prev => Math.max(0, Math.min(7, prev + increment)))
  }

  // Bag count control functions
  const handleBagCountChange = (increment) => {
    const newCount = Math.max(1, Math.min(100, bagCount + increment))
    setBagCount(newCount)
    
    // Update box states for new count
    if (increment > 0) {
      // Adding boxes
      setBoxStates(prev => {
        const newStates = { ...prev }
        for (let i = bagCount + 1; i <= newCount; i++) {
          newStates[i] = 0
        }
        return newStates
      })
    } else {
      // Removing boxes
      setBoxStates(prev => {
        const newStates = { ...prev }
        for (let i = newCount + 1; i <= bagCount; i++) {
          delete newStates[i]
        }
        return newStates
      })
    }
  }

  // Get font size class based on level (0-7, where 0 is default - equivalent to old level 4)
  const getFontSizeClass = () => {
    const fontSizes = [
      'text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl',     // Level 0 - default (old level 4)
      'text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl',    // Level 1 - larger
      'text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl',   // Level 2 - even larger
      'text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl',   // Level 3 - very large
      'text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl',   // Level 4 - huge
      'text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl',   // Level 5 - massive
      'text-6xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-10xl',  // Level 6 - enormous
      'text-7xl sm:text-8xl md:text-9xl lg:text-10xl xl:text-11xl'  // Level 7 - gigantic
    ]
    return fontSizes[fontSizeLevel]
  }

  // Detect orientation changes
  useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(window.innerWidth > window.innerHeight ? 'landscape' : 'portrait')
    }

    window.addEventListener('resize', handleOrientationChange)
    window.addEventListener('orientationchange', handleOrientationChange)

    return () => {
      window.removeEventListener('resize', handleOrientationChange)
      window.removeEventListener('orientationchange', handleOrientationChange)
    }
  }, [])

  // Get box styling based on state
  const getBoxStyling = (state) => {
    switch (state) {
      case 0: // Unscratched - black background with purple-red text
        return 'bg-black text-purple-400 border-gray-800'
      case 1: // First click - green scratch (chase)
        return 'bg-green-600 text-white border-gray-800'
      case 2: // Second click - red scratch (bag)
        return 'bg-red-600 text-white border-gray-800'
      default: // Reset to unscratched
        return 'bg-black text-purple-400 border-gray-800'
    }
  }

  // Get box content based on state
  const getBoxContent = (number, state) => {
    // Always show the number regardless of state
    return number
  }


  return (
    <div className="h-screen p-[3%]">
      <div className="h-full bg-white/10 backdrop-blur-md rounded-2xl shadow-xl flex flex-col">
        
        {/* Header Section with Mewtwo sprites */}
        <div className="p-2">
          <div className="flex items-center justify-center gap-4 mb-2">
            {/* Left Mewtwo - Pokeball rain toggle */}
            <motion.img 
              src="/150.gif"
              alt="Mewtwo Rain Toggle"
              className={`w-16 h-16 object-contain cursor-pointer ${pokeballRain ? 'ring-4 ring-red-400 rounded-full' : ''}`}
              animate={{ 
                y: [0, -8, 0],
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
            
            {/* Title Section */}
            <div className="text-center">
              <h1 
                className="text-2xl sm:text-3xl md:text-4xl font-black text-yellow-400 mb-1 cursor-pointer hover:text-yellow-300 transition-colors" 
                style={{
                  fontFamily: 'Impact, Arial Black, sans-serif',
                  textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000'
                }}
                onClick={() => {
                  console.log('PackPopShop clicked, current isEditMode:', isEditMode);
                  setIsEditMode(!isEditMode);
                }}
              >
                PackPopShop
              </h1>
              <h2 
                className="text-sm sm:text-base md:text-lg font-bold text-white mb-1" 
                style={{
                  fontFamily: 'Arial Black, sans-serif',
                  textShadow: '1px 1px 0 #000'
                }}
              >
                SLAB BOX
              </h2>
              <h3 
                className="text-xs sm:text-sm font-semibold text-gray-300" 
                style={{
                  fontFamily: 'Arial, sans-serif',
                  textShadow: '1px 1px 0 #000'
                }}
              >
                2 FLOORS INSURANCE
              </h3>
            </div>
            
            {/* Right Mewtwo - Background upload */}
            <motion.img 
              src="/150.gif"
              alt="Mewtwo Background Upload"
              className="w-16 h-16 object-contain cursor-pointer"
              animate={{ 
                y: [0, -8, 0],
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
            <input
              id="imageUpload"
              type="file"
              accept="image/*"
              onChange={onImageUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* Edit Mode Controls */}
        <AnimatePresence mode="wait">
          {isEditMode && (
            <motion.div
              key="controls"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-wrap items-center justify-center gap-4 mx-2 mb-2 bg-black/30 backdrop-blur-sm p-3 rounded-xl"
            >
              {/* Font Size Controls */}
              <div className="flex items-center gap-2">
                <span className="text-white font-medium text-sm">Font:</span>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleFontSizeChange(-1)}
                  disabled={fontSizeLevel === 0}
                  className={`w-10 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors ${
                    fontSizeLevel === 0 
                      ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed' 
                      : 'bg-red-600/80 hover:bg-red-500/80 text-white'
                  }`}
                >
                  -T
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleFontSizeChange(1)}
                  disabled={fontSizeLevel === 7}
                  className={`w-10 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors ${
                    fontSizeLevel === 7 
                      ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed' 
                      : 'bg-green-600/80 hover:bg-green-500/80 text-white'
                  }`}
                >
                  +T
                </motion.button>
              </div>

              {/* Bag Count Controls */}
              <div className="flex items-center gap-2">
                <span className="text-white font-medium text-sm">Bags:</span>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleBagCountChange(-1)}
                  disabled={bagCount === 1}
                  className={`w-10 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors ${
                    bagCount === 1 
                      ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed' 
                      : 'bg-red-600/80 hover:bg-red-500/80 text-white'
                  }`}
                >
                  -B
                </motion.button>
                
                <span className="text-white font-bold w-8 text-center text-sm">{bagCount}</span>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleBagCountChange(1)}
                  disabled={bagCount === 100}
                  className={`w-10 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors ${
                    bagCount === 100 
                      ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed' 
                      : 'bg-green-600/80 hover:bg-green-500/80 text-white'
                  }`}
                >
                  +B
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Grid - Full Screen Layout with 5 columns */}
        <div className="flex-1 p-1 overflow-hidden">
          <div className="grid grid-cols-5 gap-1 h-full">
            {Array.from({ length: bagCount }, (_, i) => i + 1).map(number => (
              <motion.div
                key={number}
                onClick={() => handleBoxClick(number)}
                className={`
                  relative flex items-center justify-center 
                  rounded-xl cursor-pointer font-black
                  min-h-[3rem] sm:min-h-[3.5rem] md:min-h-[4rem] lg:min-h-[4.5rem] xl:min-h-[5rem]
                  ${getFontSizeClass()}
                  ${getBoxStyling(boxStates[number])}
                  shadow-md transition-all duration-300
                `}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Box content - show number only when unscratched */}
                <span className={`relative z-10 select-none font-bold transition-opacity duration-300 ${
                  boxStates[number] === 1 || boxStates[number] === 2 ? 'opacity-0' : 'opacity-100'
                }`}>
                  {getBoxContent(number, boxStates[number])}
                </span>
                
                {/* Green brush stroke scratch effect for state 1 */}
                {boxStates[number] === 1 && (
                  <div className="absolute inset-0 overflow-hidden rounded-xl">
                    <div className="absolute inset-0 bg-green-600 rounded-xl"></div>
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
                  <div className="absolute inset-0 overflow-hidden rounded-xl">
                    <div className="absolute inset-0 bg-red-600 rounded-xl"></div>
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
      </div>
    </div>
  )
}

export default PackPopShop
