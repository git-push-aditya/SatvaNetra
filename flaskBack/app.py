import os
import mimetypes
from flask import Flask, request, jsonify, send_file
import requests
import cv2
import numpy as np
import subprocess
import pywt
from PIL import Image
from reportlab.pdfgen import canvas
import matplotlib
import exiftool
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import librosa
import librosa.display
import uuid
from io import BytesIO
import tempfile
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle
from supabase import create_client, Client
from scipy.fftpack import dct
from fpdf import FPDF
import traceback
import json
import hashlib

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = os.path.join(os.getcwd(), 'uploads')

# Constants (same as updated ab.py)
TEMP_DIR = "temp"
OUTPUT_DIR = "out"
MODEL_PATH = "model/librifake_pretrained_lambda0.5_epoch_25.pth"
FTCN_SCRIPT = "FTCN/test_on_raw_video.py"
IMAGE_SCRIPT = "DeepFake-Detector/run.py"  # New constant from ab.py

# Ensure directories exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(TEMP_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Supabase configuration (from app3.py)
supabase_url = "https://wyashziehpsiztvecjwf.supabase.co"
supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5YXNoemllaHBzaXp0dmVjandmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5MDQyMDksImV4cCI6MjA1NjQ4MDIwOX0.GWUhcQ6FEuld-52Ew1B9_ZGf2ko1Qyz1J5oyW-_gDnc"
supabase: Client = create_client(supabase_url, supabase_key)

def setup_environment():
    """Set up the necessary environment variables for deepfake detection."""
    os.environ["CUDA_VISIBLE_DEVICES"] = "0:6"
    os.environ["PYTORCH_NO_CUDA_MEMORY_CACHING"] = "1"
    os.environ["PYTORCH_CUDA_ALLOC_CONF"] = "max_split_size_mb:256"
    os.environ["DETECT_BATCH_SIZE"] = "10"
    
    subprocess.run(["python", "-c", "import torch; torch.cuda.empty_cache()"])
    
    common_file = "FTCN/test_tools/common.py"
    if os.path.exists(common_file):
        with open(common_file, "r") as file:
            content = file.read()
        
        if "partition(frames, 50)" in content:
            content = content.replace("partition(frames, 50)", "partition(frames, int(os.environ.get('DETECT_BATCH_SIZE', 50)))")
            
            if "import os" not in content:
                content = "import os\n" + content
            
            with open(common_file, "w") as file:
                file.write(content)
            print("Modified batch size in detection code")

def restore_environment():
    """Restore the original FTCN detection script."""
    common_file = "FTCN/test_tools/common.py.bak"
    if os.path.exists(common_file):
        os.replace(common_file, "FTCN/test_tools/common.py")
        print("Restored original detection code")

def extract_metadata(file_path):
    """Extract metadata using exiftool."""
    try:
        # Compute file hash
        hasher = hashlib.sha256()
        with open(file_path, "rb") as f:
            while chunk := f.read(4096):
                hasher.update(chunk)
        file_hash = hasher.hexdigest()

        # Extract metadata using ExifTool
        with exiftool.ExifTool() as et:
            output = et.execute("-j", file_path)  # Output in JSON format
        
        metadata = json.loads(output)  # Convert JSON string to Python dict
        if metadata:
            metadata[0]["File_Hash"] = file_hash  # Add hash to metadata
            return metadata[0]
        else:
            return {"error": "No metadata found", "File_Hash": file_hash}
    except Exception as e:
        return {"error": f"ExifTool Error: {str(e)}"}

def run_video_detection(input_filename):
    """Run FTCN deepfake detection for videos, convert output to MP4, and return file path."""
    print(f"Running video detection on: {input_filename}")
    
    temp_output_avi = os.path.join(TEMP_DIR, os.path.basename(input_filename).rsplit(".", 1)[0] + ".avi")
    final_output_mp4 = os.path.join(OUTPUT_DIR, os.path.basename(input_filename).rsplit(".", 1)[0] + ".mp4")

    setup_environment()
    
    # Run the deepfake detection model
    command = ["python", FTCN_SCRIPT, input_filename, TEMP_DIR]
    process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    process.communicate()

    restore_environment()
    
    if os.path.exists(temp_output_avi):
        print(f"Video processing completed. Converting {temp_output_avi} to MP4...")
        
        # Convert .avi to .mp4 using ffmpeg
        convert_command = ["ffmpeg", "-i", temp_output_avi, "-vcodec", "libx264", "-crf", "23", final_output_mp4]
        convert_process = subprocess.Popen(convert_command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        convert_process.communicate()

        if os.path.exists(final_output_mp4):
            print(f"Conversion successful: {final_output_mp4}")
            return final_output_mp4
        else:
            print("FFmpeg conversion failed.")
            return None
    else:
        print("Video processing failed.")
        return None

def run_audio_evaluation(input_filename):
    """Run the deepfake detection model for audio and return raw output."""
    print(f"Running deepfake audio evaluation on: {input_filename}")
    command = ["python", "eval.py", "--input_path", input_filename, "--model_path", MODEL_PATH]
    process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    stdout, stderr = process.communicate()
    return stdout.decode() if process.returncode == 0 else f"Error: {stderr.decode()}"

def run_image_detection(input_filename):
    """Run deepfake detection for images and return the confidence score (from ab.py)."""
    print(f"Running image detection on: {input_filename}")
    
    command = ["python", IMAGE_SCRIPT, input_filename]
    process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    stdout, stderr = process.communicate()
    
    if process.returncode == 0:
        output_text = stdout.decode().strip()
        
        # Clean up ANSI escape codes and extract the confidence score
        cleaned_output = output_text.replace("\x1b[1m", "").replace("\x1b[0m", "").replace("\x1b[32m", "").replace("\x1b[37m", "").replace("\x08", "")
        
        if "Confidence score:" in cleaned_output:
            score_str = cleaned_output.split("Confidence score:")[-1].strip().split("\n")[0]
            try:
                score = float(score_str)
                return input_filename, score
            except ValueError as e:
                print(f"Failed to parse score: {e}")
                return None, "Error parsing score"
        else:
            print("Confidence score not found in output.")
            return None, "Confidence score not found"
    else:
        print(f"Image detection failed: {stderr.decode()}")
        return None, f"Error: {stderr.decode()}"

def generate_pdf_report(uploaded_file_path, result, output_file_path=None):
    """Generate a PDF report with the results of the deepfake detection and exiftool output (from ab.py)."""
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=12)
    
    # Run exiftool on the uploaded file
    exiftool_command = ["exiftool", uploaded_file_path]
    exiftool_process = subprocess.Popen(exiftool_command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    exiftool_output, _ = exiftool_process.communicate()
    
    # Add exiftool output to the PDF
    pdf.cell(200, 10, txt="Exiftool Output:", ln=True, align="L")
    pdf.multi_cell(0, 10, txt=exiftool_output.decode(), align="L")
    
    # Add the result of the deepfake detection
    pdf.cell(200, 10, txt="Deepfake Detection Result:", ln=True, align="L")
    pdf.multi_cell(0, 10, txt=str(result), align="L")
    
    # Handle different file types
    if uploaded_file_path.lower().endswith(".wav"):
        pdf.cell(200, 10, txt="Audio File:", ln=True, align="L")
        pdf.multi_cell(0, 10, txt=uploaded_file_path, align="L")
    
    elif uploaded_file_path.lower().endswith(".mp4"):
        pdf.cell(200, 10, txt="Video File:", ln=True, align="L")
        pdf.multi_cell(0, 10, txt=uploaded_file_path, align="L")
        if output_file_path:
            pdf.cell(200, 10, txt="Processed Video:", ln=True, align="L")
            pdf.multi_cell(0, 10, txt=output_file_path, align="L")
    
    elif uploaded_file_path.lower().endswith((".jpg", ".jpeg", ".png")):
        pdf.cell(200, 10, txt="Image File:", ln=True, align="L")
        pdf.multi_cell(0, 10, txt=uploaded_file_path, align="L")
        pdf.image(uploaded_file_path, x=10, y=pdf.get_y(), w=100)
    
    # Save the PDF
    pdf_output_path = os.path.join(OUTPUT_DIR, os.path.basename(uploaded_file_path).rsplit('.', 1)[0] + "_report.pdf")
    pdf.output(pdf_output_path)
    
    return pdf_output_path

# File extension lists for MIME type detection (from app3.py)
image_extensions = {"jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "tiff", "tif", "ico", "heif", "heic"}
audio_extensions = {"mp3", "x-wav", "wav", "aac", "ogg", "flac", "m4a", "wma", "opus","mpeg", "aiff", "alac", "amr", "mpga"}
video_extensions = {"mp4", "mkv", "webm", "mov", "avi", "wmv", "flv", "m4v", "3gp", "mpg", "ogv"}

def detect_mime_type(file_path):
    """Detect the MIME type of a file based on its extension (from app3.py)."""
    ext = os.path.splitext(file_path)[1]
    ext = ext.lower().lstrip('.')
    
    if ext in image_extensions:
        return f"image/{ext if ext != 'jpg' else 'jpeg'}"
    elif ext in audio_extensions:
        return f"audio/{ext}"
    elif ext in video_extensions:
        return f"video/{ext}"
    else:
        mime_type, _ = mimetypes.guess_type(file_path)
        return mime_type

def extract_frames(video_path, interval=100):
    """Extract frames from a video at a given interval (from app3.py)."""
    cap = cv2.VideoCapture(video_path)
    frames = []
    frame_count = 0
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        if frame_count % interval == 0:
            frames.append(frame)
        frame_count += 1
    cap.release()
    return frames

def generate_plots(image):
    """Generate plots for image analysis (from app3.py)."""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    f = np.fft.fft2(gray)
    fshift = np.fft.fftshift(f)
    psd = 20 * np.log(np.abs(fshift))
    dct_transformed = dct(dct(gray.T, norm='ortho').T, norm='ortho')
    log_dct = np.log(np.abs(dct_transformed) + 1e-5)
    coeffs2 = pywt.dwt2(gray, 'haar')
    LL, (LH, HL, HH) = coeffs2

    plt.figure(figsize=(12, 8))
    titles = ["PSD", "DCT", "Wavelet HH", "Wavelet LL", "Wavelet LH", "Wavelet HL"]
    data = [psd, log_dct, HH, LL, LH, HL]

    for i, (title, img) in enumerate(zip(titles, data), 1):
        plt.subplot(2, 3, i)
        plt.imshow(img, cmap='jet')
        plt.title(title)
        plt.axis('off')

    img_bytes = BytesIO()
    plt.savefig(img_bytes, format='png')
    plt.close()
    return img_bytes.getvalue()

def process_audio(file_path):
    """Process audio file to generate FFT, STFT, and MFCC plots (from app3.py)."""
    y, sr = librosa.load(file_path)
    # FFT
    fft = np.abs(np.fft.fft(y))
    fft_fig = BytesIO()
    plt.figure()
    plt.plot(fft)
    plt.title("FFT")
    plt.savefig(fft_fig, format='png')
    plt.close()
    fft_fig.seek(0)
    
    # STFT
    stft = np.abs(librosa.stft(y))
    stft_fig = BytesIO()
    plt.figure()
    librosa.display.specshow(librosa.amplitude_to_db(stft, ref=np.max))
    plt.title("STFT")
    plt.savefig(stft_fig, format='png')
    plt.close()
    stft_fig.seek(0)
    
    # MFCC
    mfcc = librosa.feature.mfcc(y=y, sr=sr)
    mfcc_fig = BytesIO()
    plt.figure()
    librosa.display.specshow(mfcc)
    plt.title("MFCC")
    plt.savefig(mfcc_fig, format='png')
    plt.close()
    mfcc_fig.seek(0)
    
    return fft_fig.getvalue(), stft_fig.getvalue(), mfcc_fig.getvalue()

def upload_image_to_supabase(image_bytes):
    """Upload an image to Supabase and return the public URL."""
    file_name = f"{uuid.uuid4().hex}.png"
    try:
        supabase.storage.from_("raw-files").upload(file_name, image_bytes, file_options={"content-type": "image/png"})
        return supabase.storage.from_("raw-files").get_public_url(file_name)
    except Exception as e:
        print("Supabase Upload Error:", str(e))
        return f"Failed to upload to Supabase: {str(e)}"

def upload_video_to_supabase(video_bytes):
    """Upload a video to Supabase and return the public URL."""
    file_name = f"{uuid.uuid4().hex}.mp4"
    try:
        supabase.storage.from_("raw-files").upload(file_name, video_bytes, file_options={"content-type": "video/mp4"})
        return supabase.storage.from_("raw-files").get_public_url(file_name)
    except Exception as e:
        print("Supabase Upload Error:", str(e))
        return f"Failed to upload to Supabase: {str(e)}"

def upload_pdf_to_supabase(pdf_bytes):
    """Upload a PDF to Supabase and return the public URL."""
    file_name = f"{uuid.uuid4().hex}.pdf"
    try:
        supabase.storage.from_("raw-files").upload(file_name, pdf_bytes, file_options={"content-type": "application/pdf"})
        return supabase.storage.from_("raw-files").get_public_url(file_name)
    except Exception as e:
        print("Supabase Upload Error:", str(e))
        return f"Failed to upload to Supabase: {str(e)}"

def generate_pdf_bytes(metadata_dict):
    """Generate a PDF report from metadata and upload it to Supabase (from app3.py)."""
    try:
        pdf_buffer = BytesIO()
        doc = SimpleDocTemplate(pdf_buffer, pagesize=letter)
        elements = []

        # Convert metadata dict to table format
        data = [["Key", "Value"]] + [[k, str(v)] for k, v in metadata_dict.items()]
        table = Table(data, colWidths=[200, 300])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elements.append(table)
        doc.build(elements)

        # Retrieve PDF bytes
        pdf_buffer.seek(0)
        pdf_bytes = pdf_buffer.getvalue()
        return upload_pdf_to_supabase(pdf_bytes)
    except Exception as e:
        print(f"Error generating PDF: {e}")
        traceback.print_exc()
        return None

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.get_json()
    if not data or "cloudUrl" not in data:
        return jsonify({'error': 'Missing file URL'}), 400

    file_url = data["cloudUrl"]
    detection_type = data.get("detectionType", "deepfake")  # Default to deepfake if not specified
    response = requests.get(file_url, stream=True)
    if response.status_code != 200:
        return jsonify({"error": "Failed to download file"}), 400

    # Save the file temporarily
    with tempfile.NamedTemporaryFile(delete=False) as temp_file:
        temp_file.write(response.content)
        temp_file_path = temp_file.name

    mime_type = detect_mime_type(file_url)
    print(f"Detected MIME type: {mime_type}")

    try:
        if detection_type == "deepfake":
            if mime_type.startswith("audio"):
                result = run_audio_evaluation(temp_file_path)
                pdf_path = generate_pdf_report(temp_file_path, result)
                with open(pdf_path, "rb") as pdf_file:
                    pdf_bytes = pdf_file.read()
                pdf_url = upload_pdf_to_supabase(pdf_bytes)
                print(pdf_url)
                return jsonify({"deepfake_result": result, "pdfUrl": pdf_url}), 200

            elif mime_type.startswith("video"):
                result_path = run_video_detection(temp_file_path)
                if result_path:
                    pdf_path = generate_pdf_report(temp_file_path, "Video processed successfully.", result_path)
                    with open(result_path, "rb") as video_file:
                        video_bytes = video_file.read()
                    with open(pdf_path, "rb") as pdf_file:
                        pdf_bytes = pdf_file.read()
                    vid_result_url = upload_video_to_supabase(video_bytes)
                    pdf_url = upload_pdf_to_supabase(pdf_bytes)
                    return jsonify({"vidResultUrl": vid_result_url, "pdfUrl": pdf_url}), 200
                else:
                    return jsonify({"vidResultUrl": None, "pdfUrl": None}), 400

            elif mime_type.startswith("image"):
                processed_image_path, score = run_image_detection(temp_file_path)
                if processed_image_path:
                    result = f"Confidence Score: {score}"
                    pdf_path = generate_pdf_report(temp_file_path, result)
                    with open(pdf_path, "rb") as pdf_file:
                        pdf_bytes = pdf_file.read()
                    pdf_url = upload_pdf_to_supabase(pdf_bytes)
                    print(pdf_url,score)
                    return jsonify({"deepfake_result": result, "pdfUrl": pdf_url}), 200
                else:
                    return jsonify({"deepfake_result": f"Failed: {score}", "pdfUrl": None}), 400

            else:
                return jsonify({'error': 'Unsupported file type'}), 400

        elif detection_type == "manual":
            if mime_type.startswith("image"):
                image = cv2.imread(temp_file_path)
                if image is None:
                    return jsonify({'error': 'Invalid image'}), 400
                image_analysis = generate_plots(image)
                metadata = extract_metadata(temp_file_path)
                image_url = upload_image_to_supabase(image_analysis)
                pdf_url = generate_pdf_bytes(metadata)
                return jsonify({'pdfUrl': pdf_url, 'imageUrl': image_url}), 200

            elif mime_type.startswith("audio"):
                fft_img, stft_img, mfcc_image = process_audio(temp_file_path)
                fft_url = upload_image_to_supabase(fft_img)
                stft_url = upload_image_to_supabase(stft_img)
                mfcc_url = upload_image_to_supabase(mfcc_image)
                metadata = extract_metadata(temp_file_path)
                pdf_url = generate_pdf_bytes(metadata)
                return jsonify({'fftUrl': fft_url, 'stftUrl': stft_url, 'mfccUrl': mfcc_url, 'pdfUrl': pdf_url}), 200

            elif mime_type.startswith("video"):
                frames = extract_frames(temp_file_path, interval=100)
                if not frames:
                    return jsonify({'error': 'No frames extracted'}), 400
                result_img = generate_plots(frames[0])
                vid_result_url = upload_image_to_supabase(result_img)
                metadata = extract_metadata(temp_file_path)
                pdf_url = generate_pdf_bytes(metadata)
                print(pdf_url,vid_result_url)
                return jsonify({'vidresultPdfUrl': vid_result_url, 'pdfUrl': pdf_url}), 200

            else:
                return jsonify({'error': 'Unsupported file type'}), 400

    except Exception as e:
        return jsonify({'error': f'Processing error: {str(e)}'}), 500

    finally:
        os.remove(temp_file_path)

if __name__ == '__main__':
    app.run(debug=True)