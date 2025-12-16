import React, { useState, useCallback } from 'react';

// Pastikan Backend Anda berjalan di port 8000
const API_URL = "http://localhost:8000"; 

const ImageProcessor = () => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [status, setStatus] = useState("idle"); // idle, uploading, processing, success, error
    const [statusMsg, setStatusMsg] = useState("");
    const [resultUrl, setResultUrl] = useState(null);

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            setFile(selected);
            setPreview(URL.createObjectURL(selected)); // Buat preview lokal
            setStatus("idle");
            setResultUrl(null);
            setStatusMsg("Ready to process");
        }
    };

    const pollStatus = useCallback(async (id) => {
        try {
            const response = await fetch(`${API_URL}/status/${id}`);
            const data = await response.json();

            if (data.status === 'SUCCESS') {
                const filename = data.result.file.split("/").pop().split("\\").pop();
                setResultUrl(`${API_URL}/results/${filename}`);
                setStatus("success");
                setStatusMsg("Done! Image processed successfully.");
            } else if (data.status === 'FAILURE') {
                setStatus("error");
                setStatusMsg("Processing Failed.");
            } else {
                // Masih processing...
                setStatusMsg(data.status); 
                setTimeout(() => pollStatus(id), 2000);
            }
        } catch (error) {
            setStatus("error");
            setStatusMsg("Connection Error");
        }
    }, []);

    const handleUpload = async () => {
        if (!file) return;

        setStatus("uploading");
        setStatusMsg("Uploading image...");
        
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch(`${API_URL}/upload/`, {
                method: 'POST',
                body: formData
            });
            
            if (!res.ok) throw new Error("Upload failed");
            
            const data = await res.json();
            setStatus("processing");
            setStatusMsg("Processing in background...");
            pollStatus(data.task_id);

        } catch (err) {
            setStatus("error");
            setStatusMsg("Failed to upload image.");
        }
    };

    return (
        <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
            <div className="card w-96 bg-base-100 shadow-xl transition-all hover:shadow-2xl">
                <div className="card-body">
                    <h2 className="card-title justify-center text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        AI Image Processor
                    </h2>
                    <p className="text-center text-gray-500 mb-4">Upload and transform your image</p>

                    {/* Area Upload */}
                    <div className="form-control w-full">
                        <input 
                            type="file" 
                            className="file-input file-input-bordered file-input-primary w-full" 
                            onChange={handleFileChange}
                            accept="image/*"
                        />
                    </div>

                    {/* Preview Area */}
                    {(preview || resultUrl) && (
                        <figure className="mt-4 rounded-lg overflow-hidden border-2 border-base-300 relative h-64 bg-gray-100">
                            <img 
                                src={resultUrl || preview} 
                                alt="Preview" 
                                className="object-contain w-full h-full transition-opacity duration-500"
                            />
                            {/* Badge Label */}
                            <div className="absolute top-2 right-2 badge badge-neutral">
                                {resultUrl ? 'Result' : 'Original'}
                            </div>
                        </figure>
                    )}

                    {/* Status & Progress */}
                    <div className="mt-4">
                        {(status === 'uploading' || status === 'processing') && (
                            <progress className="progress progress-primary w-full"></progress>
                        )}
                        
                        {status === 'success' && (
                            <div className="alert alert-success text-sm py-2">
                                <span>✅ Processing Complete!</span>
                            </div>
                        )}
                        
                        {status === 'error' && (
                            <div className="alert alert-error text-sm py-2">
                                <span>❌ {statusMsg}</span>
                            </div>
                        )}
                    </div>

                    {/* Action Button */}
                    <div className="card-actions justify-end mt-4">
                        <button 
                            className={`btn btn-primary w-full ${status === 'uploading' || status === 'processing' ? 'loading' : ''}`}
                            onClick={handleUpload}
                            disabled={!file || status === 'uploading' || status === 'processing'}
                        >
                            {status === 'uploading' ? 'Uploading...' : 
                             status === 'processing' ? 'Processing...' : 'Start Processing'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageProcessor;