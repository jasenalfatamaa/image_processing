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
        formData.append('options', JSON.stringify(options)); // Kirim sebagai string JSON

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

    const [options, setOptions] = useState({
        resize: false,
        grayscale: false,
        target_format: 'original'
    });

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

                    {/* Option Area */}
                    <div className="bg-base-200 p-6 rounded-lg shadow-md mt-4">
                        <h3 className="text-lg font-semibold mb-4 text-gray-700">Processing Options</h3>
                        
                        <div className="space-y-3">
                            {/* Grayscale Toggle */}
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={options.grayscale}
                                    onChange={(e) => setOptions({...options, grayscale: e.target.checked})}
                                    className="form-checkbox h-5 w-5 text-blue-600" 
                                />
                                <span className="text-gray-700">Apply Grayscale Filter</span>
                            </label>

                            {/* Resize Toggle */}
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={options.resize}
                                    onChange={(e) => setOptions({...options, resize: e.target.checked})}
                                    className="form-checkbox h-5 w-5 text-blue-600" 
                                />
                                <span className="text-gray-700">Resize to Standard (800px Width)</span>
                            </label>

                            {/* Format Selector */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Target Format</label>
                                <select 
                                    value={options.target_format}
                                    onChange={(e) => setOptions({...options, target_format: e.target.value})}
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="original">Original Format</option>
                                    <option value="png">PNG</option>
                                    <option value="jpeg">JPEG</option>
                                    <option value="webp">WebP</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Status & Progress */}
                    <div className="mt-4">
                        {(status === 'uploading' || status === 'processing') && (
                            <progress className="progress progress-primary w-full"></progress>
                        )}
                        
                        {status === 'success' && (
                            <div className="flex flex-col gap-2">
                                <div className="alert alert-success text-sm py-2">
                                    <span>✅ Processing Complete!</span>
                                </div>
                                {/* Tombol Download Baru */}
                                <a 
                                    href={resultUrl} 
                                    download 
                                    className="btn btn-outline btn-success btn-sm w-full"
                                >
                                    📥 Download Result
                                </a>
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