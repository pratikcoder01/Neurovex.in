from typing import List, Dict, Optional
import time
import csv
import os

class SessionManager:
    def __init__(self):
        self.is_recording = False
        self.session_data: List[Dict] = []
        self.start_time = 0
        self.duration_sec = 0
        
        # History
        self.current_report = None
        self.history = []
        
        self.output_dir = "database"
        if not os.path.exists(self.output_dir):
            os.makedirs(self.output_dir)

    def start_session(self, duration_sec: int):
        """Initializes a new recording session."""
        self.is_recording = True
        self.session_data = []
        self.start_time = time.time()
        self.duration_sec = duration_sec
        return {"status": "started", "duration_sec": duration_sec}

    def stop_session(self):
        """Stops the session and triggers analysis."""
        if not self.is_recording:
            return {"status": "error", "message": "No active session"}
            
        self.is_recording = False
        report = self.generate_report()
        # Save to history (keep last 5)
        self.history.insert(0, report)
        if len(self.history) > 5:
            self.history.pop()
            
        self.current_report = report
        
        # Export CSV for judges/proof
        self.export_csv()
        
        return {"status": "stopped", "report": report}

    def record_data(self, data_point: Dict):
        """Appends a new data tick to RAM if recording."""
        if self.is_recording:
            # Check auto-stop condition
            if time.time() - self.start_time >= self.duration_sec:
                self.stop_session()
                return False
                
            self.session_data.append(data_point)
            return True
        return False

    def export_csv(self):
        """Dumps the RAM session data into a CSV file."""
        if not self.session_data:
            return None
            
        filename = os.path.join(self.output_dir, f"session_{int(time.time())}.csv")
        headers = ["timestamp", "raw_value", "alpha", "beta", "theta", "delta", "focus_score"]
        
        with open(filename, mode='w', newline='') as file:
            writer = csv.DictWriter(file, fieldnames=headers)
            writer.writeheader()
            for row in self.session_data:
                # Filter just the keys we want in CSV
                filtered_row = {k: row.get(k, 0) for k in headers}
                writer.writerow(filtered_row)
                
        self.current_report["latest_csv"] = filename
        return filename

    def generate_report(self):
        """Calculates averages, safe division analytics, and suggestions from RAM."""
        if not self.session_data:
            return self._empty_report()
            
        count = len(self.session_data)
        avg_alpha = sum(d.get('alpha', 0) for d in self.session_data) / count
        avg_beta = sum(d.get('beta', 0) for d in self.session_data) / count
        avg_theta = sum(d.get('theta', 0) for d in self.session_data) / count
        avg_delta = sum(d.get('delta', 0) for d in self.session_data) / count
        avg_focus = sum(d.get('focus_score', 0) for d in self.session_data) / count
        
        # Safe Division Math (per user instruction)
        stress = avg_beta / (avg_alpha + avg_theta + 0.0001)
        fatigue = avg_theta / (avg_beta + 0.0001)
        
        # Convert to rough percentages for UI (normalize mathematically)
        # Assuming typical ranges: stress (0-3), fatigue (0-5)
        stress_pct = min(100, int((stress / 2.0) * 100))
        fatigue_pct = min(100, int((fatigue / 3.0) * 100))
        focus_pct = int(avg_focus)

        suggestion = "Your brain activity is beautifully balanced. Keep up the great work!"
        if focus_pct < 40:
            suggestion = "Your focus is low. Try a 5-minute deep breathing exercise to center your attention."
        elif stress_pct > 70:
            suggestion = "High stress levels detected. Step away from your desk, close your eyes, and relax."
        elif fatigue_pct > 70:
            suggestion = "You are showing signs of mental fatigue. It's time to take a break and rest."

        return {
            "timestamp": int(time.time()),
            "duration_sec": int(time.time() - self.start_time),
            "metrics": {
                "focus_pct": focus_pct,
                "stress_pct": stress_pct,
                "fatigue_pct": fatigue_pct
            },
            "bands": {
                "alpha": round(avg_alpha, 2),
                "beta": round(avg_beta, 2),
                "theta": round(avg_theta, 2),
                "delta": round(avg_delta, 2)
            },
            "suggestion": suggestion
        }

    def _empty_report(self):
        return {
            "timestamp": int(time.time()),
            "duration_sec": 0,
            "metrics": {"focus_pct": 0, "stress_pct": 0, "fatigue_pct": 0},
            "bands": {"alpha": 0, "beta": 0, "theta": 0, "delta": 0},
            "suggestion": "No data recorded in this session."
        }
