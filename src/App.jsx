


import { motion, AnimatePresence } from 'framer-motion'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import { useState, useEffect, useRef, useCallback } from 'react'

// Add CSS for flashing border animation
const flashingBorderStyles = `
  @keyframes flashBorder {
    0% { border-color: black; }
    100% { border-color: white; }
  }
`;

// Inject the styles into the document head
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = flashingBorderStyles;
  document.head.appendChild(styleSheet);
}
const IMAGE_STORAGE_KEY = 'storedImages';
const MAX_STORAGE_SIZE = 4.5 * 1024 * 1024; // 4.5MB to be safe under 5MB limit

// Utility to get current storage usage - only counts app-specific data
const getStorageUsage = () => {
  const relevantKeys = [
    'gachaBagImage',
    'insuranceImages',
    'bounties',
    'vintageBagImages',
    'gachaBagState',
    'vintageBagCount',
    'vintageBagsUsers'
  ];

  let totalSize = 0;
  for (let key of relevantKeys) {
    const value = localStorage.getItem(key);
    if (value) {
      totalSize += value.length * 2; // Multiply by 2 for UTF-16 encoding
    }
  }
  return totalSize;
};
// Optional: Add a debug function to see what's taking up space
const debugStorageUsage = () => {
  const usage = {};
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      const size = localStorage[key].length * 2;
      usage[key] = (size / (1024 * 1024)).toFixed(2) + ' MB';
    }
  }
  console.log('Storage usage breakdown:', usage);
};

// Utility to get total size of stored images
const getImageStorageSize = () => {
  const storedImages = JSON.parse(localStorage.getItem(IMAGE_STORAGE_KEY) || '{}');
  return Object.values(storedImages).reduce((total, img) => total + (img?.length || 0) * 2, 0);
};

// Image processing function with size optimization
const processImage = async (file, options = {}) => {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.7,
    targetSize = 500 * 1024 // 500KB target size
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          // Calculate dimensions maintaining aspect ratio
          let { width, height } = calculateAspectRatioFit(
            img.width,
            img.height,
            maxWidth,
            maxHeight
          );

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            throw new Error('Failed to get canvas context');
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Progressive quality reduction if needed
          let currentQuality = quality;
          let output = canvas.toDataURL('image/jpeg', currentQuality);
          
          while (output.length > targetSize && currentQuality > 0.1) {
            currentQuality -= 0.1;
            output = canvas.toDataURL('image/jpeg', currentQuality);
          }

          resolve({
            dataUrl: output,
            width,
            height,
            size: output.length,
            quality: currentQuality
          });

        } catch (err) {
          reject(new Error('Image processing failed: ' + err.message));
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

// Main upload function
const uploadImage = async (file, key, options = {}) => {
  try {
    // Process the image
    const processed = await processImage(file, options);
    
    // Check if we need to store in localStorage
    const currentUsage = getStorageUsage();
    const willFitInStorage = (currentUsage + processed.dataUrl.length * 2) < MAX_STORAGE_SIZE;

    // Calculate what the total storage would be after storing this image
    const totalStorageAfterUpload = currentUsage + processed.dataUrl.length * 2;

    // Return the processed image data and storage info
    return {
      ...processed,
      storedLocally: willFitInStorage,
      totalStorageUsed: totalStorageAfterUpload,
      warning: !willFitInStorage ? 'Image exceeds storage limit and will not persist after refresh' : null
    };

  } catch (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }
};

// Storage popup component
const StoragePopup = ({ totalSize, imageSize, isVisible, onClose }) => {
  const remainingStorage = MAX_STORAGE_SIZE - totalSize;
  const isNearLimit = remainingStorage < (MAX_STORAGE_SIZE * 0.1); // 10% remaining

  // Add debug button
  const showDebug = () => {
    const usage = {};
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        const size = localStorage[key].length * 2;
        usage[key] = (size / (1024 * 1024)).toFixed(2) + ' MB';
      }
    }
    console.log('Storage usage breakdown:', usage);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-black/70 backdrop-blur-sm px-6 py-4 rounded-xl"
        >
          <div className="text-white text-center space-y-2">
            <div className="flex justify-between items-center mb-2">
              <div className="font-bold text-lg">Storage Usage</div>
              <div className="flex gap-2 items-center">
                <button 
                  onClick={showDebug}
                  className="text-white/70 hover:text-white transition-colors text-sm px-2"
                >
                  Debug
                </button>
                <button 
                  onClick={onClose}
                  className="text-white/70 hover:text-white transition-colors w-8 h-8 flex items-center justify-center text-xl font-bold rounded-full hover:bg-white/10"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <div className="text-sm opacity-70">App Storage</div>
                <div>{(totalSize / (1024 * 1024)).toFixed(2)} MB</div>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div>
                <div className="text-sm opacity-70">Last Image</div>
                <div>{(imageSize / (1024 * 1024)).toFixed(2)} MB</div>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div>
                <div className="text-sm opacity-70">Remaining</div>
                <div className={isNearLimit ? 'text-red-400' : ''}>
                  {(4.5 - (totalSize / (1024 * 1024))).toFixed(2)} MB
                </div>
              </div>
            </div>
            {isNearLimit && (
              <div className="text-red-400 text-sm mt-2">
                Warning: Storage space is running low. New images may not persist after refresh.
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Helper function to calculate aspect ratio
const calculateAspectRatioFit = (srcWidth, srcHeight, maxWidth, maxHeight) => {
  const ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
  return {
    width: Math.round(srcWidth * ratio),
    height: Math.round(srcHeight * ratio)
  };
};

const BountyModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  bounties,
  currentBountyIndex,
  setCurrentBountyIndex, 
  onDelete,
  setStorageInfo,
  setShowStoragePopup
}) => {
  const [localState, setLocalState] = useState({
    image: bounties[currentBountyIndex]?.image || null,
    text: bounties[currentBountyIndex]?.text || '',
    duration: bounties[currentBountyIndex]?.duration || 5,
    interval: bounties[currentBountyIndex]?.interval || 10
  });

  const [selectedBountyIndex, setSelectedBountyIndex] = useState(currentBountyIndex);
  const [isNewBounty, setIsNewBounty] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setLocalState({
        image: bounties[selectedBountyIndex]?.image || null,
        text: bounties[selectedBountyIndex]?.text || '',
        duration: bounties[selectedBountyIndex]?.duration || 5,
        interval: bounties[selectedBountyIndex]?.interval || 10
      });
      setError(null);
      setIsDirty(false);
    }
  }, [isOpen, selectedBountyIndex, bounties]);

// For bounty images (in BountyModal)
const handleImageUpload = useCallback(async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  setIsProcessing(true);
  setError(null);

  try {
    const result = await uploadImage(file, `bounty-${Date.now()}`, {
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 0.7,
      targetSize: 500 * 1024
    });

    setStorageInfo({
      totalSize: result.totalStorageUsed,
      imageSize: result.size
    });
    setShowStoragePopup(true);

    setLocalState(prev => ({
      ...prev,
      image: result.dataUrl
    }));
    setIsDirty(true);
    setIsProcessing(false);

  } catch (error) {
    console.error('Upload failed:', error);
    setError('Failed to process image. Please try another image.');
    setIsProcessing(false);
  }

  if (fileInputRef.current) {
    fileInputRef.current.value = '';
  }
}, []);

  const handleDeleteImage = () => {
    if (confirm('Are you sure you want to delete this image?')) {
      setLocalState(prev => ({
        ...prev,
        image: null
      }));
      setIsDirty(true);
      
      // If this is an existing bounty, update it in localStorage
      if (!isNewBounty) {
        const updatedBounties = [...bounties];
        updatedBounties[selectedBountyIndex] = {
          ...updatedBounties[selectedBountyIndex],
          image: null
        };
        localStorage.setItem('bounties', JSON.stringify(updatedBounties));
      }
    }
  };

  const handleAddNew = () => {
    if (isDirty) {
      if (!confirm('You have unsaved changes. Continue anyway?')) {
        return;
      }
    }
    setIsNewBounty(true);
    const newIndex = bounties.length;
    setSelectedBountyIndex(newIndex);
    setLocalState({
      image: null,
      text: '',
      duration: 5,
      interval: 10
    });
    setIsDirty(false);
    setError(null);
  };

  const handleSaveNew = () => {
    if (!localState.image && !localState.text.trim()) {
      setError('Please add an image or text before saving');
      return;
    }

    try {
      onSave(bounties.length, localState);
      setIsNewBounty(false);
      setLocalState({
        image: null,
        text: '',
        duration: 5,
        interval: 10
      });
      setIsDirty(false);
      setError(null);
    } catch (err) {
      setError('Failed to save bounty');
    }
  };

  const handleSelect = () => {
    if (isDirty) {
      if (!confirm('You have unsaved changes. Save before selecting?')) {
        return;
      }
      try {
        onSave(selectedBountyIndex, localState);
      } catch (err) {
        setError('Failed to save changes');
        return;
      }
    }

    if (localState.image || localState.text.trim()) {
      try {
        setCurrentBountyIndex(selectedBountyIndex);
        setError(null);
        setIsDirty(false);
      } catch (err) {
        setError('Failed to select bounty');
      }
    }
  };

  const handleSaveChanges = () => {
    if (!localState.image && !localState.text.trim()) {
      setError('Please add an image or text before saving');
      return;
    }

    try {
      onSave(selectedBountyIndex, localState);
      setIsDirty(false);
      setError(null);
    } catch (err) {
      setError('Failed to save changes');
    }
  };

  const handleDeleteBounty = () => {
    if (confirm('Are you sure you want to delete this bounty?')) {
      try {
        onDelete(selectedBountyIndex);
        setError(null);
        
        // Update localStorage after deletion
        const updatedBounties = bounties.filter((_, i) => i !== selectedBountyIndex);
        localStorage.setItem('bounties', JSON.stringify(updatedBounties));
        
        // Reset state if needed
        if (updatedBounties.length === 0) {
          setLocalState({
            image: null,
            text: '',
            duration: 5,
            interval: 10
          });
        }
      } catch (err) {
        setError('Failed to delete bounty');
      }
    }
  };

  const handleClose = () => {
    if (isDirty) {
      if (!confirm('You have unsaved changes. Discard changes?')) {
        return;
      }
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-11/12 md:w-1/4 min-w-[300px] max-h-[90vh] overflow-y-auto bg-gradient-to-br from-purple-900/90 to-purple-700/90 rounded-xl p-6 shadow-xl border border-purple-500/30"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-white mb-4">
          {isNewBounty ? 'New Bounty' : `Bounty ${selectedBountyIndex + 1}`}
          {isDirty && ' *'}
        </h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-500/50 text-white rounded-lg">
            {error}
          </div>
        )}

        {isProcessing && (
          <div className="mb-4 p-3 bg-blue-500/50 text-white rounded-lg">
            Processing image...
          </div>
        )}
        
        {/* Bounty Navigation */}
        <div className="mb-4 flex gap-2 flex-wrap">
          {bounties.map((bounty, index) => (
            <button
              key={index}
              onClick={() => {
                if (isDirty) {
                  if (!confirm('You have unsaved changes. Continue anyway?')) {
                    return;
                  }
                }
                setSelectedBountyIndex(index);
                setIsNewBounty(false);
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
    {isProcessing ? (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-white">Processing image...</div>
      </div>
    ) : localState.image ? (
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
              onChange={(e) => handleImageUpload(e, 'bounty')}
              className="hidden"
              disabled={isProcessing}
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
          disabled={isProcessing}
        />
      </label>
    )}
  </div>
</div>

        {/* Text Input */}
        <div className="mb-4">
          <label className="block text-white mb-2">Bounty Text</label>
          <input
            type="text"
            value={localState.text}
            onChange={(e) => {
              setLocalState(prev => ({ ...prev, text: e.target.value }));
              setIsDirty(true);
            }}
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
              onChange={(e) => {
                setLocalState(prev => ({ ...prev, duration: Number(e.target.value) }));
                setIsDirty(true);
              }}
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
              onChange={(e) => {
                setLocalState(prev => ({ ...prev, interval: Number(e.target.value) }));
                setIsDirty(true);
              }}
              className="flex-1 h-2 bg-purple-800/50 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-white w-8 text-center">{localState.interval}s</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between gap-3">
          {!isNewBounty && bounties[selectedBountyIndex] && (
            <button
              onClick={handleDeleteBounty}
              className="px-4 py-2 bg-red-500/50 text-white rounded-lg hover:bg-red-600/50 transition-colors"
            >
              Delete
            </button>
          )}
          <div className="flex gap-3 ml-auto">
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-purple-800/50 text-white rounded-lg hover:bg-purple-700/50 transition-colors"
            >
              Close
            </button>
            {isNewBounty ? (
              <button 
                onClick={handleSaveNew}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                disabled={!isDirty}
              >
                Save New
              </button>
            ) : (
              <>
                {isDirty && (
                  <button 
                    onClick={handleSaveChanges}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                  >
                    Save Changes
                  </button>
                )}
                <button 
                  onClick={handleSelect}
                  className={`px-4 py-2 text-white rounded-lg transition-colors ${
                    selectedBountyIndex === currentBountyIndex
                      ? 'bg-blue-500 hover:bg-blue-600'
                      : 'bg-purple-500 hover:bg-purple-600'
                  }`}
                  disabled={isDirty}
                >
                  {selectedBountyIndex === currentBountyIndex ? 'Selected' : 'Select'}
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};


function App() {
  // State declarations
const [showStoragePopup, setShowStoragePopup] = useState(false);
const [storageInfo, setStorageInfo] = useState({ totalSize: 0, imageSize: 0 });
  const [animationKey, setAnimationKey] = useState(0);
  const [showProbCalc, setShowProbCalc] = useState(false);
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
const [shimmerLevel, setShimmerLevel] = useState(0) // 0 = off, 1-3 = shine levels
  const [showMinusPopup, setShowMinusPopup] = useState(false);
  const [showPlusPopup, setShowPlusPopup] = useState(false);
  const [queueCount, setQueueCount] = useState(0);
  const [showQueueMinusPopup, setShowQueueMinusPopup] = useState(false);
  const [showQueuePlusPopup, setShowQueuePlusPopup] = useState(false);
  const [shamrockActive, setShamrockActive] = useState(false);
  const [shamrocks, setShamrocks] = useState([]);
  const [currentShamrockImageIndex, setCurrentShamrockImageIndex] = useState(0);

  // Shamrock images array for cycling
  const shamrockImages = [
    '/burstshrock.webp',
    '/coinshrock.webp', 
    '/pinkshrock.webp',
    '/rshrock.webp',
    '/shinyshrock.webp'
  ];

  // Dragonair circle states
  const [dragonairCircleActive, setDragonairCircleActive] = useState(false);
  const [currentDragonairImageIndex, setCurrentDragonairImageIndex] = useState(0);
  const [dragonairShamrocks, setDragonairShamrocks] = useState([]);
  const [fontSizeLevel, setFontSizeLevel] = useState(2); // 0-4, where 2 is default
  const [statsFontSizeLevel, setStatsFontSizeLevel] = useState(1); // 0-3, where 1 is default (current size)
  
  // Last clicked box flashing state
  const [lastClickedBox, setLastClickedBox] = useState(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const flashTimeoutRef = useRef(null);

  // Dragonair circle images array for cycling
  const dragonairCircleImages = [
    '/burstshrock.webp',
    '/coinshrock.webp',
    '/pinkshrock.webp',
    '/rshrock.webp',
    '/shinyshrock.webp',
    '/chibydragonite.webp',
    '/frontaldragonite.webp'
  ];
const [bounties, setBounties] = useState([])
const [currentBountyIndex, setCurrentBountyIndex] = useState(0)
  const [bountyText, setBountyText] = useState('')
  const [bountyDuration, setBountyDuration] = useState(5)
  const [bountyInterval, setBountyInterval] = useState(10)
  const [bountyActive, setBountyActive] = useState(false)
  const [showBounty, setShowBounty] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const animationFrameId = useRef(null)
  const shamrockIntervalRef = useRef(null)
  const [vintageImages, setVintageImages] = useState(() => {
  const saved = localStorage.getItem('vintageBagImages');
  return saved ? JSON.parse(saved) : [null, null, null];
});
const [currentImageIndex, setCurrentImageIndex] = useState(0);
const [isGalleryEditMode, setIsGalleryEditMode] = useState(false);
const [hasImages, setHasImages] = useState(false);

    const targetImages = [
  '/bullseye.png',
  '/blueseye.png',
  '/dottedbullseye.png',
  '/dusk.png',
  '/fairy.png',
  '/heal.png',
  '/master.png',
  '/poke.png'
];
const [currentTargetIndex, setCurrentTargetIndex] = useState(0);


const ProbabilityCalculator = ({ isOpen, onClose, totalBags, totalChases }) => {
  const [bagsDrawn, setBagsDrawn] = useState(3);
  const [chasesHit, setChasesHit] = useState(2);

  // Get the actual remaining bags from the parent component
  const remainingBags = totalBags;

  // Prevent clicks inside modal from closing it
  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  const calculateProbability = (n, k) => {
    // n = bags drawn, k = chases wanted
    const N = remainingBags; // remaining bags instead of total bags
    const K = totalChases; // total chases
    
    // If trying to draw more bags than available or more chases than exist
    if (n > N || k > K || n < k) return '0.00';
    
    // Calculate combinations
    const numerator = combination(K, k) * combination(N - K, n - k);
    const denominator = combination(N, n);
    
    return (numerator / denominator * 100).toFixed(2);
  };

  const combination = (n, r) => {
    if (r > n) return 0;
    if (r === 0) return 1;
    return factorial(n) / (factorial(r) * factorial(n - r));
  };

  const factorial = (n) => {
    if (n === 0) return 1;
    let result = 1;
    for (let i = 1; i <= n; i++) {
      result *= i;
    }
    return result;
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-96 bg-gradient-to-br from-blue-900/90 to-blue-700/90 rounded-xl p-6 shadow-xl border border-blue-500/30"
        onClick={handleModalClick}
      >
        <h2 className="text-2xl font-bold text-white mb-6">Probability Calculator</h2>
        
        <div className="space-y-6">
          {/* Current Stats */}
          <div className="bg-black/20 p-4 rounded-lg">
            <p className="text-white">Total Chases: {totalChases}</p>
            <p className="text-white mb-2">Bags Left: {remainingBags}</p>
          </div>

          {/* Common Scenarios */}
          <div className="bg-black/20 p-4 rounded-lg space-y-2">
            <h3 className="text-white font-bold mb-3">Common Scenarios:</h3>
            <p className="text-white">0/2: {calculateProbability(2, 0)}%</p>
            <p className="text-white">0/3: {calculateProbability(3, 0)}%</p>
            <p className="text-white">1/3: {calculateProbability(3, 1)}%</p>
            <p className="text-white">2/3: {calculateProbability(3, 2)}%</p>
            <p className="text-white">3/3: {calculateProbability(3, 3)}%</p>
          </div>

          {/* Custom Calculator */}
          <div className="bg-black/20 p-4 rounded-lg space-y-4">
            <h3 className="text-white font-bold">Custom Calculator:</h3>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-white text-sm">Chases Hit</label>
                <input
                  type="number"
                  value={chasesHit}
                  onChange={(e) => {
                    const value = e.target.value === '' ? '' : parseInt(e.target.value);
                    setChasesHit(value === '' ? 0 : Math.min(totalChases, Math.max(0, value)));
                  }}
                  className="w-full px-3 py-2 bg-blue-800/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex-1">
                <label className="text-white text-sm">Bags Bought</label>
                <input
                  type="number"
                  value={bagsDrawn}
                  onChange={(e) => {
                    const value = e.target.value === '' ? '' : parseInt(e.target.value);
                    setBagsDrawn(value === '' ? 0 : Math.min(remainingBags, Math.max(0, value)));
                  }}
                  className="w-full px-3 py-2 bg-blue-800/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="bg-black/30 p-3 rounded-lg">
              <p className="text-white text-center">
                Probability: {calculateProbability(bagsDrawn, chasesHit)}%
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full px-4 py-2 bg-blue-600/50 hover:bg-blue-500/50 text-white rounded-lg transition-colors"
        >
          Close
        </button>
      </motion.div>
    </motion.div>
  );
};

const toggleSprite = () => {
  if (spriteActive) {
    // If turning off, just deactivate
    setSpriteActive(false);
  } else {
    // If turning on, cycle to next image
    setCurrentTargetIndex((prev) => (prev + 1) % targetImages.length);
    setSpriteActive(true);
  }
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
const Sparkle = ({ speed = 1 }) => {
  const randomX = Math.random() * 100;
  const randomY = Math.random() * 100;
  
  // Adjusted base sizes:
  // Level 1 (previously level 2): 2px
  // Level 2 (new middle ground): 2.5px
  // Level 3: 3px
  const baseSize = speed === 1 ? 2 : speed === 2 ? 2.5 : 3;
  
  // Adjusted scales for each level
  const randomScale = (0.5 + Math.random() * 0.5) * baseSize;
  
  // Adjusted animation speeds:
  // Level 1: Moderate (previously level 2)
  // Level 2: Faster
  // Level 3: Fastest
  const randomDuration = (1 + Math.random()) / (speed === 1 ? 1.2 : speed === 2 ? 1.5 : 2);

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
        // Adjusted delays for each level
        repeatDelay: Math.random() * (speed === 1 ? 0.5 : speed === 2 ? 0.3 : 0.2)
          ? Math.random() * 2 // Original delay for level 1
          : Math.random() * (0.5 / speed) // Shorter delay for higher levels
      }}
      className={`absolute rounded-full bg-white`}
      style={{
        left: `${randomX}%`,
        top: `${randomY}%`,
        width: `${baseSize}px`,
        height: `${baseSize}px`,
      }}
    />
  );
};

const SparklesEffect = ({ level }) => {
  // Keep original count for level 1
  const sparkleCount = level === 1 ? 6 : level === 2 ? 12 : 18;
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(sparkleCount)].map((_, i) => (
        <Sparkle 
          key={i} 
          speed={level}
        />
      ))}
    </div>
  );
};
// Shamrock system functions
const createShamrock = () => {
  const gridContainer = document.querySelector('.grid');
  if (!gridContainer) return;
  
  const containerRect = gridContainer.getBoundingClientRect();
  const newShamrock = {
    id: Date.now() + Math.random(),
    x: Math.random() * (containerRect.width - 120), // Account for shamrock size
    y: Math.random() * (containerRect.height - 120),
    opacity: 1
  };
  
  setShamrocks(prev => [...prev, newShamrock]);
  
  // Remove shamrock after 2-4 seconds
  setTimeout(() => {
    setShamrocks(prev => prev.filter(s => s.id !== newShamrock.id));
  }, 2000 + Math.random() * 2000);
};

const startShamrockSystem = () => {
  if (shamrockIntervalRef.current) {
    clearInterval(shamrockIntervalRef.current);
  }
  
  shamrockIntervalRef.current = setInterval(() => {
    createShamrock();
  }, 1000 + Math.random() * 2000); // Random interval between 1-3 seconds
};

const stopShamrockSystem = () => {
  if (shamrockIntervalRef.current) {
    clearInterval(shamrockIntervalRef.current);
    shamrockIntervalRef.current = null;
  }
  setShamrocks([]);
};

// Dragonair shamrock system functions
const createDragonairShamrock = () => {
  const gridContainer = document.querySelector('.grid');
  if (!gridContainer) return;
  
  const containerRect = gridContainer.getBoundingClientRect();
  const newShamrock = {
    id: Date.now() + Math.random(),
    x: Math.random() * (containerRect.width - 120), // Account for shamrock size
    y: Math.random() * (containerRect.height - 120),
    opacity: 1
  };
  
  setDragonairShamrocks(prev => [...prev, newShamrock]);
  
  // Remove shamrock after 2-4 seconds
  setTimeout(() => {
    setDragonairShamrocks(prev => prev.filter(s => s.id !== newShamrock.id));
  }, 2000 + Math.random() * 2000);
};

const dragonairIntervalRef = useRef(null);

const startDragonairShamrockSystem = () => {
  if (dragonairIntervalRef.current) {
    clearInterval(dragonairIntervalRef.current);
  }
  
  dragonairIntervalRef.current = setInterval(() => {
    createDragonairShamrock();
    // Cycle to next image each time a shamrock is created
    setCurrentDragonairImageIndex((prev) => (prev + 1) % dragonairCircleImages.length);
  }, 1000 + Math.random() * 2000); // Random interval between 1-3 seconds
};

const stopDragonairShamrockSystem = () => {
  if (dragonairIntervalRef.current) {
    clearInterval(dragonairIntervalRef.current);
    dragonairIntervalRef.current = null;
  }
  setDragonairShamrocks([]);
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
  const newCount = bagCount + increment;
  
  if (newCount < 1 || newCount > 100) return;
  
  if (increment < 0) {
    const wouldBeInvalid = Array.from(selectedNumbers).some(num => num > newCount);
    if (wouldBeInvalid) {
      alert('Cannot reduce bags: Some selected numbers would become invalid');
      return;
    }
  }
  
  setBagCount(newCount);
  setNumbers(Array.from({ length: newCount }, (_, i) => i + 1));
};

  const handleChaseCountChange = (increment) => {
    const newCount = Math.max(0, Math.min(100, chaseCount + increment))
    const currentRedBoxes = chaseNumbers.size
    
    // If reducing chases, check if new count would be below current red marked boxes
    if (increment < 0) {
      if (newCount < currentRedBoxes) {
        alert(`Cannot reduce chases below ${currentRedBoxes}: You have ${currentRedBoxes} red marked boxes`)
        return
      }
      // When reducing chases, don't clear red boxes - just update counts
      setChaseCount(newCount)
      setRemainingChases(newCount - currentRedBoxes) // Adjust remaining chases
    } else {
      // When increasing chases, keep red boxes and just add to remaining chases
      setChaseCount(newCount)
      setRemainingChases(newCount - currentRedBoxes) // Keep existing red boxes, add to remaining
    }
    setIsCooked(false)
  }

  // Queue management handlers
  const handleQueueChange = (increment) => {
    if (increment > 0) {
      // Plus button: decrease queue (if > 0), increase visible bags left
      if (queueCount > 0) {
        setQueueCount(prev => prev - 1)
        // Queue operations should NOT mark/unmark any boxes
        // Only affects the display calculation
      }
      setShowQueuePlusPopup(true)
      setTimeout(() => setShowQueuePlusPopup(false), 1000)
    } else if (increment < 0) {
      // Minus button: increase queue, decrease visible bags left
      setQueueCount(prev => prev + 1)
      // Queue operations should NOT mark/unmark any boxes
      // Only affects the display calculation
      setShowQueueMinusPopup(true)
      setTimeout(() => setShowQueueMinusPopup(false), 1000)
    }
  }

  // Font size control handlers
  const handleFontSizeChange = (increment) => {
    setFontSizeLevel(prev => Math.max(0, Math.min(8, prev + increment)))
  }

  // Stats font size control handlers
  const handleStatsFontSizeChange = (increment) => {
    setStatsFontSizeLevel(prev => Math.max(0, Math.min(3, prev + increment)))
  }

  // Get font size class based on level (0-8, where 2 is default)
  const getFontSizeClass = () => {
    const fontSizes = [
      'text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl',      // Level 0 - smallest
      'text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl',     // Level 1 - small
      'text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl',      // Level 2 - default (current)
      'text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl',     // Level 3 - large
      'text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl',    // Level 4 - larger
      'text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl',    // Level 5 - very large
      'text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl',    // Level 6 - extra large
      'text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl',    // Level 7 - huge
      'text-6xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-10xl'    // Level 8 - massive
    ]
    return fontSizes[fontSizeLevel]
  }

  // Get stats font size class based on level (0-3, where 1 is default/current)
  const getStatsFontSizeClass = () => {
    const statsFontSizes = [
      'text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl',      // Level 0 - smallest
      'text-base sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl',    // Level 1 - default (current size)
      'text-lg sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl',     // Level 2 - larger
      'text-xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl'      // Level 3 - largest
    ]
    return statsFontSizes[statsFontSizeLevel]
  }
  

 const toggleNumber = (number) => {
  const newSelected = new Set(selectedNumbers);
  const newChases = new Set(chaseNumbers);

  if (!newSelected.has(number)) {
    // Adding a new number - always mark the box
    newSelected.add(number);
    
    // If there's a queue, subtract from it (but still mark the box)
    if (queueCount > 0) {
      setQueueCount(prev => prev - 1);
    }
  } else if (!newChases.has(number)) {
    // Converting to chase
    newChases.add(number);
    setRemainingChases(prev => prev - 1);
  } else {
    // Deselecting completely - add back to queue when unmarking
    newSelected.delete(number);
    newChases.delete(number);
    setRemainingChases(prev => prev + 1);
    // Add back to queue when unmarking
    setQueueCount(prev => prev + 1);
  }

  setSelectedNumbers(newSelected);
  setChaseNumbers(newChases);
  
  // Set up flashing for the last clicked box
  setLastClickedBox(number);
  setIsFlashing(true);
  
  // Clear any existing timeout
  if (flashTimeoutRef.current) {
    clearTimeout(flashTimeoutRef.current);
  }
  
  // Stop flashing after 5 seconds
  flashTimeoutRef.current = setTimeout(() => {
    setIsFlashing(false);
    setLastClickedBox(null);
  }, 5000);
};

  const calculateHitRatio = () => {
    const remainingBags = bagCount - selectedNumbers.size
    if (remainingBags === 0) return '0%'
    const ratio = (remainingChases / remainingBags) * 100
    return `${ratio.toFixed(1)}%`
  }
// For prize images
const handlePrizeImageUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const result = await uploadImage(file, `prize-${Date.now()}`, {
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 0.7,
      targetSize: 500 * 1024
    });

    setStorageInfo({
      totalSize: result.totalStorageUsed,
      imageSize: result.size
    });
    setShowStoragePopup(true);

    setPrizeImage(result.dataUrl);
    if (result.storedLocally) {
      localStorage.setItem('gachaBagImage', result.dataUrl);
    }

  } catch (error) {
    console.error('Upload failed:', error);
    alert('Failed to process image. Please try a smaller image.');
  }
};

// For insurance images
const handleInsuranceImageUpload = async (index, e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const result = await uploadImage(file, `insurance-${index}-${Date.now()}`, {
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 0.7,
      targetSize: 500 * 1024
    });

    setStorageInfo({
      totalSize: result.totalStorageUsed,
      imageSize: result.size
    });
    setShowStoragePopup(true);

    const newImages = [...insuranceImages];
    newImages[index] = result.dataUrl;
    setInsuranceImages(newImages);
    
    if (result.storedLocally) {
      localStorage.setItem('insuranceImages', JSON.stringify(newImages));
    }

  } catch (error) {
    console.error('Upload failed:', error);
    alert('Failed to process image. Please try a smaller image.');
  }
};

const handleImageUpload = useCallback(async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    // Process the image
    const result = await uploadImage(file, `prize-${Date.now()}`, {
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 0.7,
      targetSize: 500 * 1024
    });

    setStorageInfo({
      totalSize: result.totalStorageUsed,
      imageSize: result.size
    });
    setShowStoragePopup(true);

    // Update state and localStorage
    setPrizeImage(result.dataUrl);
    if (result.storedLocally) {
      localStorage.setItem('gachaBagImage', result.dataUrl);
    }

  } catch (error) {
    console.error('Image processing error:', error);
    alert('Failed to process image. Please try a smaller image.');
  }
}, [setStorageInfo, setShowStoragePopup]);

// Helper function to maintain aspect ratio
const calculateAspectRatioFit = (srcWidth, srcHeight, maxWidth, maxHeight) => {
  const ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
  return {
    width: Math.round(srcWidth * ratio),
    height: Math.round(srcHeight * ratio)
  };
};

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



const VintageBags = ({ setCurrentView }) => {
  // Original vintage bags state
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('vintageBagsUsers');
    if (saved) {
      const parsedUsers = JSON.parse(saved);
      return parsedUsers.map(user => ({
        ...user,
        numbers: new Set(user.numbers)
      }));
    }
    return [];
  });

  const [currentUser, setCurrentUser] = useState({ name: '', numbers: new Set() });
  const [isEditMode, setIsEditMode] = useState(false);
  const [showList, setShowList] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [vintageBagCount, setVintageBagCount] = useState(() => {
    const saved = localStorage.getItem('vintageBagCount');
    return saved ? parseInt(saved) : 50;
  });

  // Image gallery state
  const [vintageImages, setVintageImages] = useState(() => {
    const saved = localStorage.getItem('vintageBagImages');
    return saved ? JSON.parse(saved) : [null, null, null];
  });
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isGalleryEditMode, setIsGalleryEditMode] = useState(false);
  const [hasImages, setHasImages] = useState(false);

  // Effects for persistence
  useEffect(() => {
    const hasAnyImages = vintageImages.some(img => img !== null);
    setHasImages(hasAnyImages);
    if (!hasAnyImages) {
      setIsGalleryEditMode(true);
    }
  }, [vintageImages]);

  useEffect(() => {
    localStorage.setItem('vintageBagImages', JSON.stringify(vintageImages));
  }, [vintageImages]);

  useEffect(() => {
    localStorage.setItem('vintageBagsUsers', JSON.stringify(
      users.map(user => ({
        ...user,
        numbers: Array.from(user.numbers)
      }))
    ));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('vintageBagCount', vintageBagCount.toString());
  }, [vintageBagCount]);

  // Helper function for gallery navigation
  const getNextValidIndex = (currentIndex, direction) => {
    let newIndex = currentIndex;
    let count = 0;
    do {
      newIndex = (newIndex + direction + 3) % 3;
      count++;
      if (vintageImages[newIndex] !== null) {
        return newIndex;
      }
    } while (count < 3);
    return currentIndex;
  };

  // Handlers
// Updated Vintage Bags image upload handler
const handleVintageImageUpload = async (index, e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const result = await uploadImage(file, `vintage-${index}-${Date.now()}`, {
      maxWidth: 800,
      maxHeight: 800,
      quality: 0.5,
      targetSize: 500 * 1024
    });

    setStorageInfo({
      totalSize: result.totalStorageUsed,
      imageSize: result.size
    });
    setShowStoragePopup(true);

    const newImages = [...vintageImages];
    newImages[index] = result.dataUrl;
    setVintageImages(newImages);
    setCurrentImageIndex(index);

    if (result.storedLocally) {
      try {
        localStorage.setItem('vintageBagImages', JSON.stringify(newImages));
      } catch (error) {
        console.error('Storage error:', error);
      }
    }

  } catch (error) {
    console.error('Upload failed:', error);
    alert('Failed to process image. Please try a smaller image.');
  }
};
  const handleNumberClick = (number) => {
    if (!currentUser) return;
    
    const newNumbers = new Set(currentUser.numbers);
    if (newNumbers.has(number)) {
      newNumbers.delete(number);
    } else {
      newNumbers.add(number);
    }
    setCurrentUser({ ...currentUser, numbers: newNumbers });
  };

  const handleSave = () => {
    if (!currentUser.name.trim()) {
      alert('Please enter a name');
      return;
    }

    const isDuplicateName = users.some(user => 
      user.name.toLowerCase() === currentUser.name.toLowerCase() && 
      (!editingUser || editingUser.name.toLowerCase() !== currentUser.name.toLowerCase())
    );

    if (isDuplicateName) {
      alert('A user with this name already exists. Please choose a different name.');
      return;
    }

    const userToSave = {
      ...currentUser,
      numbers: currentUser.numbers // Keep as Set
    };

    if (editingUser) {
      setUsers(users.map(user => 
        user.name === editingUser.name ? userToSave : user
      ));
      setEditingUser(null);
    } else {
      setUsers([...users, userToSave]);
    }
    setCurrentUser({ name: '', numbers: new Set() });
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setCurrentUser({ 
      name: user.name, 
      numbers: new Set(user.numbers)
    });
    setShowList(false);
  };

  const handleDelete = (userName) => {
    if (confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter(user => user.name !== userName));
    }
  };

  const handleVintageBagCountChange = (increment) => {
    if (increment < 0) {
      const newCount = vintageBagCount + increment;
      const numbersInUse = users.some(user => 
        Array.from(user.numbers).some(num => num > newCount)
      );
      
      if (numbersInUse) {
        alert('Cannot reduce bags: Some numbers above ' + newCount + ' are in use');
        return;
      }
    }
    
    setVintageBagCount(prev => Math.max(1, Math.min(100, prev + increment)));
  };

 return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-teal-500 to-green-400 p-4">
      <div className="flex flex-col gap-4 h-full">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => setCurrentView('bags')}  // This will now work correctly
              className="px-6 py-3 bg-blue-900/40 hover:bg-blue-800/50 text-white rounded-lg transition-colors"
            >
              Return to Bags
            </button>
            <div className="flex items-center gap-4">
              {/* Unmarked count display */}
              <div className="text-white font-bold text-xl bg-black/20 px-4 py-2 rounded-lg">
                {vintageBagCount - users.reduce((total, user) => total + user.numbers.size, 0)}/{vintageBagCount}
              </div>
              <motion.img 
                src="/141.gif"
                alt="Kaubops"
                className="w-20 h-20 object-contain animate-pulse"
                style={{ animationDuration: '3s' }}
              />
              <h1 className="text-4xl font-black text-transparent bg-clip-text relative">
                <span className="absolute inset-0 text-4xl font-black text-white blur-sm">
                  VINTAGE BAGS
                </span>
                <span className="relative animate-gradient-x bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 bg-clip-text text-transparent">
                  VINTAGE BAGS
                </span>
              </h1>
              <motion.img 
                src="/142.gif"
                alt="Aerodactyl"
                className="w-20 h-20 object-contain animate-pulse"
                style={{ animationDuration: '3s' }}
              />
            </div>
            <button
              onClick={() => setShowList(!showList)}
              className="px-6 py-3 bg-purple-900/40 hover:bg-purple-800/50 text-white rounded-lg transition-colors"
            >
              {showList ? 'Show V. Bags' : 'View List'}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {isEditMode && (
              <motion.div
                key="controls"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-wrap items-center justify-between gap-4 mx-4 mb-4 bg-black/20 backdrop-blur-sm p-4 rounded-xl"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base font-medium text-black">Total Bags:</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleVintageBagCountChange(-1)}
                      className="w-10 h-10 flex items-center justify-center bg-black/30 text-black rounded-lg text-xl"
                    >
                      -
                    </button>
                    <span className="text-xl font-bold text-black w-10 text-center">
                      {vintageBagCount}
                    </span>
                    <button
                      onClick={() => handleVintageBagCountChange(1)}
                      className="w-10 h-10 flex items-center justify-center bg-black/30 text-white rounded-lg text-xl"
                    >
                      +
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!showList ? (
            <>
              <div className="flex justify-between items-center mb-6">
                <input
                  type="text"
                  value={currentUser.name}
                  onChange={(e) => setCurrentUser({ ...currentUser, name: e.target.value })}
                  placeholder="Enter user name"
                  className="flex-1 px-4 py-2 bg-white/10 rounded-lg text-white placeholder-white/50 mr-4"
                />
                {users.length === 0 && (
                  <button
                    onClick={() => setIsEditMode(!isEditMode)}
                    className="px-4 py-2 bg-purple-900/40 hover:bg-purple-800/50 text-white rounded-lg transition-colors"
                  >
                    {isEditMode ? 'Done' : 'Bag Count'}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-10 gap-2 mb-6">
                {Array.from({ length: vintageBagCount }, (_, i) => i + 1).map(number => {
                  const isTaken = users.some(user => 
                    user.name !== currentUser.name && user.numbers.has(number)
                  );
                  const isSelected = currentUser.numbers.has(number);

                  return (
                    <motion.div
                      key={number}
                      onClick={() => !isTaken && handleNumberClick(number)}
                      className={`
                        relative flex items-center justify-center p-4
                        rounded-lg cursor-pointer text-base font-bold shadow-lg
                        ${isTaken ? 'bg-red-500/50 cursor-not-allowed' :
                          isSelected ? 'bg-yellow-500/50' :
                          'bg-blue-900/50 hover:bg-blue-800/50'}
                        text-white min-h-[3rem]
                      `}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {number}
                    </motion.div>
                  );
                })}
              </div>

              <div className="flex justify-between items-center">
                <div className="text-white">
                  Selected numbers: {Array.from(currentUser.numbers).sort((a, b) => a - b).join(', ')}
                </div>
                <button
                  onClick={handleSave}
                  className="px-6 py-3 bg-green-600/60 text-white rounded-lg transition-colors"
                >
                  {editingUser ? 'Update' : 'Save'}
                </button>
              </div>
            </>
          ) : (
            <div className="bg-white/10 rounded-xl p-4">
              <table className="w-full">
                <thead>
                  <tr className="text-white border-b border-white/20">
                    <th className="py-2 text-left">Name</th>
                    <th className="py-2 text-left">Numbers</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.name} className="text-white border-b border-white/10">
                      <td className="py-2">{user.name}</td>
                      <td className="py-2">{Array.from(user.numbers).sort((a, b) => a - b).join(', ')}</td>
                      <td className="py-2 text-right">
                        <button
                          onClick={() => handleEdit(user)}
                          className="px-3 py-1 bg-blue-500/50 rounded-lg mr-2"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(user.name)}
                          className="px-3 py-1 bg-red-500/50 rounded-lg"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Bottom section - Image Gallery */}
        {!showList && (
          <div className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl shadow-xl p-6 relative">
            {isGalleryEditMode ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="grid grid-cols-3 gap-4">
                  {vintageImages.map((img, index) => (
                    <div key={index} className="relative">
                      <label className="cursor-pointer hover:text-blue-200 transition-colors text-lg md:text-xl p-8 border-2 border-dashed border-white/50 rounded-lg flex flex-col items-center gap-2">
                        {img ? (
                          <img src={img} alt={`Vintage ${index + 1}`} className="w-32 h-32 object-contain" />
                        ) : (
                          <>
                            <span className="text-4xl text-white">+</span>
                            <span className="text-white">Upload Image {index + 1}</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleVintageImageUpload(index, e)}
                          className="hidden"
                        />
                      </label>
                      {img && (
                        <button
                          onClick={() => {
                            const newImages = [...vintageImages];
                            newImages[index] = null;
                            setVintageImages(newImages);
                            const nextValidIndex = getNextValidIndex(currentImageIndex, 1);
                            if (nextValidIndex !== currentImageIndex) {
                              setCurrentImageIndex(nextValidIndex);
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
                    {vintageImages[currentImageIndex] && (
                      <img
                        src={vintageImages[currentImageIndex]}
                        alt={`Vintage ${currentImageIndex + 1}`}
                        className="w-full h-full object-contain"
                      />
                    )}
                  </TransformComponent>
                </TransformWrapper>

                {hasImages && vintageImages.filter(img => img !== null).length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImageIndex(getNextValidIndex(currentImageIndex, -1))}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 h-48 w-16 rounded-xl bg-black/20 hover:bg-black/30 text-white flex items-center justify-center transition-colors"
                    >
                      <span className="text-3xl">←</span>
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex(getNextValidIndex(currentImageIndex, 1))}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 h-48 w-16 rounded-xl bg-black/20 hover:bg-black/30 text-white flex items-center justify-center transition-colors"
                    >
                      <span className="text-3xl">→</span>
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Edit Mode Toggle Button */}
            <button
              onClick={() => setIsGalleryEditMode(!isGalleryEditMode)}
              className={`absolute top-4 right-4 px-6 py-3 rounded-lg transition-colors ${
                isGalleryEditMode 
                  ? 'bg-green-600/60 text-white' 
                  : 'bg-blue-900/40 hover:bg-blue-800/50 text-white'
              }`}
            >
              {isGalleryEditMode ? 'Done' : 'Edit Images'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

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
    localStorage.removeItem('bounties')
    localStorage.removeItem('vintageBagImages')
    localStorage.removeItem('vintageBagCount')
    // localStorage.removeItem('vintageBagsUsers')
    localStorage.removeItem(IMAGE_STORAGE_KEY)
    
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
    setBounties([])
    setCurrentBountyIndex(0)
    setVintageImages([null, null, null])
    setCurrentImageIndex(0)
    setQueueCount(0)
    setShimmerLevel(0)
  } catch (error) {
    console.error('Error resetting state:', error)
  }
};

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
      if (dragonairIntervalRef.current) {
        clearInterval(dragonairIntervalRef.current)
      }
      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current)
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
  setShimmerLevel(parsedState.shimmerLevel !== undefined ? parsedState.shimmerLevel : 0)
  setCurrentTargetIndex(parsedState.currentTargetIndex || 0)
  setFontSizeLevel(parsedState.fontSizeLevel !== undefined ? parsedState.fontSizeLevel : 2)
  setStatsFontSizeLevel(parsedState.statsFontSizeLevel !== undefined ? parsedState.statsFontSizeLevel : 1)
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
  // Stop bounty if we're not in the chases view
  if (currentView !== 'chases') {
    stopBounty();
    setIsPlaying(false);
  }
}, [currentView]); // Only re-run when currentView changes

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
      useStoneStyle,
      shimmerLevel,
      currentTargetIndex,
      fontSizeLevel,
      statsFontSizeLevel
    }
    localStorage.setItem('gachaBagState', JSON.stringify(stateToSave))
  } catch (error) {
    console.error('Error saving state:', error)
  }
}, [bagCount, chaseCount, selectedNumbers, chaseNumbers, remainingChases, marks, markSize, isLoading, useStoneStyle, shimmerLevel, currentTargetIndex, fontSizeLevel, statsFontSizeLevel])
  

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
    <div className="h-screen bg-gradient-to-br from-green-100 via-emerald-200 to-green-300 p-4">
      <div className="h-full bg-white/10 backdrop-blur-md rounded-2xl shadow-xl">
        {currentView === 'bags' ? (
          <div className="h-full flex flex-col">
<div className="flex items-center justify-between p-4">
  <button
    onClick={() => setCurrentView('chases')}
    className="px-6 py-3 bg-emerald-700/80 border-2 border-emerald-600 hover:bg-emerald-600/80 hover:border-emerald-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 backdrop-blur-sm"
  >
    Chases
  </button>

  <div className="relative">
    <motion.img 
      src="/148.gif"
      alt="Dragonair"
      className={`w-20 h-20 object-contain cursor-pointer ${
        dragonairCircleActive ? 'ring-4 ring-green-400 ring-opacity-70 rounded-full' : ''
      }`}
      onClick={() => {
        if (!dragonairCircleActive) {
          // Cycle to next dragonair circle image when turning on
          setCurrentDragonairImageIndex((prev) => (prev + 1) % dragonairCircleImages.length);
          setDragonairCircleActive(true);
          startDragonairShamrockSystem();
        } else {
          setDragonairCircleActive(false);
          stopDragonairShamrockSystem();
        }
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
      src="149.gif"
      alt="Dragonite"
      className="w-26 h-26 object-contain"
    />
    <div className="absolute inset-0 rounded-full hover:bg-white/10 transition-colors" />
  </div>

  <div className="relative">
    <motion.img 
      src="/148.gif"
      alt="Dragonair"
      className={`w-20 h-20 object-contain cursor-pointer ${
        dragonairCircleActive ? 'ring-4 ring-green-400 ring-opacity-70 rounded-full' : ''
      }`}
      onClick={() => {
        if (!dragonairCircleActive) {
          // Cycle to next dragonair circle image when turning on
          setCurrentDragonairImageIndex((prev) => (prev + 1) % dragonairCircleImages.length);
          setDragonairCircleActive(true);
          startDragonairShamrockSystem();
        } else {
          setDragonairCircleActive(false);
          stopDragonairShamrockSystem();
        }
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
    className="px-6 py-3 bg-emerald-700/80 border-2 border-emerald-600 hover:bg-emerald-600/80 hover:border-emerald-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 backdrop-blur-sm"
  >
    Insurance
  </button>
</div>
<div className="flex items-center justify-center gap-4 mb-2">


  {/* <motion.div
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.9 }}
    onClick={() => setCurrentView('vintage')}
    className="cursor-pointer"
  >
  <img 
    src="/nmal.jpeg" 
    alt="NeedMangaArt Logo" 
    className="w-20 h-20 object-contain animate-pulse"
    style={{ animationDuration: '3s' }}
  />
</motion.div> */}
              {/* <div className="text-center">
    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-1" style={{
      fontFamily: 'Comic Sans MS, cursive, sans-serif',
      color: '#10b981',
      textShadow: '4px 4px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000'
    }}>
      Lucky Packs
    </h1>
    <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold" style={{
      fontFamily: 'Comic Sans MS, cursive, sans-serif',
      color: '#059669',
      textShadow: '3px 3px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000'
    }}>
      Mystery Box Pull
    </h2>
  </div> */}
  {/* <motion.div
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.9 }}
    onClick={() => {
      // Turn off Dragonair feature to prevent flickering
      if (dragonairCircleActive) {
        setDragonairCircleActive(false);
        stopDragonairShamrockSystem();
      }
      setShowProbCalc(true);
    }}
    className="w-20 h-20 cursor-pointer relative group"
  >
    <img 
      src="/nmal.jpeg" 
    alt="NeedMangaArt Logo" 
      className="w-full h-20 object-contain animate-pulse group-hover:opacity-80 transition-opacity"
      style={{ animationDuration: '3s' }}
    />
    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
      <span className="text-2xl font-bold text-white">%</span>
    </div>
  </motion.div> */}
</div>
{/* Add the AnimatePresence right here */}
{/* <AnimatePresence>
  {showProbCalc && (
    <ProbabilityCalculator
  isOpen={showProbCalc}
  onClose={() => setShowProbCalc(false)}
  totalBags={bagCount - selectedNumbers.size}  // Now using remaining bags
  totalChases={remainingChases}  // Using remaining chases instead of total chases
/>
  )}
</AnimatePresence> */}
            <AnimatePresence mode="wait">
              {isEditMode && (
  <motion.div
    key="controls"
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-4 mx-4 mb-2 bg-black/20 backdrop-blur-sm p-4 rounded-xl"
  >
    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="text-base font-medium text-black">Total Bags:</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleBagCountChange(-1)}
            className="w-10 h-10 flex items-center justify-center bg-black/30 text-white rounded-lg text-xl"
          >
            -
          </button>
          <span className="text-xl font-bold text-black w-10 text-center">
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
        <span className="text-base font-medium text-black">Total Chases:</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleChaseCountChange(-1)}
            className="w-10 h-10 flex items-center justify-center bg-black/30 text-white rounded-lg text-xl"
          >
            -
          </button>
          <span className="text-xl font-bold text-black w-10 text-center">
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
    </div>

    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
      <button
        onClick={() => setShowResetConfirm(true)}
        className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg hover:shadow-lg transition-colors text-base font-medium"
      >
        Reset
      </button>
      
      {/* Font Size Controls next to Reset */}
      <div className="flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => handleFontSizeChange(-1)}
          disabled={fontSizeLevel === 0}
          className={`w-12 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors border ${
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
          disabled={fontSizeLevel === 8}
          className={`w-12 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors border ${
            fontSizeLevel === 8 
              ? 'bg-gray-600/50 text-gray-400 border-gray-500/30 cursor-not-allowed' 
              : 'bg-emerald-600/80 hover:bg-emerald-500/80 text-white border-emerald-500/50'
          }`}
        >
          +T
        </motion.button>

        {/* Stats Font Size Controls */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => handleStatsFontSizeChange(-1)}
          disabled={statsFontSizeLevel === 0}
          className={`w-14 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors border ${
            statsFontSizeLevel === 0 
              ? 'bg-gray-600/50 text-gray-400 border-gray-500/30 cursor-not-allowed' 
              : 'bg-blue-600/80 hover:bg-blue-500/80 text-white border-blue-500/50'
          }`}
        >
          -TL
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => handleStatsFontSizeChange(1)}
          disabled={statsFontSizeLevel === 3}
          className={`w-14 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors border ${
            statsFontSizeLevel === 3 
              ? 'bg-gray-600/50 text-gray-400 border-gray-500/30 cursor-not-allowed' 
              : 'bg-blue-600/80 hover:bg-blue-500/80 text-white border-blue-500/50'
          }`}
        >
          +TL
        </motion.button>
      </div>
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
            
            <div className={`grid ${gridCols} gap-1 sm:gap-2 mx-2 sm:mx-4 flex-1 overflow-y-auto relative grid`} style={{ maxHeight: 'calc(100vh - 200px)' }}>
                {numbers.map((number) => (
<motion.div
  key={number}
  onClick={() => toggleNumber(number)}
className={`
  relative flex items-center justify-center 
  rounded-xl cursor-pointer font-black
  min-h-[3rem] sm:min-h-[3.5rem] md:min-h-[4rem] lg:min-h-[4.5rem] xl:min-h-[5rem]
  ${getFontSizeClass()}
  ${
    chaseNumbers.has(number)
      ? 'bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white'
      : selectedNumbers.has(number)
      ? useStoneStyle
        ? 'bg-gradient-to-br from-slate-600 to-slate-800 text-gray-300'
        : 'bg-white text-gray-800'
      : 'bg-white text-gray-800 hover:bg-gray-100'
  }
  shadow-md transition-all duration-300
  ${lastClickedBox === number && isFlashing ? 'animate-pulse' : ''}
`}
  style={{
    border: lastClickedBox === number && isFlashing 
      ? '4px solid transparent'
      : undefined,
    animation: lastClickedBox === number && isFlashing 
      ? 'flashBorder 0.5s infinite alternate'
      : undefined
  }}
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
  {/* Always show the number as background */}
  <span className={`${selectedNumbers.has(number) ? 'opacity-0' : 'opacity-100'} z-10`}>
    {number}
  </span>
  
  {/* Show X marks over the number when selected */}
  {(selectedNumbers.has(number)) && (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className={`w-[70%] h-1 sm:h-1.5 md:h-2 lg:h-2.5 xl:h-3 ${useStoneStyle ? 'bg-gray-400' : 'bg-gray-800'} transform rotate-45`} />
      <div className={`w-[70%] h-1 sm:h-1.5 md:h-2 lg:h-2.5 xl:h-3 ${useStoneStyle ? 'bg-gray-400' : 'bg-gray-800'} transform -rotate-45 absolute`} />
    </motion.div>
  )}
  {!selectedNumbers.has(number) && shimmerLevel > 0 && (
    <SparklesEffect level={shimmerLevel} />
  )}
</motion.div>
))}

{/* Shamrock pop-ups */}
<AnimatePresence>
  {shamrocks.map((shamrock) => (
    <motion.div
      key={shamrock.id}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: shamrock.opacity, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
      className="absolute pointer-events-none z-20"
      style={{
        left: `${shamrock.x}px`,
        top: `${shamrock.y}px`,
        width: '120px',
        height: '120px'
      }}
    >
      <img
        src={shamrockImages[currentShamrockImageIndex]}
        alt="Shamrock"
        className="w-full h-full object-contain"
      />
    </motion.div>
  ))}
</AnimatePresence>

{/* Dragonair shamrock pop-ups */}
<AnimatePresence>
  {dragonairShamrocks.map((shamrock) => (
    <motion.div
      key={shamrock.id}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: shamrock.opacity, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
      className="absolute pointer-events-none z-20"
      style={{
        left: `${shamrock.x}px`,
        top: `${shamrock.y}px`,
        width: '120px',
        height: '120px'
      }}
    >
      <img
        src={dragonairCircleImages[currentDragonairImageIndex]}
        alt="Dragonair Shamrock"
        className="w-full h-full object-contain"
      />
    </motion.div>
  ))}
</AnimatePresence>

            </div>

            <div className="flex items-center gap-2 sm:gap-4 mx-2 sm:mx-4 mt-2 text-lg sm:text-xl md:text-2xl font-bold">
              {/* Left side - Queue controls only */}
              <div className="flex items-center gap-1 sm:gap-2">
                {/* Queue controls */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleQueueChange(1)}
                  className="w-16 h-8 sm:w-20 sm:h-10 bg-transparent hover:bg-white/10 text-white rounded-lg flex items-center justify-center text-lg sm:text-xl font-bold transition-colors border border-white/30"
                >
                  +
                </motion.button>

                <div className="px-1 sm:px-2 md:px-3 py-1 sm:py-2 rounded-xl text-gray-500 text-base sm:text-lg md:text-xl">
                  Q{queueCount}
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleQueueChange(-1)}
                  className="w-16 h-8 sm:w-20 sm:h-10 bg-transparent hover:bg-white/10 text-white rounded-lg flex items-center justify-center text-lg sm:text-xl font-bold transition-colors border border-white/30"
                >
                  -
                </motion.button>
              </div>
              
              {/* Centered - Dynamic responsive info bar - smaller */}
              <div className="flex-1 flex justify-center">
                <div className={`px-2 sm:px-3 md:px-4 lg:px-6 py-1 sm:py-2 md:py-3 rounded-xl bg-white flex flex-wrap items-center justify-center gap-1 sm:gap-2 ${getStatsFontSizeClass()}`}>
                  <span className="text-red-500 font-bold whitespace-nowrap">{remainingChases} Chases</span>
                  <span className="text-black font-bold hidden sm:inline"> / </span>
                  <span className="text-black font-bold whitespace-nowrap">{bagCount - selectedNumbers.size - queueCount} Bags</span>
                  <span className="text-blue-500 font-bold whitespace-nowrap hidden md:inline"> (Hit R: {calculateHitRatio()})</span>
                  {/* Show hit ratio on smaller screens in a more compact way */}
                  <span className="text-blue-500 font-bold whitespace-nowrap md:hidden text-xs"> {calculateHitRatio()}</span>
                </div>
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
                    
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
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
          min="4"
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

{/* Bottom Controls Container */}
<div className="absolute bottom-4 inset-x-4 z-50 flex justify-between">
  {/* Left side controls in a single row */}
  <div className="flex gap-4 items-center">
    <motion.div
      onClick={toggleSprite}
      className="cursor-pointer bg-black/10 rounded-full p-2 w-fit"
    >
      <img 
        src="/mdsprite.gif"
        alt="Mega Dragonite"
        className={`w-16 h-16 object-contain opacity-40 hover:opacity-80 transition-opacity ${
          spriteActive ? 'ring-4 ring-purple-500/50 ring-opacity-50 rounded-full' : ''
        }`}
      />
    </motion.div>

    {/* New CI (Change Image) Button */}
    <motion.label
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="w-20 h-20 bg-blue-500/30 hover:bg-blue-500/40 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg transition-colors border border-white/20 cursor-pointer"
    >
      CI
      <input
        type="file"
        accept="image/*"
        onChange={(e) => handleImageUpload(e, 'prize')}
        className="hidden"
      />
    </motion.label>

    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => setShowBountyModal(true)}
      className="w-20 h-20 bg-black/20 hover:bg-black/30 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg transition-colors border border-white/20"
    >
      B
    </motion.button>

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

  {/* Right side controls - Chase count and -1C */}
  <div className="flex gap-4 items-center">
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => {
        handleChaseCountChange(1);
        setShowPlusPopup(true);
        setTimeout(() => setShowPlusPopup(false), 1000);
      }}
      className="w-20 h-20 bg-amber-500/30 hover:bg-amber-500/40 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg border border-amber-400/30"
    >
      {chaseCount}C
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
      src={targetImages[currentTargetIndex]}
      alt="Poliwhirl-target"
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
                className="absolute pointer-events-none"
                style={{ 
                  left: `${mark.x}%`,
                  top: `${mark.y}%`,
                  width: `${(mark.size || markSize) * 2}rem`,
                  height: `${(mark.size || markSize) * 2}rem`,
                }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                <img
                  src="/pkbi2.png"
                  alt="Chase marker"
                  className="w-full h-full object-contain"
                  style={{
                    filter: 'drop-shadow(-3px -3px 0 #000) drop-shadow(3px -3px 0 #000) drop-shadow(-3px 3px 0 #000) drop-shadow(3px 3px 0 #000)'
                  }}
                />
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
            onChange={handlePrizeImageUpload}
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
  setCurrentBountyIndex={setCurrentBountyIndex}
  setStorageInfo={setStorageInfo}        // Add this
  setShowStoragePopup={setShowStoragePopup}  // Add this
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
          className="max-w-[800px] max-h-[600px] object-contain mb-4" // Changed from max-w-md max-h-96
        />
        <div className="text-3xl font-bold text-white text-center">
          {bounties[currentBountyIndex].text}
        </div>
      </div>
    </motion.div>
  )}
</AnimatePresence>
</div>
        ) : currentView === 'vintage' ? (
       <VintageBags 
  setCurrentView={setCurrentView} 
  setStorageInfo={setStorageInfo}
  setShowStoragePopup={setShowStoragePopup}
/>
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
  textShadow: `
  -3px -3px 0 #000,
  3px -3px 0 #000,
  -3px 3px 0 #000,
  3px 3px 0 #000
`
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
      
      {/* Storage Popup */}
      <StoragePopup
        totalSize={storageInfo.totalSize}
        imageSize={storageInfo.imageSize}
        isVisible={showStoragePopup}
        onClose={() => setShowStoragePopup(false)}
      />
    </div>
  );
}

export default App;
