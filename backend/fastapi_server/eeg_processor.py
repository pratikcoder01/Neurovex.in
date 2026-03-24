# eeg_processor.py
import numpy as np
from collections import deque

class EEGSignalProcessor:
    def __init__(self, window_size: int = 250):
        self.window_size = window_size
        self.buffer = deque(maxlen=window_size)
    
    def feed_data(self, value: int):
        self.buffer.append(value)
    
    def process(self):
        if len(self.buffer) < self.window_size:
            return None
        
        # Convert to numpy array
        data = np.array(self.buffer)
        
        # Calculate Mock Bandpowers for MVP integration
        # (In real scenario: apply FFT -> SciPy Welch method -> extract bands)
        variance = np.var(data)
        std_dev = np.std(data)
        
        alpha_band = std_dev * 0.4
        beta_band = std_dev * 0.6
        
        # Raw focus algorithm
        focus = (beta_band / (alpha_band + 0.1)) * 50
        focus = max(0, min(focus, 100))
        
        stress = max(0, min(focus * 1.1, 100))
        fatigue = max(0, 100 - focus)
        
        return {
            "focus": round(focus, 2),
            "stress": round(stress, 2),
            "fatigue": round(fatigue, 2)
        }
