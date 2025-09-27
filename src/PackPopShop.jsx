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

  // State for slowstars background toggle
  const [useSlowstarsBackground, setUseSlowstarsBackground] = useState(() => {
    const config = loadConfig()
    return config?.useSlowstarsBackground || false
  })

  // State for second tap image toggle
  const [useGoldPrinter, setUseGoldPrinter] = useState(() => {
    const config = loadConfig()
    return config?.useGoldPrinter || true
  })

  // State for first tap display toggle (mystbox.png vs "?")
  const [useFirstTapImage, setUseFirstTapImage] = useState(() => {
    const config = loadConfig()
    return config?.useFirstTapImage !== undefined ? config.useFirstTapImage : true
  })
  
  // State for orientation detection
  const [orientation, setOrientation] = useState(
    window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
  )

  // State for flash animation tracking
  const [flashingBoxes, setFlashingBoxes] = useState({})

  // Lock mechanism state variables
  const [isLocked, setIsLocked] = useState(true)  // Lock starts as true (locked)
  const [lockFlash, setLockFlash] = useState(false)  // Controls flash animation
  const [unlockSelections, setUnlockSelections] = useState(new Set())  // Tracks rainbow borders
  const [animationKey, setAnimationKey] = useState(0)  // For resetting animations

  // Lock Button Component - Extra Long Rectangle with Centered Content
  const LockButton = ({ isLocked, onToggle }) => (
    <motion.button
      onClick={onToggle}
      className={`relative px-12 py-3 rounded-lg flex items-center justify-center gap-3 transition-all duration-300 min-w-[200px] ${
        isLocked 
          ? 'bg-red-500/30 hover:bg-red-500/40'  // Red when locked
          : 'bg-green-500/30 hover:bg-green-500/40 animate-rainbow-border'  // Green + rainbow when unlocked
      }`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        animate={{ rotate: isLocked ? 0 : 180 }}  // Rotates 180° when unlocked
        className="text-xl text-white"
        transition={{ duration: 0.3 }}
      >
        {isLocked ? '🔒' : '🔓'}  {/* Lock/unlock emoji */}
      </motion.div>
      <span className="text-white font-bold text-sm">
        {isLocked ? 'LOCKED' : 'UNLOCKED'}
      </span>
    </motion.button>
  );

  // Calculate remaining (unmodified) bags count
  const getRemainingBagsCount = () => {
    const modifiedCount = Object.values(boxStates).filter(state => state !== 0).length;
    return bagCount - modifiedCount;
  };

  // Counter Component showing remaining/total bags
  const BagCounter = () => {
    const remaining = getRemainingBagsCount();
    return (
      <motion.div
        className="flex items-center gap-2 px-4 py-2 bg-blue-500/30 rounded-lg"
        animate={{ scale: remaining < bagCount ? [1, 1.1, 1] : 1 }}
        transition={{ duration: 0.3 }}
      >
        <span className="text-2xl">🎒</span>
        <div className="flex flex-col items-center">
          <span className="text-white font-bold text-lg">{remaining}/{bagCount}</span>
          <span className="text-white text-xs">Bags</span>
        </div>
      </motion.div>
    );
  };

  // Handle box click with 4-state cycle and lock mechanism
  const handleBoxClick = (boxNumber) => {
    if (isLocked) {
      // Flash the lock when trying to interact in locked state
      setLockFlash(true);
      setTimeout(() => setLockFlash(false), 600);
      return;  // Exit early - no selection allowed
    }

    setBoxStates(prev => {
      const currentState = prev[boxNumber] || 0
      const newState = (currentState + 1) % 4
      
      // Add to unlock selections when changing from unscratched to first click
      if (currentState === 0 && newState === 1) {
        setUnlockSelections(prevUnlock => new Set([...prevUnlock, boxNumber]));
        
        setFlashingBoxes(flashPrev => ({
          ...flashPrev,
          [boxNumber]: true
        }))
        
        // Remove flash after 3 seconds
        setTimeout(() => {
          setFlashingBoxes(flashPrev => {
            const newFlashState = { ...flashPrev }
            delete newFlashState[boxNumber]
            return newFlashState
          })
        }, 3000)
      } else if (currentState === 1 && newState === 2) {
        // Remove from unlock selections when moving to second click
        setUnlockSelections(prevUnlock => {
          const newUnlock = new Set(prevUnlock);
          newUnlock.delete(boxNumber);
          return newUnlock;
        });
      } else if (currentState === 3 && newState === 0) {
        // Remove from unlock selections when resetting to unscratched
        setUnlockSelections(prevUnlock => {
          const newUnlock = new Set(prevUnlock);
          newUnlock.delete(boxNumber);
          return newUnlock;
        });
      }
      
      const newStates = {
        ...prev,
        [boxNumber]: newState
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
        useSlowstarsBackground,
        boxStates
      })
      return newColor
    })
  }

  // Slowstars background toggle function
  const handleSlowstarsBackgroundToggle = () => {
    setUseSlowstarsBackground(prev => {
      const newValue = !prev
      // Save to localStorage
      saveConfig({
        bagCount,
        fontSizeLevel,
        fontFamily,
        textColor,
        useSlowstarsBackground: newValue,
        useGoldPrinter,
        boxStates
      })
      return newValue
    })
  }

  // Gold printer toggle function
  const handleGoldPrinterToggle = () => {
    setUseGoldPrinter(prev => {
      const newValue = !prev
      // Save to localStorage
      saveConfig({
        bagCount,
        fontSizeLevel,
        fontFamily,
        textColor,
        useSlowstarsBackground,
        useGoldPrinter: newValue,
        useFirstTapImage,
        boxStates
      })
      return newValue
    })
  }

  // First tap image toggle function
  const handleFirstTapImageToggle = () => {
    setUseFirstTapImage(prev => {
      const newValue = !prev
      // Save to localStorage
      saveConfig({
        bagCount,
        fontSizeLevel,
        fontFamily,
        textColor,
        useSlowstarsBackground,
        useGoldPrinter,
        useFirstTapImage: newValue,
        boxStates
      })
      return newValue
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
  const getBoxStyling = (state, isFlashing) => {
    const baseClasses = (() => {
      switch (state) {
        case 0: // Unscratched - black background when stars off, dynamic text color when stars on
          return useSlowstarsBackground 
            ? `${getTextColorClass()} border-gray-800`
            : `bg-black ${getTextColorClass()} border-gray-800`
        case 1: // First click - question mark, same styling as unscratched
          return useSlowstarsBackground 
            ? `${getTextColorClass()} border-gray-800`
            : `bg-black ${getTextColorClass()} border-gray-800`
        case 2: // Second click - crypika black background
          return 'text-white border-gray-800'
        case 3: // Third click - gold printer/3gb background
          return 'text-white border-gray-800'
        default: // Reset to unscratched
          return useSlowstarsBackground 
            ? `${getTextColorClass()} border-gray-800`
            : `bg-black ${getTextColorClass()} border-gray-800`
      }
    })()
    
    // Add flashing animation class if the box is flashing
    return isFlashing ? `${baseClasses} animate-pulse` : baseClasses
  }

  // Get box content based on state
  const getBoxContent = (number, state) => {
    switch (state) {
      case 0: // Unscratched - show number
        return number
      case 1: // First click - show question mark or hide for image
        return useFirstTapImage ? number : '?'
      case 2: // Second click - hide content (background image will show)
        return number
      case 3: // Third click - hide content (background image will show)
        return number
      default:
        return number
    }
  }


  return (
    <div className={`h-screen ${!backgroundImage ? 'bg-gradient-to-br from-green-100 via-emerald-200 to-green-300' : ''}`}>
      <div className="h-full bg-white/0 backdrop-blur-none rounded-2xl shadow-xl">
        <div className="h-full flex flex-col">
          {/* Top Header with Controls */}
          <div className="flex items-center justify-between p-4">
            {/* Left Side - Bag Counter */}
            <div className="flex items-center">
              <BagCounter />
            </div>

            {/* Center Title Section with Mewtwo sprites next to it */}
            <div className="flex items-center gap-4">
              {/* Left Mewtwo - Pokeball rain toggle */}
              <motion.img 
                src="/272.gif"
                alt="Ludicolo Rain Toggle"
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
                  EuphyHitz
                </h1>
                <h2 
                  className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1" 
                  style={{
                    fontFamily: 'Arial Black, sans-serif',
                    textShadow: '3px 3px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000'
                  }}
                >
                  Gacha Bagz
                </h2>
              </div>
              
              {/* Right Mewtwo - Background upload */}
              <motion.img 
                src="/272.gif"
                alt="Ludicolo Background Upload"
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

            {/* Right Side - Lock Button */}
            <div className="flex items-center">
              <LockButton 
                isLocked={isLocked} 
                onToggle={() => {
                  if (!isLocked) {
                    setUnlockSelections(new Set());  // Clear rainbow borders when locking
                  } else {
                    setAnimationKey(prev => prev + 1);  // Reset animations when unlocking
                  }
                  setIsLocked(!isLocked);
                }} 
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
                            : backgroundImage === '/blueCircle.gif'
                            ? 'bg-blue-600/80 hover:bg-blue-500/80 text-white border-blue-500/50'
                            : backgroundImage === '/purplewave.gif'
                            ? 'bg-purple-600/80 hover:bg-purple-500/80 text-white border-purple-500/50'
                            : 'bg-red-600/80 hover:bg-red-500/80 text-white border-red-500/50'
                        }`}
                      >
                        {isCustomBackground ? 'Custom' : backgroundImage === '/blueCircle.gif' ? 'Blue Circle' : backgroundImage === '/purplewave.gif' ? 'Purple Wave' : 'Red Germs'}
                      </motion.button>
                    </div>

                    {/* Slowstars Box Background Toggle */}
                    <div className="flex items-center gap-2">
                      <span className="text-base font-medium text-white">Box Stars:</span>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleSlowstarsBackgroundToggle}
                        className={`px-4 h-10 rounded-lg flex items-center justify-center text-sm font-bold transition-colors border ${
                          useSlowstarsBackground 
                            ? 'bg-cyan-600/80 hover:bg-cyan-500/80 text-white border-cyan-500/50' 
                            : 'bg-gray-600/80 hover:bg-gray-500/80 text-white border-gray-500/50'
                        }`}
                      >
                        {useSlowstarsBackground ? 'ON' : 'OFF'}
                      </motion.button>
                    </div>

                    {/* First Tap Image Toggle */}
                    <div className="flex items-center gap-2">
                      <span className="text-base font-medium text-white">1st Tap:</span>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleFirstTapImageToggle}
                        className={`px-4 h-10 rounded-lg flex items-center justify-center text-sm font-bold transition-colors border ${
                          useFirstTapImage 
                            ? 'bg-purple-600/80 hover:bg-purple-500/80 text-white border-purple-500/50' 
                            : 'bg-gray-600/80 hover:bg-gray-500/80 text-white border-gray-500/50'
                        }`}
                      >
                        {useFirstTapImage ? 'Box' : '?'}
                      </motion.button>
                    </div>

                    {/* Second Tap Image Toggle */}
                    <div className="flex items-center gap-2">
                      <span className="text-base font-medium text-white">2nd Tap:</span>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleGoldPrinterToggle}
                        className={`px-4 h-10 rounded-lg flex items-center justify-center text-sm font-bold transition-colors border ${
                          useGoldPrinter 
                            ? 'bg-yellow-600/80 hover:bg-yellow-500/80 text-white border-yellow-500/50' 
                            : 'bg-gray-600/80 hover:bg-gray-500/80 text-white border-gray-500/50'
                        }`}
                      >
                        {useGoldPrinter ? 'Gold' : '3GB'}
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
          <div className="flex-1 px-2 sm:px-4 pb-4 overflow-hidden relative">
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
                    ${getBoxStyling(boxStates[number], flashingBoxes[number])}
                    shadow-md transition-all duration-300
                    ${flashingBoxes[number] ? 'border-4' : 'border-2'}
                    ${!isLocked && unlockSelections.has(number) ? 'border-[3px] animate-rainbow-border' : ''}
                  `}
                  style={{
                    ...((boxStates[number] === 0 || boxStates[number] === 1) && useSlowstarsBackground ? {
                      backgroundImage: 'url(/slowstars.gif)',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat'
                    } : {}),
                    ...(flashingBoxes[number] ? {
                      animation: 'flash-border 0.5s infinite alternate',
                      borderColor: 'white'
                    } : {})
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Box content - show text for states 0 and 1, hide for states 2 and 3 */}
                  <span 
                    className={`relative z-10 select-none font-bold transition-opacity duration-300 ${
                      boxStates[number] === 2 || boxStates[number] === 3 ? 'opacity-0' : 
                      (boxStates[number] === 1 && useFirstTapImage) ? 'opacity-0' : 'opacity-100'
                    }`}
                    style={getFontFamilyStyle()}
                  >
                    {getBoxContent(number, boxStates[number])}
                  </span>
                  
                  {/* First tap mystbox.png background when useFirstTapImage is true */}
                  {boxStates[number] === 1 && useFirstTapImage && (
                    <div 
                      className="absolute inset-0 rounded-xl"
                      style={{
                        backgroundImage: 'url(/mystbox.png)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat'
                      }}
                    />
                  )}
                  
                  {/* Crypika black background for state 2 (what used to be state 1) */}
                  {boxStates[number] === 2 && (
                    <div 
                      className="absolute inset-0 rounded-xl"
                      style={{
                        backgroundImage: 'url(/crypikablack.png)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat'
                      }}
                    />
                  )}
                  
                  {/* Third tap background - toggleable between 3gbblack.png and goldprinter.png */}
                  {boxStates[number] === 3 && (
                    <div 
                      className="absolute inset-0 rounded-xl"
                      style={{
                        backgroundImage: useGoldPrinter ? 'url(/geomoney.png)' : 'url(/3gbblack.png)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat'
                      }}
                    />
                  )}
                </motion.div>
              ))}
            </div>

            {/* Lock Overlay - appears when locked */}
            {isLocked && (
              <motion.div
                animate={{ 
                  opacity: lockFlash ? 0.8 : 0.15,  // Flashes brighter when clicked
                  scale: lockFlash ? 1.1 : 1 
                }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
                transition={{ duration: 0.3 }}
              >
                <div className="text-[10rem] text-white drop-shadow-2xl">🔒</div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PackPopShop
