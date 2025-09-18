import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function PackPopShop({ backgroundImage, pokeballRain, togglePokeballRain, onImageUpload, toggleDefaultBackground, isCustomBackground }) {
  // Load configuration from localStorage
  const loadConfig = () => {
    try {
      const savedConfig = localStorage.getItem('packPopShopConfig')
      if (savedConfig) {
        return JSON.parse(savedConfig)
      }
    } catch (error) {
      console.error('Error loading config:', error)
    }
    return null
  }

  // Save configuration to localStorage
  const saveConfig = (config) => {
    try {
      localStorage.setItem('packPopShopConfig', JSON.stringify(config))
    } catch (error) {
      console.error('Error saving config:', error)
    }
  }

  // State for edit mode
  const [isEditMode, setIsEditMode] = useState(false)
  
  // State for bag count
  const [bagCount, setBagCount] = useState(() => {
    const config = loadConfig()
    return config?.bagCount || 50
  })
  
  // State for the boxes (dynamic count)
  const [boxStates, setBoxStates] = useState(() => {
    const config = loadConfig()
    if (config?.boxStates) {
      return config.boxStates
    }
    // Initialize all boxes as unscratched (0)
    const initialState = {}
    const count = config?.bagCount || 50
    for (let i = 1; i <= count; i++) {
      initialState[i] = 0 // 0 = unscratched, 1 = red/green scratch, 2 = chase, 3 = reset
    }
    return initialState
  })

  // State for font size control (0-7, where 2 is now default - increased by 2 levels)
  const [fontSizeLevel, setFontSizeLevel] = useState(() => {
    const config = loadConfig()
    return config?.fontSizeLevel || 2
  })

  // State for font family control (0 = default, 1 = Comic Sans, 2 = Papyrus)
  const [fontFamily, setFontFamily] = useState(() => {
    const config = loadConfig()
    return config?.fontFamily || 0
  })

  // State for text color control (0 = white, 1 = yellow, 2 = purple)
  const [textColor, setTextColor] = useState(() => {
    const config = loadConfig()
    return config?.textColor || 0
  })
  
  // State for orientation detection
  const [orientation, setOrientation] = useState(
    window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
  )

  // Handle box click with 3-state cycle
  const handleBoxClick = (boxNumber) => {
    setBoxStates(prev => {
      const newStates = {
        ...prev,
        [boxNumber]: (prev[boxNumber] + 1) % 3
      }
      // Save to localStorage
      saveConfig({
        bagCount,
        fontSizeLevel,
        fontFamily,
        textColor,
        boxStates: newStates
      })
      return newStates
    })
  }

  // Font size control functions
  const handleFontSizeChange = (increment) => {
    setFontSizeLevel(prev => {
      const newLevel = Math.max(0, Math.min(7, prev + increment))
      // Save to localStorage
      saveConfig({
        bagCount,
        fontSizeLevel: newLevel,
        fontFamily,
        textColor,
        boxStates
      })
      return newLevel
    })
  }

  // Bag count control functions
  const handleBagCountChange = (increment) => {
    const newCount = Math.max(1, Math.min(100, bagCount + increment))
    setBagCount(newCount)
    
    // Update box states for new count
    let newStates
    if (increment > 0) {
      // Adding boxes
      setBoxStates(prev => {
        newStates = { ...prev }
        for (let i = bagCount + 1; i <= newCount; i++) {
          newStates[i] = 0
        }
        // Save to localStorage
        saveConfig({
          bagCount: newCount,
          fontSizeLevel,
          fontFamily,
          textColor,
          boxStates: newStates
        })
        return newStates
      })
    } else {
      // Removing boxes
      setBoxStates(prev => {
        newStates = { ...prev }
        for (let i = newCount + 1; i <= bagCount; i++) {
          delete newStates[i]
        }
        // Save to localStorage
        saveConfig({
          bagCount: newCount,
          fontSizeLevel,
          fontFamily,
          textColor,
          boxStates: newStates
        })
        return newStates
      })
    }
  }

  // Font family control function
  const handleFontFamilyChange = () => {
    setFontFamily(prev => {
      const newFamily = (prev + 1) % 3
      // Save to localStorage
      saveConfig({
        bagCount,
        fontSizeLevel,
        fontFamily: newFamily,
        textColor,
        boxStates
      })
      return newFamily
    })
  }

  // Text color control function
  const handleTextColorChange = () => {
    setTextColor(prev => {
      const newColor = (prev + 1) % 3
      // Save to localStorage
      saveConfig({
        bagCount,
        fontSizeLevel,
        fontFamily,
        textColor: newColor,
        boxStates
      })
      return newColor
    })
  }

  // Reset function
  const handleReset = () => {
    if (confirm('Are you sure you want to reset all boxes and settings? This cannot be undone.')) {
      const defaultBagCount = 50
      const defaultFontSize = 2
      const defaultFontFamily = 0
      const defaultTextColor = 0
      const defaultBoxStates = {}
      
      // Initialize default box states
      for (let i = 1; i <= defaultBagCount; i++) {
        defaultBoxStates[i] = 0
      }
      
      // Reset all states
      setBagCount(defaultBagCount)
      setFontSizeLevel(defaultFontSize)
      setFontFamily(defaultFontFamily)
      setTextColor(defaultTextColor)
      setBoxStates(defaultBoxStates)
      
      // Save to localStorage
      saveConfig({
        bagCount: defaultBagCount,
        fontSizeLevel: defaultFontSize,
        fontFamily: defaultFontFamily,
        textColor: defaultTextColor,
        boxStates: defaultBoxStates
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

  // Get font family style based on selection
  const getFontFamilyStyle = () => {
    const fontFamilies = [
      {}, // Default - no specific font family
      { fontFamily: '"Comic Sans MS", cursive, sans-serif' }, // Comic Sans
      { fontFamily: 'Papyrus, fantasy, cursive' } // Papyrus
    ]
    return fontFamilies[fontFamily]
  }

  // Get font family name for display
  const getFontFamilyName = () => {
    const names = ['Default', 'Comic', 'Papyrus']
    return names[fontFamily]
  }

  // Get text color class based on selection
  const getTextColorClass = () => {
    const colors = ['text-white', 'text-yellow-400', 'text-purple-400']
    return colors[textColor]
  }

  // Get text color name for display
  const getTextColorName = () => {
    const names = ['White', 'Yellow', 'Purple']
    return names[textColor]
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
      case 0: // Unscratched - black background with dynamic text color
        return `bg-black ${getTextColorClass()} border-gray-800`
      case 1: // First click - red scratch (bag)
        return 'bg-red-600 text-white border-gray-800'
      case 2: // Second click - green scratch (chase)
        return 'bg-green-600 text-white border-gray-800'
      default: // Reset to unscratched
        return `bg-black ${getTextColorClass()} border-gray-800`
    }
  }

  // Get box content based on state
  const getBoxContent = (number, state) => {
    // Always show the number regardless of state
    return number
  }


  return (
    <div className={`h-screen ${!backgroundImage ? 'bg-gradient-to-br from-green-100 via-emerald-200 to-green-300' : ''}`}>
      <div className="h-full bg-white/10 backdrop-blur-md rounded-2xl shadow-xl">
        <div className="h-full flex flex-col">
          {/* Top Header with Controls */}
          <div className="flex items-center justify-center p-4">
            {/* Center Title Section with Mewtwo sprites next to it */}
            <div className="flex items-center gap-4">
              {/* Left Mewtwo - Pokeball rain toggle */}
              <motion.img 
                src="/150.gif"
                alt="Mewtwo Rain Toggle"
                className={`w-32 h-32 object-contain cursor-pointer ${pokeballRain ? 'ring-4 ring-red-400 rounded-full' : ''}`}
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
                  className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-yellow-400 mb-1 cursor-pointer hover:text-yellow-300 transition-colors" 
                  style={{
                    fontFamily: 'Impact, Arial Black, sans-serif',
                    textShadow: '4px 4px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000'
                  }}
                  onClick={() => {
                    console.log('PackPopShop clicked, current isEditMode:', isEditMode);
                    setIsEditMode(!isEditMode);
                  }}
                >
                  PackPopShop
                </h1>
                <h2 
                  className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1" 
                  style={{
                    fontFamily: 'Arial Black, sans-serif',
                    textShadow: '3px 3px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000'
                  }}
                >
                  SLAB BOX
                </h2>
              <h3 
                className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white" 
                style={{
                  fontFamily: 'Arial Black, sans-serif',
                  textShadow: '3px 3px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000'
                }}
              >
                2 FLOORS INSURANCE
              </h3>
              </div>
              
              {/* Right Mewtwo - Background upload */}
              <motion.img 
                src="/150.gif"
                alt="Mewtwo Background Upload"
                className="w-32 h-32 object-contain cursor-pointer"
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
                className="flex flex-col gap-4 mx-4 mb-2 bg-black/20 backdrop-blur-sm p-4 rounded-xl"
              >
                {/* First Row of Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-wrap">
                  {/* Font Size Controls */}
                  <div className="flex items-center gap-2">
                    <span className="text-base font-medium text-white">Font Size:</span>
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleFontSizeChange(-1)}
                        disabled={fontSizeLevel === 0}
                        className={`w-12 h-10 rounded-lg flex items-center justify-center text-lg font-bold transition-colors border ${
                          fontSizeLevel === 0 
                            ? 'bg-gray-600/50 text-gray-400 border-gray-500/30 cursor-not-allowed' 
                            : 'bg-emerald-600/80 hover:bg-emerald-500/80 text-white border-emerald-500/50'
                        }`}
                      >
                        -T
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleFontSizeChange(1)}
                        disabled={fontSizeLevel === 7}
                        className={`w-12 h-10 rounded-lg flex items-center justify-center text-lg font-bold transition-colors border ${
                          fontSizeLevel === 7 
                            ? 'bg-gray-600/50 text-gray-400 border-gray-500/30 cursor-not-allowed' 
                            : 'bg-emerald-600/80 hover:bg-emerald-500/80 text-white border-emerald-500/50'
                        }`}
                      >
                        +T
                      </motion.button>
                    </div>
                  </div>

                  {/* Bag Count Controls */}
                  <div className="flex items-center gap-2">
                    <span className="text-base font-medium text-white">Total Bags:</span>
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleBagCountChange(-1)}
                        disabled={bagCount === 1}
                        className={`w-12 h-10 rounded-lg flex items-center justify-center text-lg font-bold transition-colors border ${
                          bagCount === 1 
                            ? 'bg-gray-600/50 text-gray-400 border-gray-500/30 cursor-not-allowed' 
                            : 'bg-red-600/80 hover:bg-red-500/80 text-white border-red-500/50'
                        }`}
                      >
                        -B
                      </motion.button>
                      
                      <span className="text-xl font-bold text-white w-12 text-center">
                        {bagCount}
                      </span>
                      
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleBagCountChange(1)}
                        disabled={bagCount === 100}
                        className={`w-12 h-10 rounded-lg flex items-center justify-center text-lg font-bold transition-colors border ${
                          bagCount === 100 
                            ? 'bg-gray-600/50 text-gray-400 border-gray-500/30 cursor-not-allowed' 
                            : 'bg-green-600/80 hover:bg-green-500/80 text-white border-green-500/50'
                        }`}
                      >
                        +B
                      </motion.button>
                    </div>
                  </div>

                  {/* Font Family Toggle Controls */}
                  <div className="flex items-center gap-2">
                    <span className="text-base font-medium text-white">Font:</span>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleFontFamilyChange}
                      className="px-4 h-10 rounded-lg flex items-center justify-center text-sm font-bold transition-colors border bg-indigo-600/80 hover:bg-indigo-500/80 text-white border-indigo-500/50"
                    >
                      {getFontFamilyName()}
                    </motion.button>
                  </div>
                </div>

                {/* Second Row of Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 flex-wrap">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-wrap">
                    {/* Text Color Toggle Controls */}
                    <div className="flex items-center gap-2">
                      <span className="text-base font-medium text-white">Text Color:</span>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleTextColorChange}
                        className={`px-4 h-10 rounded-lg flex items-center justify-center text-sm font-bold transition-colors border ${
                          textColor === 0 
                            ? 'bg-gray-600/80 hover:bg-gray-500/80 text-white border-gray-500/50'
                            : textColor === 1
                            ? 'bg-yellow-600/80 hover:bg-yellow-500/80 text-white border-yellow-500/50'
                            : 'bg-purple-600/80 hover:bg-purple-500/80 text-white border-purple-500/50'
                        }`}
                      >
                        {getTextColorName()}
                      </motion.button>
                    </div>

                    {/* Background Toggle Controls */}
                    <div className="flex items-center gap-2">
                      <span className="text-base font-medium text-white">Background:</span>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={toggleDefaultBackground}
                        className={`px-4 h-10 rounded-lg flex items-center justify-center text-sm font-bold transition-colors border ${
                          isCustomBackground 
                            ? 'bg-gray-600/80 hover:bg-gray-500/80 text-white border-gray-500/50' 
                            : backgroundImage === '/orchids.jpg'
                            ? 'bg-purple-600/80 hover:bg-purple-500/80 text-white border-purple-500/50'
                            : 'bg-orange-600/80 hover:bg-orange-500/80 text-white border-orange-500/50'
                        }`}
                      >
                        {isCustomBackground ? 'Custom' : backgroundImage === '/orchids.jpg' ? 'Orchids' : 'Flame'}
                      </motion.button>
                    </div>
                  </div>

                  {/* Reset Button */}
                  <div className="flex items-center">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleReset}
                      className="px-6 h-10 rounded-lg flex items-center justify-center text-sm font-bold transition-colors border bg-red-600/80 hover:bg-red-500/80 text-white border-red-500/50"
                    >
                      Reset All
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Grid - Full Screen Layout that fills remaining space */}
          <div className="flex-1 px-2 sm:px-4 pb-4 overflow-hidden">
            <div className={`grid gap-1 sm:gap-2 h-full ${
              orientation === 'landscape' ? 'grid-cols-10' : 'grid-cols-5'
            }`} style={{ maxHeight: 'calc(100vh - 200px)' }}>
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
                  <span 
                    className={`relative z-10 select-none font-bold transition-opacity duration-300 ${
                      boxStates[number] === 1 || boxStates[number] === 2 ? 'opacity-0' : 'opacity-100'
                    }`}
                    style={getFontFamilyStyle()}
                  >
                    {getBoxContent(number, boxStates[number])}
                  </span>
                  
                  {/* Red brush stroke scratch effect for state 1 */}
                  {boxStates[number] === 1 && (
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
                  
                  {/* Green brush stroke scratch effect for state 2 */}
                  {boxStates[number] === 2 && (
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
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PackPopShop
