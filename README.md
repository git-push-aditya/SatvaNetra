# Satvanetra - Deepfake Detection System (Audio / Video / Image)

**Hackathon Project | CIDECode 2025 | 2nd Place Winner | ₹50,000 Prize**

Satvanetra is an advanced deepfake detection system designed to analyze audio, video, and image content using both AI/ML models and manual digital signal processing techniques. This project was created for **CIDECode 2025**, an annual hackathon organized by the Cybersecurity Department of CID Karnataka, where it secured **2nd place**.

---

## Project Overview

Satvanetra is built to detect and analyze manipulated multimedia content using a **hybrid approach**:  

1. **Automated AI/ML Detection**
   - Users upload an object (image, video, or audio) via the **Next.js frontend (`hacknext`)**.
   - Uploaded content is stored on **Supabase**, and a pre-signed URL is sent to the **Flask backend (`flaskBack`)**.
   - The backend connects to **machine learning models** to analyze the content.
   - Results are compiled into a **PDF report**, stored on Supabase, and a pre-signed URL is sent back for display.

2. **Manual Signal Analysis**
   - Deep analysis of audio, video, and images using **Fourier transforms** and other **digital signal processing** techniques.
   - Provides a secondary verdict for a deeper understanding of potential manipulations.

3. **Admin Panel**
   - Complete control and monitoring of uploads, analysis results, and system activity.

---

## ⚡ Key Features

- Full-stack Next.js and Flask architecture
- Supabase storage and pre-signed URL integration
- AI/ML models for automated deepfake detection
- Manual digital signal processing for enhanced verification
- PDF report generation and secure distribution
- Admin panel for monitoring and management
- Robust handling of audio, video, and image data

---

## 🛠 Tech Stack

- **Frontend:** Next.js, React  
- **Backend:** Flask (Python)  
- **Storage & Database:** Supabase  
- **ML / AI:** Custom deepfake detection models  
- **Data Processing:** Fourier transforms, signal analysis  
- **Deployment:** Cloud-hosted endpoints and storage  

---

## How It Works

1. **User Upload**
   - Upload multimedia content via the frontend.
   - Frontend stores the file on Supabase and generates a pre-signed URL.

2. **Automated AI Analysis**
   - Flask backend retrieves content using pre-signed URL.
   - Runs deepfake detection ML models.
   - Generates verdict and PDF report.

3. **Manual Analysis**
   - Performs signal processing on content for additional verification.
   - Complements AI verdict for more reliable results.

4. **Results Delivery**
   - PDF report and results sent back to frontend via pre-signed URL.
   - Users and admins can view results securely.

---

## 🏆 Hackathon Achievement

- **Event:** CIDECode 2025, Karnataka (Cybersecurity Department)  
- **Prize:** 2nd Place | ₹50,000  
- **Scope:** Demonstrated advanced AI/ML hybrid system for deepfake detection in real-world scenarios.

---

## 📁 Repository Structure

Satvanetra/  
├─ hacknext/    # Next.js full-stack frontend  
├─ flaskBack/   # Flask backend with ML integration  
└─ README.md    # Project documentation  

---

## 💡 Why Satvanetra?

Satvanetra stands out by combining **automated AI detection** with **manual signal analysis**, providing a reliable, robust, and practical solution to combat deepfake threats. Its architecture is **scalable, secure, and recruiter-ready**, showcasing both your technical skills and innovation in AI/ML.

---

## Next Steps / Improvements

- Expand AI models to cover more multimedia types
- Implement real-time detection streaming
- Enhance admin analytics dashboard
- Containerize backend for easier deployment

--- 
