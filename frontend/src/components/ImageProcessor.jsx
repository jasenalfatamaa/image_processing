import React, { useState, useCallback } from 'react';

// Pastikan Backend Anda berjalan di port 8000
const API_URL = "http://localhost:8000"; 

const ImageProcessor = () => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [status, setStatus] = useState("idle"); // idle, uploading, processing, success, error
    const [statusMsg, setStatusMsg] = useState("");
    const [resultUrl, setResultUrl] = useState(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [fileSize, setFileSize] = useState(0);

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            setFileSize((selected.size / 1024).toFixed(2)); // Ukuran dalam KB
            setFile(selected);
            const url = URL.createObjectURL(selected);
            setPreview(url); // Buat preview lokal

            const img = new Image();
            img.onload = () => {
                setDimensions({ width: img.width, height: img.height });
            };
            img.src = url;

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
                const finalUrl = `${API_URL}/results/${filename}`;

                // Ambil ukuran file dari hasil return backend
                const processedSize = (data.result.size_bytes / 1024).toFixed(2);

                setResultUrl(finalUrl);
                setFileSize(processedSize);
                setStatus("success");
                setStatusMsg("Done! Image processed successfully.");

                const img = new Image();
                img.onload = () => {
                    setDimensions({ width: img.width, height: img.height });
                };
                img.src = finalUrl;

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
        compress: false,
        target_format: 'original'
    });

    // cek apakah ada opsi yang dipilih
    const isOptionChanged = 
        options.resize ||
        options.grayscale ||
        options.compress ||
        options.target_format !== 'original';
    
    const isButtonDisabled = !file || status === "processing" || status === "uploading" || !isOptionChanged;

    return (
        <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
            <div className="card w-150 bg-base-100 shadow-xl transition-all hover:shadow-2xl">
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
                        <div className="mt-4 text-left">
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

                            <div className="mt-2 flex items-center space-x-2 text-sm text-gray-600 font-mono">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                </svg>
                                <span>Size: {dimensions.width}px x {dimensions.height}px ({fileSize} KB)</span>
                            </div>
                        </div>
                    )}

                    {/* Option Area */}
                    <div className="bg-base-100 rounded-lg shadow-md mt-4">
                        <h3 className="text-lg font-semibold mb-4 text-white text-left">Processing Options : </h3>
                        
                        <div className="space-y-3">
                            {/* Compress Toggle */}
                            <label className="flex items-center space-x-3 cursor-pointer w-full">
                                <input 
                                    type="checkbox" 
                                    checked={options.compress}
                                    onChange={(e) => setOptions({...options, compress: e.target.checked})}
                                    className="form-checkbox h-5 w-5 text-green-600" 
                                />
                                <span className="text-white">Compress Image (High Quality)</span>
                            </label>

                            {/* Grayscale Toggle */}
                            <label className="flex text-left space-x-3 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={options.grayscale}
                                    onChange={(e) => setOptions({...options, grayscale: e.target.checked})}
                                    className="form-checkbox h-5 w-5 text-blue-600" 
                                />
                                <span className="text-white">Apply Grayscale Filter</span>
                            </label>

                            {/* Resize Toggle */}
                            <label className="flex text-left space-x-3 cursor-pointer mb-10">
                                <input 
                                    type="checkbox" 
                                    checked={options.resize}
                                    onChange={(e) => setOptions({...options, resize: e.target.checked})}
                                    className="form-checkbox h-5 w-5 text-blue-600" 
                                />
                                <span className="text-white">Resize to Standard (800px Width)</span>
                            </label>

                            {/* Format Selector */}
                            <div className='text-left'>
                                <label className="block text-sm font-medium text-white mb-1">Format</label>
                                <select 
                                    value={options.target_format}
                                    onChange={(e) => setOptions({...options, target_format: e.target.value})}
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option className='text-black' value="original">Original Format</option>
                                    <option className='text-black' value="png">PNG</option>
                                    <option className='text-black' value="jpeg">JPEG</option>
                                    <option className='text-black' value="webp">WebP</option>
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
                                <div className="alert alert-success text-sm py-2 mb-2">
                                    <span>✅ Processing Complete!</span>
                                </div>
                                {/* Tombol Download Baru */}
                                <a 
                                    href={resultUrl} 
                                    download 
                                    className="btn btn-outline btn-success btn-sm w-full font-bold text-base items-center"
                                >
                                    Download Result
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
                            disabled={isButtonDisabled}
                        >
                            {status === 'uploading' ? 'Uploading...' : 
                             status === 'processing' ? 'Processing...' : 'Start Processing'}
                        </button>

                        {/* Tampilkan pesan instruksi jika file ada tapi opsi belum dipilih */}
                        {file && !isOptionChanged && status !== "processing" && (
                            <p className="mt-2 text-xs text-amber-600 text-center italic">
                                * Please select at least one processing option to start.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageProcessor;