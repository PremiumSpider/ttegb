
import { motion, AnimatePresence } from 'framer-motion'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import { useState, useEffect, useRef, useCallback } from 'react'

const BountyModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  bounties,
  currentBountyIndex,
  setCurrentBountyIndex, 
  onDelete
}) => {
  const [localState, setLocalState] = useState({
    image: bounties[currentBountyIndex]?.image || null,
    text: bounties[currentBountyIndex]?.text || '',
    duration: bounties[currentBountyIndex]?.duration || 5,
    interval: bounties[currentBountyIndex]?.interval || 10
  })

  const [selectedBountyIndex, setSelectedBountyIndex] = useState(currentBountyIndex)
  const [isNewBounty, setIsNewBounty] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setLocalState({
        image: bounties[selectedBountyIndex]?.image || null,
        text: bounties[selectedBountyIndex]?.text || '',
        duration: bounties[selectedBountyIndex]?.duration || 5,
        interval: bounties[selectedBountyIndex]?.interval || 10
      })
    }
  }, [isOpen, selectedBountyIndex, bounties])

  const handleImageUpload = useCallback((e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setLocalState(prev => ({
          ...prev,
          image: e.target.result
        }))
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const handleAddNew = () => {
    setIsNewBounty(true)
    const newIndex = bounties.length
    setSelectedBountyIndex(newIndex)
    setLocalState({
      image: null,
      text: '',
      duration: 5,
      interval: 10
    })
  }

  const handleSaveNew = () => {
    if (localState.image || localState.text.trim()) {
      onSave(bounties.length, localState)
      setIsNewBounty(false)
      // Create another empty state for the next new bounty
      setLocalState({
        image: null,
        text: '',
        duration: 5,
        interval: 10
      })
    }
  }

const handleSelect = () => {
  if (localState.image || localState.text.trim()) {
    onSave(selectedBountyIndex, localState);
    setCurrentBountyIndex(selectedBountyIndex);
  }
};

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-1/4 min-w-[300px] bg-gradient-to-br from-purple-900/90 to-purple-700/90 rounded-xl p-6 shadow-xl border border-purple-500/30"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-white mb-4">Bounty Settings</h2>
        
        {/* Bounty Navigation */}
        <div className="mb-4 flex gap-2 flex-wrap">
          {bounties.map((bounty, index) => (
            <button
              key={index}
              onClick={() => {
                setSelectedBountyIndex(index)
                setIsNewBounty(false)
              }}
              className={`px-3 py-1 rounded ${
                selectedBountyIndex === index && !isNewBounty
                  ? 'bg-purple-500' 
                  : 'bg-purple-800/50'
              } text-white hover:bg-purple-700 transition-colors`}
            >
              {index + 1}
            </button>
          ))}
          {!isNewBounty && (
            <button
              onClick={handleAddNew}
              className="px-3 py-1 rounded bg-purple-800/50 hover:bg-purple-700/50 text-white"
            >
              +
            </button>
          )}
        </div>

        {/* Image Upload */}
        <div className="mb-4">
          <label className="block text-white mb-2">
            Bounty Image {isNewBounty ? 'New' : selectedBountyIndex + 1}
          </label>
          <div className="h-40 bg-purple-800/50 rounded-lg overflow-hidden">
            {localState.image ? (
              <div className="relative w-full h-full group">
                <img 
                  src={localState.image} 
                  alt="Bounty Preview" 
                  className="w-full h-full object-contain"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <label className="cursor-pointer text-white hover:text-purple-300 transition-colors">
                    Change Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            ) : (
              <label className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-purple-700/50 transition-colors">
                <span className="text-white">Click to Upload Image {isNewBounty ? 'New' : selectedBountyIndex + 1}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Text Input */}
        <div className="mb-4">
          <label className="block text-white mb-2">Bounty Text (Tap Select.. to save)</label>
          <input
            type="text"
            value={localState.text}
            onChange={(e) => setLocalState(prev => ({ ...prev, text: e.target.value }))}
            className="w-full px-3 py-2 bg-purple-800/50 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Enter text (e.g., 0/2)"
          />
        </div>

        {/* Duration Slider */}
        <div className="mb-4">
          <label className="block text-white mb-2">Display Duration (seconds)</label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="1"
              max="10"
              value={localState.duration}
              onChange={(e) => setLocalState(prev => ({ ...prev, duration: Number(e.target.value) }))}
              className="flex-1 h-2 bg-purple-800/50 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-white w-8 text-center">{localState.duration}s</span>
          </div>
        </div>

        {/* Interval Slider */}
        <div className="mb-6">
          <label className="block text-white mb-2">Display Interval (seconds)</label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="5"
              max="30"
              value={localState.interval}
              onChange={(e) => setLocalState(prev => ({ ...prev, interval: Number(e.target.value) }))}
              className="flex-1 h-2 bg-purple-800/50 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-white w-8 text-center">{localState.interval}s</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between gap-3">
          {!isNewBounty && bounties[selectedBountyIndex] && (
            <button
              onClick={() => onDelete(selectedBountyIndex)}
              className="px-4 py-2 bg-red-500/50 text-white rounded-lg hover:bg-red-600/50 transition-colors"
            >
              Delete
            </button>
          )}
          <div className="flex gap-3 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-purple-800/50 text-white rounded-lg hover:bg-purple-700/50 transition-colors"
            >
              Close
            </button>
            {isNewBounty ? (
              <button 
                onClick={handleSaveNew}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
              >
                Save
              </button>
            ) : (
              <button 
  onClick={handleSelect}
  className={`px-4 py-2 text-white rounded-lg transition-colors ${
    bounties.length === 0
      ? 'bg-purple-500 hover:bg-purple-600'
      : selectedBountyIndex === currentBountyIndex
      ? 'bg-green-500 hover:bg-green-600'
      : 'bg-purple-500 hover:bg-purple-600'
  }`}
>
  {bounties.length === 0 ? 'Save' : selectedBountyIndex === currentBountyIndex ? 'Selected' : 'Select'}
</button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}


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
  const [useStoneStyle, setUseStoneStyle] = useState(false);
  const [spriteActive, setSpriteActive] = useState(false)
  const [showBountyModal, setShowBountyModal] = useState(false)
  const [shimmerActive, setShimmerActive] = useState(false)
  const [showMinusPopup, setShowMinusPopup] = useState(false);
const [showPlusPopup, setShowPlusPopup] = useState(false);
const [bounties, setBounties] = useState([])
const [currentBountyIndex, setCurrentBountyIndex] = useState(0)
  const [bountyText, setBountyText] = useState('')
  const [bountyDuration, setBountyDuration] = useState(5)
  const [bountyInterval, setBountyInterval] = useState(10)
  const [bountyActive, setBountyActive] = useState(false)
  const [showBounty, setShowBounty] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const animationFrameId = useRef(null)

  const toggleSprite = () => {
  setSpriteActive(!spriteActive)
}
  const spriteRef = useRef({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    dx: 5,
    dy: 5,
    rotation: 0
  })
  
  // Add these refs to your existing refs
const bountyIntervalRef = useRef(null)
const bountyTimeout = useRef(null)

  const [zoomState, setZoomState] = useState(() => {
    const saved = localStorage.getItem('gachaBagZoomState')
    return saved ? JSON.parse(saved) : {
      scale: 1,
      positionX: 0,
      positionY: 0
    }
  })
const Sparkle = ({ color = "white" }) => {
  const randomX = Math.random() * 100;
  const randomY = Math.random() * 100;
  const randomScale = 0.5 + Math.random() * 0.5;
  const randomDuration = 1 + Math.random() * 1;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: [0, 1, 0],
        scale: [0, randomScale, 0],
      }}
      transition={{
        duration: randomDuration,
        repeat: Infinity,
        repeatDelay: Math.random() * 2
      }}
      className="absolute w-1 h-1 bg-white rounded-full"
      style={{
        left: `${randomX}%`,
        top: `${randomY}%`,
      }}
    />
  );
};

const SparklesEffect = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(6)].map((_, i) => (
        <Sparkle key={i} />
      ))}
    </div>
  );
};
  // Add these helper functions inside your App component
const startBounty = () => {
  if (!bounties.length) {
    setIsPlaying(false);
    return;
  }
  
  if (bountyIntervalRef.current) {
    clearInterval(bountyIntervalRef.current);
  }
  if (bountyTimeout.current) {
    clearTimeout(bountyTimeout.current);
  }

  setBountyActive(true);
  setShowBounty(true);
  
  const showNextBounty = () => {
    const currentBounty = bounties[currentBountyIndex];
    setShowBounty(true);
    
    bountyTimeout.current = setTimeout(() => {
      setShowBounty(false);
      setTimeout(() => {
        setCurrentBountyIndex((prev) => (prev + 1) % bounties.length);
      }, 500); // Add a small delay before changing the index
    }, currentBounty.duration * 1000);
  };

  showNextBounty(); // Show first bounty immediately
  
  bountyIntervalRef.current = setInterval(() => {
    showNextBounty();
  }, bounties[currentBountyIndex].interval * 1000);
};

const stopBounty = () => {
  setBountyActive(false)
  if (bountyIntervalRef.current) {
    clearInterval(bountyIntervalRef.current)
  }
  if (bountyTimeout.current) {
    clearTimeout(bountyTimeout.current)
  }
  setShowBounty(false)
}

const handleBountySave = (index, settings) => {
  const newBounties = [...bounties];
  if (index === bounties.length) {
    newBounties.push(settings);
  } else {
    newBounties[index] = settings;
  }
  setBounties(newBounties);
  
  // Stop bounty if playing
  if (isPlaying) {
    stopBounty();
    setTimeout(() => {
      startBounty();
    }, 100);
  }
};

const handleBountyDelete = (index) => {
  const newBounties = bounties.filter((_, i) => i !== index)
  setBounties(newBounties)
  if (currentBountyIndex >= newBounties.length) {
    setCurrentBountyIndex(Math.max(0, newBounties.length - 1))
  }
}

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

  const CenterPopup = ({ text }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.5 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.5 }}
    className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
  >
    <div className="bg-black/50 backdrop-blur-sm px-8 py-4 rounded-xl">
      <span className="text-4xl font-bold text-white">{text}</span>
    </div>
  </motion.div>
);

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
    localStorage.removeItem('bounties') // Add this line
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
    setBounties([]) // Add this line
    setCurrentBountyIndex(0) // Add this line
  } catch (error) {
    console.error('Error resetting state:', error)
  }
}

  // Effects
 // Add this to your App component
useEffect(() => {
  try {
    const savedBounties = localStorage.getItem('bounties');
    if (savedBounties) {
      setBounties(JSON.parse(savedBounties));
    }
  } catch (error) {
    console.error('Error loading bounties:', error);
  }
}, []);

// Add this to save bounties when they change
useEffect(() => {
  if (bounties.length > 0) {
    localStorage.setItem('bounties', JSON.stringify(bounties));
  }
}, [bounties]);
useEffect(() => {
  if (isPlaying) {
    startBounty();
  } else {
    stopBounty();
  }
}, [isPlaying]);
  // Sprite animation
useEffect(() => {
  if (!spriteActive || showBountyModal) {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current)
    }
    return
  }

  const animate = () => {
    const sprite = spriteRef.current
    
    // Update position
    sprite.x += sprite.dx
    sprite.y += sprite.dy
    
    // Bounce off walls
    if (sprite.x <= 0 || sprite.x >= window.innerWidth - 100) {
      sprite.dx *= -1
      sprite.rotation = Math.random() * 360
    }
    if (sprite.y <= 0 || sprite.y >= window.innerHeight - 100) {
      sprite.dy *= -1
      sprite.rotation = Math.random() * 360
    }

    // Random direction changes
    if (Math.random() < 0.02) {
      sprite.dx = (Math.random() - 0.5) * 10
      sprite.dy = (Math.random() - 0.5) * 10
    }

    // Update DOM element
    const spriteElement = document.getElementById('bouncing-sprite')
    if (spriteElement) {
      spriteElement.style.transform = `translate(${sprite.x}px, ${sprite.y}px) rotate(${sprite.rotation}deg)`
    }

    animationFrameId.current = requestAnimationFrame(animate)
  }

  animate()

  return () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current)
    }
  }
}, [spriteActive, showBountyModal])

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

  // Add these to your existing useEffect cleanup
  useEffect(() => {
    return () => {
      if (bountyIntervalRef.current) {
        clearInterval(bountyIntervalRef.current)
      }
      if (bountyTimeout.current) {
        clearTimeout(bountyTimeout.current)
      }
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
        setUseStoneStyle(parsedState.useStoneStyle || false)
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
        markSize,
        useStoneStyle
      }
      localStorage.setItem('gachaBagState', JSON.stringify(stateToSave))
    } catch (error) {
      console.error('Error saving state:', error)
    }
  }, [bagCount, chaseCount, selectedNumbers, chaseNumbers, remainingChases, marks, markSize, isLoading, useStoneStyle])

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

  <div className="relative">
    <motion.img 
  src="/9.gif"
  alt="Blastoise"
  className="w-20 h-20 object-contain cursor-pointer"
  onClick={() => {
    handleChaseCountChange(-1);
    setShowMinusPopup(true);
    setTimeout(() => setShowMinusPopup(false), 1000);
  }}
  whileHover={{ scale: 1.1 }}
  whileTap={{ scale: 0.9 }}
/>
    <AnimatePresence>
      {showMinusPopup && (
        <motion.div
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: -20 }}
          exit={{ opacity: 0 }}
          className="absolute top-0 left-1/2 -translate-x-1/2 text-white font-bold text-xl"
        >
          -1 Chase
        </motion.div>
      )}
    </AnimatePresence>
  </div>

  <div className="relative cursor-pointer" onClick={() => setIsEditMode(!isEditMode)}>
    <img 
      src="/245.gif"
      alt="Suicune"
      className="w-26 h-26 object-contain"
    />
    <div className="absolute inset-0 rounded-full hover:bg-white/10 transition-colors" />
  </div>

  <div className="relative">
    <motion.img 
  src="/9.gif"
  alt="Blastoise"
  className="w-20 h-20 object-contain cursor-pointer"
  onClick={() => {
    handleChaseCountChange(1);
    setShowPlusPopup(true);
    setTimeout(() => setShowPlusPopup(false), 1000);
  }}
  whileHover={{ scale: 1.1 }}
  whileTap={{ scale: 0.9 }}
/>
    <AnimatePresence>
      {showPlusPopup && (
        <motion.div
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: -20 }}
          exit={{ opacity: 0 }}
          className="absolute top-0 left-1/2 -translate-x-1/2 text-white font-bold text-xl"
        >
          +1 Chase
        </motion.div>
      )}
    </AnimatePresence>
  </div>

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
        onClick={() => setShimmerActive(!shimmerActive)}
        className={`px-4 py-2 text-white rounded-lg transition-colors ${
          shimmerActive 
            ? 'bg-blue-500/50 hover:bg-blue-600/50 ring-2 ring-blue-400' 
            : 'bg-blue-500/30 hover:bg-blue-500/40'
        }`}
      >
        Shine
      </button>

      <button
        onClick={() => setShowResetConfirm(true)}
        className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg hover:shadow-lg transition-colors text-base font-medium"
      >
        Reset
      </button>
        <button
    onClick={() => setUseStoneStyle(!useStoneStyle)}
    className={`px-4 py-2 text-white rounded-lg transition-colors ${
      useStoneStyle 
        ? 'bg-slate-600 hover:bg-slate-700' 
        : 'bg-purple-600 hover:bg-purple-700'
    }`}
  >
    {useStoneStyle ? 'Stone' : 'Purple'}
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
          ? useStoneStyle
            ? 'bg-gradient-to-br from-slate-600 to-slate-800 text-gray-300'
            : 'bg-gradient-to-r from-purple-600 to-purple-800 text-white'
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
        <div className={`w-full h-0.5 ${useStoneStyle ? 'bg-gray-400' : 'bg-white'} transform rotate-45`} />
      </motion.div>
    )}
    {!selectedNumbers.has(number) && shimmerActive && <SparklesEffect />}
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

            {/* Add the popups here, right before the final closing div */}
    <AnimatePresence>
      {showMinusPopup && <CenterPopup text="-1 Chase" />}
    </AnimatePresence>
    <AnimatePresence>
      {showPlusPopup && <CenterPopup text="+1 Chase" />}
    </AnimatePresence>


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
  {/* Top navigation buttons */}
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
{/* Marker Controls - Only show when controls are visible */}
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

{/* Original Left-side Vertical Controls Container */}
<div className="absolute left-4 top-[100px] z-50 flex flex-col gap-4 bg-transparent backdrop-blur-none p-4 rounded-xl border-2 border-white/20">
  {/* Blastoise toggle button */}
  <motion.div
    onClick={toggleSprite}
    className="cursor-pointer bg-black/10 rounded-full p-2"
  >
    <img 
      src="/61.gif"
      alt="Blastoise"
      className={`w-16 h-16 object-contain opacity-40 hover:opacity-80 transition-opacity ${
        spriteActive ? 'ring-4 ring-purple-500/50 ring-opacity-50 rounded-full' : ''
      }`}
    />
  </motion.div>

  {/* Bounty Edit Button */}
  <motion.button
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.9 }}
    onClick={() => setShowBountyModal(true)}
    className="w-20 h-20 bg-black/20 hover:bg-black/30 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg transition-colors border border-white/20"
  >
    B
  </motion.button>

  {/* Enable/Disable Bounty Button */}
  {bounties.length > 0 && (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => {
        setIsPlaying(!isPlaying);
        if (!isPlaying) {
          startBounty();
        } else {
          stopBounty();
        }
      }}
      className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg transition-colors border border-white/20 ${
        isPlaying 
          ? 'bg-green-500/30 hover:bg-green-500/40' 
          : 'bg-red-500/30 hover:bg-red-500/40'
      }`}
    >
      E
    </motion.button>
  )}
</div>

{/* New Right-side Chase Controls Container */}
<div className="absolute right-4 top-[100px] z-50 flex flex-col gap-4 bg-transparent backdrop-blur-none p-4 rounded-xl border-2 border-white/20">
  <motion.button
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.9 }}
    onClick={() => {
      handleChaseCountChange(1);
      setShowPlusPopup(true);
      setTimeout(() => setShowPlusPopup(false), 1000);
    }}
    className="w-20 h-20 bg-black/20 hover:bg-black/30 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg transition-colors border border-white/20"
  >
    +1C
  </motion.button>

  <motion.button
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.9 }}
    onClick={() => {
      handleChaseCountChange(-1);
      setShowMinusPopup(true);
      setTimeout(() => setShowMinusPopup(false), 1000);
    }}
    className="w-20 h-20 bg-black/20 hover:bg-black/30 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg transition-colors border border-white/20"
  >
    -1C
  </motion.button>
</div>

{/* Add these popups to the chases view */}
<AnimatePresence>
  {showMinusPopup && <CenterPopup text="-1 Chase" />}
</AnimatePresence>
<AnimatePresence>
  {showPlusPopup && <CenterPopup text="+1 Chase" />}
</AnimatePresence>
{/* Bouncing sprite */}
{spriteActive && (
  <motion.div
    id="bouncing-sprite"
    className="fixed z-20 w-20 h-20"
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    exit={{ scale: 0 }}
  >
    <img 
      src="/bullseye.png"
      alt="Target"
      className="w-full h-full object-contain opacity-80"
    />
  </motion.div>
)}



  {/* Chases Count Overlay */}
  <AnimatePresence>
    {!controlsVisible && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute top-safe-4 left-[400px] z-40 pointer-events-none"
      >
        <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md rounded-lg px-4 py-2">
          <h1 
            className="text-3xl font-black italic tracking-wider"
            style={{ 
              fontFamily: 'Arial Black, Arial, sans-serif',
              color: 'white',
              textShadow: '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 3px 3px 0 rgba(0,0,0,0.5)'
            }}
          >
            {bagCount - selectedNumbers.size} Bags / Hit Ratio: {calculateHitRatio()}
          </h1>
        </div>
      </motion.div>
    )}
  </AnimatePresence>

  {/* Main content area */}
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

{/* Bounty Modal */}
<AnimatePresence>
  {showBountyModal && (
    <BountyModal
  isOpen={showBountyModal}
  onClose={() => setShowBountyModal(false)}
  onSave={handleBountySave}
  onDelete={handleBountyDelete}
  bounties={bounties}
  currentBountyIndex={currentBountyIndex}
  setCurrentBountyIndex={setCurrentBountyIndex} // Add this line
/>
  )}
</AnimatePresence>

{/* Bounty Display */}
<AnimatePresence>
  {showBounty && bounties[currentBountyIndex] && (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-30 flex items-center justify-center pointer-events-none"
    >
      <div className="bg-black/70 backdrop-blur-sm p-6 rounded-xl">
        <img 
          src={bounties[currentBountyIndex].image} 
          alt="Bounty" 
          className="max-w-md max-h-96 object-contain mb-4"
        />
        <div className="text-3xl font-bold text-white text-center">
          {bounties[currentBountyIndex].text}
        </div>
      </div>
    </motion.div>
  )}
</AnimatePresence>
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