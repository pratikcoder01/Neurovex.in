# Neurovex Diagram Generation Prompts & Code

If you want to quickly generate high-quality engineering diagrams for your project report, you have two options:

---

## OPTION 1: Use Mermaid.js (Highly Recommended)
This is the fastest and most professional way. Mermaid generates exact shapes and arrows instantly without typos.
**Instructions:**
1. Go to [https://mermaid.live/](https://mermaid.live/)
2. Copy the code block for each diagram below and paste it into the "Code" section on the left side of the website.
3. Click the "Download PNG" button on the right side to save the image.
4. Insert the image into your Word Document report.

### Diagram 1: System Architecture Diagram
```mermaid
graph TD
    subgraph Human Interface
        B[Human Brain] -->|Microvolts| E[Penta Gel Electrodes]
    end
    
    subgraph Hardware/Acquisition
        E -->|Analog Signal| A[BioAmp EXG Pill]
        A -->|Amplified Signal| M[ESP32 Microcontroller]
    end
    
    subgraph Web / Cloud Layer
        M -.->|USB/WiFi Streaming| C[Local PC / Browser]
        C -->|HTTP/REST| DB[(Supabase Cloud)]
        C <-->|Rendering| UI[Dashboard UI]
    end
    
    subgraph Signal Processing & AI
        C -->|Raw Data| SP[Signal Processing Module]
        SP -->|FFT/Band Power| AI[AI ML Classifier]
        AI -->|Focus/Relax States| SM[Safety Manager]
    end
    
    subgraph Actuation
        SM -->|Forward/Stop Commands| M
        M -->|PWM Logic| MD[L298N Motor Driver]
        MD -->|Voltage| W[Assistive Wheelchair]
    end
```

### Diagram 2: Data Flow Diagram (DFD)
```mermaid
graph LR
    A((User)) -->|Brainwaves| B(BioAmp Pill)
    B -->|Analog| C(ESP32 ADC)
    C -->|JSON via Serial| D{Web Browser}
    
    D -->|Raw Integers| E(FFT & Filters)
    E -->|Clean Frequencies| F(AI Model)
    
    F -->|State: Focus| G{Decision Gateway}
    
    G -- "Focus > 60%" --> H[Send 'FORWARD' to ESP32]
    G -- "Noise Detected" --> I[Send 'STOP' to ESP32]
    
    H --> J((Motors Turn))
    
    F -->|Telemetry| K[(Supabase DB)]
```

### Diagram 3: EEG Signal Processing Flow
```mermaid
flowchart TD
    A([Raw Analog Array]) --> B[Notch Filter 50/60Hz]
    B --> C[Bandpass Filter 1Hz-50Hz]
    C --> D(Fast Fourier Transform - FFT)
    D --> E{Frequency Bins}
    
    E -->|1-4 Hz| F[Delta Power]
    E -->|4-8 Hz| G[Theta Power]
    E -->|8-13 Hz| H[Alpha Power]
    E -->|13-30 Hz| I[Beta Power]
    
    I --> J(Calculate Beta/Alpha Ratio)
    H --> J
    
    J --> K[Exponential Moving Average]
    K --> L([Smoothed Focus Score Metric])
```

### Diagram 4: Hardware Block Diagram
```mermaid
graph TD
    subgraph Power Supply
        B1[3.7V Li-ion x 2] -->|12V Output| V[L298N Power In]
        USB[Laptop USB] -->|5V Output| ESP[ESP32 Power In]
        V -.->|Shared Ground| ESP
    end

    subgraph Acquisition Node
        EEG[Electrodes] --> BA[BioAmp EXG Pill]
        BA -->|Pin 34| ESP
    end

    subgraph Actuation Node
        ESP[ESP32 Microcontroller] -->|Pins 12,13,14| L298N[L298N Motor Driver]
        ESP -->|Pins 25,26,27| L298N
        L298N --> M1((Left Motors))
        L298N --> M2((Right Motors))
    end
```

### Diagram 5: Database Architecture
```mermaid
erDiagram
    PROFILES ||--o{ SESSIONS : creates
    SESSIONS ||--o{ EEG_DATA : contains
    SESSIONS ||--o{ HARDWARE_LOGS : records
    
    PROFILES {
        uuid id PK
        string full_name
        timestamp created_at
    }
    
    SESSIONS {
        uuid id PK
        uuid user_id FK
        string session_name
        int duration_seconds
        int avg_focus
    }
    
    EEG_DATA {
        bigint id PK
        uuid session_id FK
        bigint timestamp_ms
        int raw_value
        int focus_score
    }
    
    HARDWARE_LOGS {
        bigint id PK
        uuid session_id FK
        string event_type
        string trigger_reason
    }
```

---

## OPTION 2: Use ChatGPT/Claude to Generate Image Prompts or Diagrams
If you prefer to use ChatGPT to generate diagrams or write descriptions for your report, copy and paste this prompt into ChatGPT:

**PROMPT TO COPY AND PASTE:**
> "I am writing an engineering report for my Final Year Project named Neurovex (an AI-powered EEG Brain-Computer Interface for Wheelchair control). I need 5 detailed, professional block diagrams focusing on these sections:
> 1. System Architecture (showing the Brain, ESP32, React Frontend, AI ML Classifier, Supabase, and Motor Driver).
> 2. Data Flow Diagram (DFD) showing how the data moves from the BioAmp Pill through the Serial API to the dashboard and motors.
> 3. EEG Signal Processing Flow (highlighting FFT, Bandpass filters, and Alpha/Beta wave extraction).
> 4. Hardware Block Diagram (showing power routing from batteries to the L298N and ESP32 with a shared ground).
> 5. Supabase Database Entity Relationship (ER) Diagram (showing Profiles, Sessions, EEG_Data, and Hardware Logs).
> 
> Please output the Mermaid.js code for these 5 diagrams so I can render them. After outputting the code, please write a 1-paragraph academic summary for each diagram explaining its parts and data flow so I can paste the descriptions directly into my report below the images."
