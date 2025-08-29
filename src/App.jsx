import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'

function App() {
  // State declarations
  const [currentView, setCurrentView] = useState('bags')
  const [insuranceImages, setInsuranceImages] = useState([null, null, null, null, null])
  const [currentInsuranceIndex, setCurrentInsuranceIndex] = useState(0)
  const [insuranceMarks, setInsuranceMarks] = useState([[], [], [], [], []])
  const [isInsuranceEditMode, setIsInsuranceEditMode] = useState(false)
  const [hasInsuranceImages, setHasInsuranceImages] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [orientation, setOrientation] = useState(window.screen.orientation?.type || 'portrait')
  const [bagCount, setBagCount] = useState(null)
  const [chaseCount, setChaseCount] = useState(null)
  const [remainingChases, setRemainingChases] = useState(null)
  const [numbers, setNumbers] = useState([])
  const [selectedNumbers, setSelectedNumbers] = useState(new Set())
  const [chaseNumbers, setChaseNumbers] = useState(new Set())
  const [isCooked, setIsCooked] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [prizeImage, setPrizeImage] = useState(null)
  const [marks, setMarks] = useState([])
  const [markSize, setMarkSize] = useState(4)
  const [controlsVisible, setControlsVisible] = useState(true)
  const controlsTimeout = useRef(null)
  const imageContainerRef = useRef(null)
  
  
  const [zoomState, setZoomState] = useState(() => {
    const saved = localStorage.getItem('gachaBagZoomState')
    return saved ? JSON.parse(saved) : {
      scale: 1,
      positionX: 0,
      positionY: 0
    }
  })

  // Helper function for insurance navigation
  const getNextValidIndex = (currentIndex, direction) => {
    let newIndex = currentIndex;
    let count = 0;
    do {
      newIndex = (newIndex + direction + 5) % 5;
      count++;
      if (insuranceImages[newIndex] !== null) {
        return newIndex;
      }
    } while (count < 5);
    return currentIndex;
  }

  // Insurance handlers
  const handleInsuranceEditToggle = () => {
    if (isInsuranceEditMode && !hasInsuranceImages) {
      return;
    }
    setIsInsuranceEditMode(!isInsuranceEditMode);
  }

  const handleInsuranceImageUpload = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target.result;
        const newImages = [...insuranceImages];
        newImages[index] = imageData;
        setInsuranceImages(newImages);
        localStorage.setItem('insuranceImages', JSON.stringify(newImages));
        
        // Find first non-null image index and set it as current
        const firstValidIndex = newImages.findIndex(img => img !== null);
        if (firstValidIndex !== -1) {
          setCurrentInsuranceIndex(firstValidIndex);
        }
      };
      reader.readAsDataURL(file);
    }
  }

const handleInsuranceImageClick = (e) => {
  if (!imageContainerRef.current) return;
  
  const image = imageContainerRef.current.querySelector('img');
  if (!image) return;
  
  const imageRect = image.getBoundingClientRect();
  const x = (e.clientX - imageRect.left);
  const y = (e.clientY - imageRect.top);
  
  // Adjust the percentage calculation to account for mark size
  const markSizeInPixels = markSize * 16;
  const xPercent = ((x - (markSizeInPixels/2)) / imageRect.width) * 100;
  const yPercent = ((y - (markSizeInPixels/2)) / imageRect.height) * 100;
  
  const newMarks = [...insuranceMarks];
  newMarks[currentInsuranceIndex] = [
    ...newMarks[currentInsuranceIndex],
    { 
      x: xPercent, 
      y: yPercent,
      size: markSize
    }
  ];
  setInsuranceMarks(newMarks);
  localStorage.setItem('insuranceMarks', JSON.stringify(newMarks));
};
  const handleInsuranceUndo = () => {
    const newMarks = [...insuranceMarks];
    newMarks[currentInsuranceIndex] = newMarks[currentInsuranceIndex].slice(0, -1);
    setInsuranceMarks(newMarks);
    localStorage.setItem('insuranceMarks', JSON.stringify(newMarks));
  }

  // Bags and Chases handlers
  const handleBagCountChange = (increment) => {
    const newCount = Math.max(1, Math.min(100, bagCount + increment))
    setBagCount(newCount)
    setNumbers(Array.from({ length: newCount }, (_, i) => i + 1))
    setIsCooked(false)
  }

  const handleChaseCountChange = (increment) => {
    const newCount = Math.max(0, Math.min(100, chaseCount + increment))
    setChaseCount(newCount)
    setRemainingChases(newCount)
    setChaseNumbers(new Set())
    setIsCooked(false)
  }

  const toggleNumber = (number) => {
    const newSelected = new Set(selectedNumbers)
    const newChases = new Set(chaseNumbers)

    if (!newSelected.has(number)) {
      newSelected.add(number)
    } else if (!newChases.has(number)) {
      newChases.add(number)
      setRemainingChases(prev => prev - 1)
    } else {
      newSelected.delete(number)
      newChases.delete(number)
      setRemainingChases(prev => prev + 1)
    }

    setSelectedNumbers(newSelected)
    setChaseNumbers(newChases)
  }

  const calculateHitRatio = () => {
    const remainingBags = bagCount - selectedNumbers.size
    if (remainingBags === 0) return '0%'
    const ratio = (remainingChases / remainingBags) * 100
    return `${ratio.toFixed(1)}%`
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageData = e.target.result
        setPrizeImage(imageData)
        localStorage.setItem('gachaBagImage', imageData)
        setMarks([])
      }
      reader.readAsDataURL(file)
    }
  }

const handleImageClick = (e) => {
  if (!imageContainerRef.current) return;
  
  const image = imageContainerRef.current.querySelector('img');
  if (!image) return;
  
  const imageRect = image.getBoundingClientRect();
  const x = (e.clientX - imageRect.left);
  const y = (e.clientY - imageRect.top);
  
  // Adjust the percentage calculation to account for mark size
  const markSizeInPixels = markSize * 16;
  const xPercent = ((x - (markSizeInPixels/2)) / imageRect.width) * 100;
  const yPercent = ((y - (markSizeInPixels/2)) / imageRect.height) * 100;
  
  setMarks([...marks, { 
    x: xPercent, 
    y: yPercent,
    size: markSize
  }]);
}

  const handleUndo = () => {
    setMarks(marks.slice(0, -1))
  }

  const handleReset = () => {
    try {
      localStorage.removeItem('gachaBagState')
      localStorage.removeItem('gachaBagImage')
      localStorage.removeItem('gachaBagZoomState')
      localStorage.removeItem('insuranceImages')
      localStorage.removeItem('insuranceMarks')
      setBagCount(50)
      setChaseCount(8)
      setRemainingChases(8)
      setSelectedNumbers(new Set())
      setChaseNumbers(new Set())
      setNumbers(Array.from({ length: 50 }, (_, i) => i + 1))
      setIsCooked(false)
      setPrizeImage(null)
      setMarks([])
      setMarkSize(4)
      setZoomState({ scale: 1, positionX: 0, positionY: 0 })
      setShowResetConfirm(false)
      setInsuranceImages([null, null, null, null, null])
      setInsuranceMarks([[], [], [], [], []])
      setCurrentInsuranceIndex(0)
    } catch (error) {
      console.error('Error resetting state:', error)
    }
  }

  // Effects
  useEffect(() => {
    const hasImages = insuranceImages.some(img => img !== null);
    setHasInsuranceImages(hasImages);
    if (!hasImages) {
      setIsInsuranceEditMode(true);
    }
  }, [insuranceImages]);

  useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(window.screen.orientation?.type || 
        (window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'))
    }

    window.addEventListener('orientationchange', handleOrientationChange)
    window.addEventListener('resize', handleOrientationChange)

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange)
      window.removeEventListener('resize', handleOrientationChange)
    }
  }, [])

  useEffect(() => {
    if (currentView === 'chases' || currentView === 'insurance') {
      const hideControls = () => setControlsVisible(false)
      controlsTimeout.current = setTimeout(hideControls, 2000)

      const handleInteraction = () => {
        setControlsVisible(true)
        clearTimeout(controlsTimeout.current)
        controlsTimeout.current = setTimeout(hideControls, 2000)
      }

      window.addEventListener('touchstart', handleInteraction)
      window.addEventListener('mousemove', handleInteraction)

      return () => {
        clearTimeout(controlsTimeout.current)
        window.removeEventListener('touchstart', handleInteraction)
        window.removeEventListener('mousemove', handleInteraction)
      }
    }
  }, [currentView])

  useEffect(() => {
    try {
      const savedState = localStorage.getItem('gachaBagState')
      const savedImage = localStorage.getItem('gachaBagImage')
      const savedInsuranceImages = localStorage.getItem('insuranceImages')
      const savedInsuranceMarks = localStorage.getItem('insuranceMarks')
      
      if (savedState) {
        const parsedState = JSON.parse(savedState)
        setBagCount(parsedState.bagCount)
        setChaseCount(parsedState.chaseCount)
        setRemainingChases(parsedState.remainingChases)
        setNumbers(Array.from({ length: parsedState.bagCount }, (_, i) => i + 1))
        setSelectedNumbers(new Set(parsedState.selectedNumbers))
        setChaseNumbers(new Set(parsedState.chaseNumbers))
        setMarks(parsedState.marks || [])
        setMarkSize(parsedState.markSize || 4)
      } else {
        setBagCount(50)
        setChaseCount(8)
        setRemainingChases(8)
        setNumbers(Array.from({ length: 50 }, (_, i) => i + 1))
      }

      if (savedImage) {
        setPrizeImage(savedImage)
      }

      if (savedInsuranceImages) {
        setInsuranceImages(JSON.parse(savedInsuranceImages))
      }
      
      if (savedInsuranceMarks) {
        setInsuranceMarks(JSON.parse(savedInsuranceMarks))
      }
    } catch (error) {
      console.error('Error loading state:', error)
      setBagCount(50)
      setChaseCount(8)
      setRemainingChases(8)
      setNumbers(Array.from({ length: 50 }, (_, i) => i + 1))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isLoading) return;

    try {
      const stateToSave = {
        bagCount,
        chaseCount,
        selectedNumbers: Array.from(selectedNumbers),
        chaseNumbers: Array.from(chaseNumbers),
        remainingChases,
        marks,
        markSize
      }
      localStorage.setItem('gachaBagState', JSON.stringify(stateToSave))
    } catch (error) {
      console.error('Error saving state:', error)
    }
  }, [bagCount, chaseCount, selectedNumbers, chaseNumbers, remainingChases, marks, markSize, isLoading])

  useEffect(() => {
    setIsCooked(remainingChases === 0 && selectedNumbers.size < bagCount)
  }, [remainingChases, selectedNumbers.size, bagCount])

  const gridCols = orientation.includes('landscape') 
    ? 'grid-cols-10'
    : 'grid-cols-5'

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="h-screen bg-gradient-to-br from-blue-600 via-teal-500 to-green-400 p-4">
      <div className="h-full bg-white/10 backdrop-blur-md rounded-2xl shadow-xl">
        {currentView === 'bags' ? (
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between p-4">
  <button
    onClick={() => setCurrentView('chases')}
    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
  >
    Top Chases
  </button>

  <img 
    src="/9.gif"
    alt="Blastoise"
    className="w-20 h-20 object-contain"
  />

  <div className="relative cursor-pointer" onClick={() => setIsEditMode(!isEditMode)}>
    <img 
      src="/245.gif"
      alt="Suicune"
      className="w-26 h-26 object-contain"
    />
    
    <div className="absolute inset-0 rounded-full hover:bg-white/10 transition-colors" />
  </div>

  <img 
    src="/9.gif"
    alt="Blastoise"
    className="w-20 h-20 object-contain"
  />

  <button
    onClick={() => setCurrentView('insurance')}
    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
  >
    Insurance
  </button>
</div>

            <div className="flex items-center justify-center gap-4 mb-2">
              <img 
                src="/pokegoons-logo.png" 
                alt="PokeGoons Logo" 
                className="w-20 h-20 object-contain animate-pulse"
                style={{ animationDuration: '3s' }}
              />
              <h1 className="text-4xl font-black text-transparent bg-clip-text relative">
                <span className="absolute inset-0 text-4xl font-black text-white blur-sm">
                  POKEGOONS BAGS
                </span>
                <span className="relative animate-gradient-x bg-gradient-to-r from-blue-400 via-teal-500 to-green-600 bg-clip-text text-transparent">
                  POKEGOONS BAGS
                </span>
              </h1>
              <img 
                src="/pokegoons-logo.png" 
                alt="PokeGoons Logo" 
                className="w-20 h-20 object-contain animate-pulse"
                style={{ animationDuration: '3s' }}
              />
            </div>

            <AnimatePresence mode="wait">
              {isEditMode && (
                <motion.div
                  key="controls"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex flex-wrap items-center justify-between gap-4 mx-4 mb-2 bg-black/20 backdrop-blur-sm p-4 rounded-xl"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-medium text-white">Total Bags:</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleBagCountChange(-1)}
                          className="w-10 h-10 flex items-center justify-center bg-black/30 text-white rounded-lg text-xl"
                        >
                          -
                        </button>
                        <span className="text-xl font-bold text-white w-10 text-center">
                          {bagCount}
                        </span>
                        <button
                          onClick={() => handleBagCountChange(1)}
                          className="w-10 h-10 flex items-center justify-center bg-black/30 text-white rounded-lg text-xl"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-base font-medium text-white">Total Chases:</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleChaseCountChange(-1)}
                          className="w-10 h-10 flex items-center justify-center bg-black/30 text-white rounded-lg text-xl"
                        >
                          -
                        </button>
                        <span className="text-xl font-bold text-white w-10 text-center">
                          {chaseCount}
                        </span>
                        <button
                          onClick={() => handleChaseCountChange(1)}
                          className="w-10 h-10 flex items-center justify-center bg-black/30 text-white rounded-lg text-xl"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowResetConfirm(true)}
                      className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg hover:shadow-lg transition-colors text-base font-medium"
                    >
                      Reset
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {isCooked && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="mx-4 mb-2 p-3 bg-gradient-to-r from-teal-400 to-blue-500 rounded-xl text-white text-center font-bold text-xl shadow-lg"
                >
                  🌊 COOKED! 🌊
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className={`grid ${gridCols} gap-2 mx-4 flex-1 h-[calc(100vh-280px)]`}>
              {numbers.map((number) => (
                <motion.div
                  key={number}
                  onClick={() => toggleNumber(number)}
                  className={`
                    relative flex items-center justify-center 
                    rounded-xl cursor-pointer text-xl font-bold shadow-lg
                    ${
                      chaseNumbers.has(number)
                        ? 'bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-white'
                        : selectedNumbers.has(number)
                        ? 'bg-gradient-to-r from-purple-600 to-purple-800 text-white'
                        : 'bg-gradient-to-r from-blue-700 to-blue-900 text-white hover:from-blue-600 hover:to-blue-800'
                    }
                  `}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {number}
                  {(selectedNumbers.has(number)) && (
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center overflow-hidden"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="w-full h-0.5 bg-white transform rotate-45" />
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>

            <div className="flex flex-wrap justify-center items-center gap-4 mx-4 mt-2 text-lg font-bold">
              <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500/80 to-cyan-600/80 text-white">
                Bags Left: {bagCount - selectedNumbers.size} / {bagCount}
              </div>
              <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-white">
                Remaining Chases: {remainingChases}
              </div>
              <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500/80 to-blue-600/80 text-white">
                Hit Ratio: {calculateHitRatio()}
              </div>
            </div>

            <AnimatePresence>
              {showResetConfirm && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
                  onClick={(e) => {
                    if (e.target === e.currentTarget) {
                      setShowResetConfirm(false)
                    }
                  }}
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 10 }}
                    className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl"
                  >
                    <motion.div
                      initial={{ y: -20 }}
                      animate={{ y: 0 }}
                      className="text-center mb-6"
                    >
                      <motion.div
                        animate={{ rotate: [0, -5, 5, -5, 5, 0] }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-4xl mb-4"
                      >
                        🌊
                      </motion.div>
                      <h3 className="text-2xl font-bold mb-2 text-blue-500">Woah there!</h3>
                      <p className="text-gray-600">
                        Are you sure you want to reset everything? 
                        <br/>
                        <span className="text-sm">This action cannot be undone! 😱</span>
                      </p>
                    </motion.div>
                    
                    <div className="flex gap-3 justify-center">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-6 py-2 bg-gray-200 rounded-lg text-gray-800 font-medium hover:bg-gray-300 transition-colors"
                        onClick={() => setShowResetConfirm(false)}
                      >
                        Nevermind 😅
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-6 py-2 bg-gradient-to-r from-blue-500 to-teal-600 rounded-lg text-white font-medium hover:shadow-lg transition-all"
                        onClick={handleReset}
                      >
                        Yes, Reset! 💧
                      </motion.button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : currentView === 'chases' ? (
          <div className="relative h-[100dvh] max-h-[100dvh] w-full overflow-hidden">
            <div className="absolute top-safe-4 left-4 z-[60] flex gap-2">
              <button
                onClick={() => setCurrentView('bags')}
                className="px-6 py-3 bg-blue-900/40 hover:bg-blue-800/50 text-white rounded-lg transition-colors text-lg md:text-xl"
              >
                Show Bags
              </button>
              <button
                onClick={() => setCurrentView('insurance')}
                className="px-6 py-3 bg-purple-900/40 hover:bg-purple-800/50 text-white rounded-lg transition-colors text-lg md:text-xl"
              >
                Show Insurance
              </button>
            </div>
{/* Chases title animation */}
           <>
{/* Chases Count Overlay */}
<AnimatePresence>
  {!controlsVisible && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute top-safe-4 left-[400px] z-40 pointer-events-none"
    >
      <div 
        className="flex items-center gap-2 bg-black/50 backdrop-blur-md rounded-lg px-4 py-2" // Increased padding
        style={{ 
          border: '1px solid rgba(255, 255, 255, 0.5)',
        }}
      >
        <h1 
          className="text-3xl font-black italic tracking-wider" // Increased from text-xl to text-3xl
          style={{ 
            fontFamily: 'Arial Black, Arial, sans-serif',
            color: 'white',
            textShadow: `
              -2px -2px 0 #000,  
               2px -2px 0 #000,
              -2px  2px 0 #000,
               2px  2px 0 #000,
               3px  3px 0 rgba(0,0,0,0.5)
            ` // Increased shadow size to match larger text
          }}
        >
          {bagCount - selectedNumbers.size} Bags / Hit Ratio: {calculateHitRatio()}
        </h1>
      </div>
    </motion.div>
  )}
</AnimatePresence>



{/* Chases Controls - Hide with timeout */}
<AnimatePresence>
  {controlsVisible && (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="absolute top-safe-4 left-[360px] z-50 flex flex-wrap gap-4"
    >
      {marks.length > 0 && (
        <button
          onClick={handleUndo}
          className="px-6 py-3 bg-blue-900/40 hover:bg-blue-800/50 text-white rounded-lg transition-colors text-lg md:text-xl"
        >
          Undo Mark
        </button>
      )}

      <div className="flex items-center gap-3 bg-blue-900/40 p-3 rounded-lg">
        <span className="text-white text-lg md:text-xl">Mark Size:</span>
        <input
          type="range"
          min="12"
          max="17"
          value={markSize}
          onChange={(e) => setMarkSize(Number(e.target.value))}
          className="w-32 h-2 bg-blue-800/30 rounded-lg appearance-none cursor-pointer"
        />
        <span className="text-white w-8 text-center text-lg md:text-xl">{markSize}</span>
      </div>
    </motion.div>
  )}
</AnimatePresence>
</>

            <div className="h-full w-full">
              {prizeImage ? (
                <TransformWrapper
                  initialScale={zoomState.scale}
                  initialPositionX={zoomState.positionX}
                  initialPositionY={zoomState.positionY}
                  onTransformed={(e) => {
                    const newZoomState = {
                      scale: e.state.scale,
                      positionX: e.state.positionX,
                      positionY: e.state.positionY
                    }
                    setZoomState(newZoomState)
                    localStorage.setItem('gachaBagZoomState', JSON.stringify(newZoomState))
                  }}
                  minScale={0.5}
                  maxScale={4}
                  doubleClick={{ mode: "reset" }}
                  wheel={{ step: 0.1 }}
                >
                  <TransformComponent
                    wrapperClass="!w-full !h-full"
                    contentClass="!w-full !h-full"
                  >
                    <div 
                      className="relative w-full h-full" 
                      onClick={handleImageClick}
                      ref={imageContainerRef}
                    >
                      <img
                        src={prizeImage}
                        alt="Top Chases"
                        className="w-full h-full object-contain"
                      />
{marks.map((mark, index) => (
  <motion.div
    key={index}
    className="absolute text-blue-400 font-bold pointer-events-none"
    style={{ 
      left: `${mark.x}%`,
      top: `${mark.y}%`,
      fontSize: `${mark.size || markSize}rem`,
      filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.5))'
    }}
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
  >
    ✕
  </motion.div>
))}
                    </div>
                  </TransformComponent>
                </TransformWrapper>
              ) : (
                <div className="w-full h-full bg-blue-900/20 backdrop-blur-sm rounded-lg flex items-center justify-center text-white">
                  <label className="cursor-pointer hover:text-blue-200 transition-colors text-lg md:text-xl">
                    <span className="sr-only">Upload a top chases image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    Upload a top chases image
                  </label>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="relative h-[100dvh] max-h-[100dvh] w-full overflow-hidden">
  <div className="absolute top-safe-4 left-4 z-[60] flex gap-2">
    <button
      onClick={() => setCurrentView('bags')}
      className="px-6 py-3 bg-blue-900/40 hover:bg-blue-800/50 text-white rounded-lg transition-colors text-lg md:text-xl"
    >
      Show Bags
    </button>
    <button
      onClick={() => setCurrentView('chases')}
      className="px-6 py-3 bg-purple-900/40 hover:bg-purple-800/50 text-white rounded-lg transition-colors text-lg md:text-xl"
    >
      Show Chases
    </button>
  </div>

 {/* Insurance Controls and Title */}
<>
  {/* Edit Mode Button - Only visible when hasInsuranceImages and not in edit mode */}
  <div className="absolute top-safe-4 left-[360px] z-50">
    {hasInsuranceImages && !isInsuranceEditMode && controlsVisible && (
      <button
        onClick={handleInsuranceEditToggle}
        className="px-6 py-3 bg-blue-900/40 hover:bg-blue-800/50 text-white rounded-lg transition-colors text-lg md:text-xl"
      >
        Edit Mode
      </button>
    )}
    {/* Done Editing button - Only visible in edit mode */}
    {hasInsuranceImages && isInsuranceEditMode && (
      <button
        onClick={handleInsuranceEditToggle}
        className="px-6 py-3 bg-green-600/60 text-white rounded-lg transition-colors text-lg md:text-xl"
      >
        Done Editing
      </button>
    )}
  </div>

  <AnimatePresence>
    {!controlsVisible && !isInsuranceEditMode ? (
      // Title overlay when controls are hidden
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        exit={{ opacity: 0 }}
        className="absolute top-safe-4 left-[480px] z-40 pointer-events-none"
      >
        <h1 
          className="text-6xl font-black italic tracking-wider"
          style={{ 
            fontFamily: 'Arial Black, Arial, sans-serif',
            color: 'white',
            textShadow: `
              -2px -2px 0 #000,  
               2px -2px 0 #000,
              -2px  2px 0 #000,
               2px  2px 0 #000,
               4px  4px 0 rgba(0,0,0,0.3)
            `
          }}
        >
          Insurance
        </h1>
      </motion.div>
    ) : (
      // Other controls when visible
      !isInsuranceEditMode && controlsVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="absolute top-safe-4 left-[520px] z-50 flex flex-wrap gap-4"
        >
          {insuranceMarks[currentInsuranceIndex]?.length > 0 && (
            <button
              onClick={handleInsuranceUndo}
              className="px-6 py-3 bg-blue-900/40 hover:bg-blue-800/50 text-white rounded-lg transition-colors text-lg md:text-xl"
            >
              Undo Mark
            </button>
          )}

          {hasInsuranceImages && (
            <div className="flex items-center gap-3 bg-blue-900/40 p-3 rounded-lg">
              <span className="text-white text-lg md:text-xl">Mark Size:</span>
              <input
                type="range"
                min="12"
                max="17"
                value={markSize}
                onChange={(e) => setMarkSize(Number(e.target.value))}
                className="w-32 h-2 bg-blue-800/30 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-white w-8 text-center text-lg md:text-xl">{markSize}</span>
            </div>
          )}
        </motion.div>
      )
    )}
  </AnimatePresence>
</>

  <div className="h-full w-full">
    {isInsuranceEditMode ? (
      <div className="w-full h-full bg-blue-900/20 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center text-white gap-4">
        <div className="grid grid-cols-5 gap-4">
          {insuranceImages.map((img, index) => (
            <div key={index} className="relative">
              <label className="cursor-pointer hover:text-blue-200 transition-colors text-lg md:text-xl p-8 border-2 border-dashed border-white/50 rounded-lg flex flex-col items-center gap-2">
                {img ? (
                  <img src={img} alt={`Insurance ${index + 1}`} className="w-32 h-32 object-contain" />
                ) : (
                  <>
                    <span className="text-4xl">+</span>
                    <span>Upload Image {index + 1}</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleInsuranceImageUpload(index, e)}
                  className="hidden"
                />
              </label>
              {img && (
                <button
                  onClick={() => {
                    const newImages = [...insuranceImages];
                    newImages[index] = null;
                    setInsuranceImages(newImages);
                    localStorage.setItem('insuranceImages', JSON.stringify(newImages));
                    
                    // Find next valid image index
                    const nextValidIndex = getNextValidIndex(currentInsuranceIndex, 1);
                    if (nextValidIndex !== currentInsuranceIndex) {
                      setCurrentInsuranceIndex(nextValidIndex);
                    }
                  }}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500/80 text-white flex items-center justify-center"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    ) : (
      <div className="relative w-full h-full">
        <TransformWrapper                  
          initialScale={1}
          minScale={0.5}
          maxScale={4}
          doubleClick={{ mode: "reset" }}
          wheel={{ step: 0.1 }}
        >
          <TransformComponent
            wrapperClass="!w-full !h-full"
            contentClass="!w-full !h-full"
          >
            <div 
              className="relative w-full h-full" 
              onClick={!isInsuranceEditMode ? handleInsuranceImageClick : undefined}
              ref={imageContainerRef}
            >
              {hasInsuranceImages ? (
                <>
                  <img
                    src={insuranceImages[currentInsuranceIndex]}
                    alt={`Insurance ${currentInsuranceIndex + 1}`}
                    className="w-full h-full object-contain"
                  />
                  {insuranceMarks[currentInsuranceIndex]?.map((mark, index) => (
                    <motion.div
                      key={index}
                      className="absolute text-blue-400 font-bold pointer-events-none"
                      style={{ 
                        left: `${mark.x}%`,
                        top: `${mark.y}%`,
                        fontSize: `${mark.size || markSize}rem`,
                        filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.5))',
                        transform: 'translate(-150%, -150%)'
                      }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    >
                      ✕
                    </motion.div>
                  ))}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <button
                    onClick={() => setIsInsuranceEditMode(true)}
                    className="px-6 py-3 bg-blue-500 text-white rounded-lg"
                  >
                    Upload Insurance Images
                  </button>
                </div>
              )}
            </div>
          </TransformComponent>
        </TransformWrapper>

        {hasInsuranceImages && insuranceImages.filter(img => img !== null).length > 1 && (
          <>
            <button
              onClick={() => setCurrentInsuranceIndex(getNextValidIndex(currentInsuranceIndex, -1))}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 h-48 w-16 rounded-xl bg-black/20 hover:bg-black/30 text-white flex items-center justify-center transition-colors"
            >
              <span className="text-3xl">←</span>
            </button>
            <button
              onClick={() => setCurrentInsuranceIndex(getNextValidIndex(currentInsuranceIndex, 1))}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 h-48 w-16 rounded-xl bg-black/20 hover:bg-black/30 text-white flex items-center justify-center transition-colors"
            >
              <span className="text-3xl">→</span>
            </button>
          </>
        )}
      </div>
    )}
  </div>
</div>
        )}
      </div>
    </div>
  );
}

export default App;