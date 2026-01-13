import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import {
    Upload,
    Image as ImageIcon,
    Settings,
    Zap,
    CheckCircle,
    AlertCircle,
    Download,
    RefreshCcw,
    Layers,
    Maximize2,
    ChevronRight
} from 'lucide-react';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';

const API_URL = "localhost:8000"; // No protocol for WS

const ImageProcessor = () => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [status, setStatus] = useState("idle");
    const [statusMsg, setStatusMsg] = useState("Ready to transform");
    const [resultUrl, setResultUrl] = useState(null);
    const [resultFilename, setResultFilename] = useState(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [fileSize, setFileSize] = useState(0);
    const [options, setOptions] = useState({
        resize: false,
        grayscale: false,
        compress: true,
        target_format: 'original',
        target_width: '',
        target_height: ''
    });
    const [history, setHistory] = useState([]);
    const [isDemoMode, setIsDemoMode] = useState(false);

    const wsRef = useRef(null);

    const onDrop = useCallback(acceptedFiles => {
        const selected = acceptedFiles[0];
        if (selected) {
            setFileSize((selected.size / 1024).toFixed(2));
            setFile(selected);
            const url = URL.createObjectURL(selected);
            setPreview(url);

            const img = new Image();
            img.onload = () => {
                setDimensions({ width: img.width, height: img.height });
            };
            img.src = url;

            setStatus("idle");
            setResultUrl(null);
            setStatusMsg("Image loaded. Choose your options.");
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': [] },
        multiple: false
    });

    const fetchHistory = useCallback(async () => {
        try {
            const res = await fetch(`http://${API_URL}/history/`);
            if (res.ok) {
                const data = await res.json();
                setHistory(data.history || []);
            }
        } catch (err) {
            console.error("Failed to fetch history");
        }
    }, []);

    useEffect(() => {
        const checkBackend = async () => {
            try {
                const res = await fetch(`http://${API_URL}/`).catch(() => ({ ok: false }));
                if (!res.ok) throw new Error();
                setIsDemoMode(false);
            } catch (err) {
                console.warn("Backend offline, entering Demo Mode for portfolio showcase.");
                setIsDemoMode(true);
            }
        };
        checkBackend();
        fetchHistory();
    }, [fetchHistory]);

    const connectWebSocket = useCallback((taskId) => {
        if (wsRef.current) wsRef.current.close();

        const ws = new WebSocket(`ws://${API_URL}/ws/status/${taskId}`);
        wsRef.current = ws;

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.status === 'SUCCESS') {
                const finalUrl = `http://${API_URL}/results/${data.result.filename}`;
                setResultUrl(finalUrl);
                setResultFilename(data.result.filename);
                setFileSize((data.result.size_bytes / 1024).toFixed(2));
                setStatus("success");
                setStatusMsg("Unleashed! Your image is ready.");
                setDimensions({ width: data.result.dimensions[0], height: data.result.dimensions[1] });
                fetchHistory(); // Refresh history
                ws.close();
            } else if (data.status === 'FAILURE') {
                setStatus("error");
                setStatusMsg("Processing failed.");
                ws.close();
            } else {
                setStatusMsg(`Status: ${data.status}...`);
            }
        };

        ws.onerror = () => {
            setStatus("error");
            setStatusMsg("WebSocket connection error.");
        };
    }, []);

    const handleUpload = async () => {
        if (!file) return;

        setStatus("uploading");
        setStatusMsg("Unleashing the image to the cloud...");

        if (isDemoMode) {
            // Simulated demo flow
            await new Promise(r => setTimeout(r, 1500));
            setStatus("processing");
            setStatusMsg("AI is refining your masterpiece (Demo Mode)...");
            await new Promise(r => setTimeout(r, 2000));

            // In demo mode, we just "succeed" with the current preview
            setResultUrl(preview);
            setResultFilename("demo_result.png");
            setStatus("success");
            setStatusMsg("Demo transformation complete! (Simulated)");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append('options', JSON.stringify(options));

        try {
            const res = await fetch(`http://${API_URL}/upload/`, {
                method: 'POST',
                body: formData
            });

            if (!res.ok) throw new Error("Upload failed");

            const data = await res.json();
            setStatus("processing");
            setStatusMsg("AI is working its magic...");
            connectWebSocket(data.task_id);

        } catch (err) {
            setStatus("error");
            setStatusMsg("Failed to reach the processor.");
        }
    };

    const reset = () => {
        if (wsRef.current) wsRef.current.close();
        setFile(null);
        setPreview(null);
        setResultUrl(null);
        setResultFilename(null);
        setStatus("idle");
        setStatusMsg("Ready to transform");
    };

    return (
        <div className="min-h-screen py-8 sm:py-16 px-4 font-sans text-slate-100 overflow-x-hidden">
            <div className="absolute top-0 left-0 w-full h-full -z-10 bg-[radial-gradient(circle_at_50%_50%,_rgba(17,24,39,1)_0%,_rgba(0,0,0,1)_100%)]"></div>

            {/* Ambient Background Glows */}
            <div className="fixed top-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-900/10 blur-[120px] rounded-full -z-10 animate-pulse"></div>
            <div className="fixed bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-900/10 blur-[120px] rounded-full -z-10"></div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-6xl mx-auto"
            >
                {/* Brand Section */}
                <header className="text-center mb-16 relative">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6 text-xs font-bold tracking-widest text-purple-400 uppercase"
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                        </span>
                        Neural Engine v2.0
                    </motion.div>

                    <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter mb-4 leading-none italic pl-1">
                        NEO<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500 pr-3">IMAGE</span>
                    </h1>
                    <p className="text-slate-400 text-base md:text-xl max-w-2xl mx-auto font-medium tracking-tight px-4 mb-8">
                        Instant, high-fidelity image transformations powered by distributed neural tasks.
                    </p>

                    <div className="flex items-center justify-center">
                        {isDemoMode && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2"
                            >
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                Demo Mode Proxy Active
                            </motion.div>
                        )}
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
                    {/* Visual Area */}
                    <div className="lg:col-span-7 xl:col-span-8 space-y-8">
                        <motion.div
                            layout
                            className={`relative rounded-[30px] md:rounded-[40px] border border-white/10 bg-black/40 backdrop-blur-3xl overflow-hidden shadow-[0_0_80px_-20px_rgba(168,85,247,0.15)] transition-all duration-700
                                ${!preview ? 'p-8 sm:p-20' : 'p-3 sm:p-8'}`}
                        >
                            <AnimatePresence mode="wait">
                                {!preview ? (
                                    <motion.div
                                        key="dropzone"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        {...getRootProps()}
                                        className="relative group h-[300px] sm:h-[450px] flex flex-col items-center justify-center cursor-pointer"
                                    >
                                        <input {...getInputProps()} />
                                        <div className={`absolute inset-0 border-2 border-dashed rounded-[30px] transition-all duration-500
                                            ${isDragActive ? 'border-purple-500 bg-purple-500/5' : 'border-white/5 group-hover:border-white/20'}`}></div>

                                        <motion.div
                                            whileHover={{ scale: 1.1, rotate: 5 }}
                                            className="relative z-10 p-8 rounded-[35%] bg-gradient-to-br from-purple-600 to-blue-600 shadow-2xl shadow-purple-500/20 mb-8"
                                        >
                                            <Upload className="w-14 h-14 text-white" />
                                        </motion.div>

                                        <h3 className="relative z-10 text-3xl font-black mb-3">Initiate Transfer</h3>
                                        <p className="relative z-10 text-slate-500 font-bold uppercase tracking-widest text-xs">Drag files or click to browse</p>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="preview"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-900 group"
                                    >
                                        <div className="min-h-[300px] sm:min-h-[500px] flex items-center justify-center">
                                            {resultUrl ? (
                                                <ReactCompareSlider
                                                    itemOne={<ReactCompareSliderImage src={preview} alt="Input" />}
                                                    itemTwo={<ReactCompareSliderImage src={resultUrl} alt="Output" />}
                                                    className="w-full h-full cursor-col-resize"
                                                />
                                            ) : (
                                                <img src={preview} className="max-w-full max-h-[600px] object-contain" alt="Original" />
                                            )}
                                        </div>

                                        {/* HUD Overlay */}
                                        <div className="absolute top-6 left-6 right-6 flex justify-between items-start pointer-events-none">
                                            <div className="px-4 py-2 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-green-500 pulse"></div>
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">{resultUrl ? 'PROCESSED' : 'RAW INPUT'}</span>
                                            </div>

                                            <button
                                                onClick={reset}
                                                className="pointer-events-auto p-3 rounded-2xl bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-white/10 transition-all active:scale-95"
                                            >
                                                <RefreshCcw className="w-5 h-5" />
                                            </button>
                                        </div>

                                        {/* Processing Wave */}
                                        {status === 'processing' && (
                                            <div className="absolute inset-0 bg-purple-900/20 backdrop-blur-[2px] flex flex-col items-center justify-center">
                                                <div className="relative w-24 h-24 mb-6">
                                                    <motion.div
                                                        animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                                                        transition={{ duration: 1.5, repeat: Infinity }}
                                                        className="absolute inset-0 rounded-full border-4 border-purple-500"
                                                    ></motion.div>
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <Zap className="w-10 h-10 text-white animate-pulse" />
                                                    </div>
                                                </div>
                                                <p className="text-xl font-black tracking-[0.3em] uppercase">{statusMsg}</p>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                            <HUDCard icon={<ImageIcon size={16} />} label="Dimensions" value={`${dimensions.width}×${dimensions.height}`} />
                            <HUDCard icon={<Maximize2 size={16} />} label="Size" value={`${fileSize} KB`} />
                            <HUDCard icon={<CheckCircle size={16} />} label="Integrity" value="Verified" />
                        </div>
                    </div>

                    {/* Controls */}
                    <aside className="lg:col-span-5 xl:col-span-4 space-y-6">
                        <section className="p-5 sm:p-8 rounded-[30px] md:rounded-[40px] bg-white/5 border border-white/10 backdrop-blur-xl">
                            <h2 className="text-2xl font-black mb-8 flex items-center gap-3 italic">
                                <Settings className="text-purple-500" /> CONTROLS
                            </h2>

                            <div className="space-y-4 mb-10">
                                <NeoToggle
                                    active={options.grayscale}
                                    onClick={() => setOptions({ ...options, grayscale: !options.grayscale })}
                                    icon={<Layers size={18} />}
                                    title="Monochrome"
                                    desc="Deep contrast grayscale"
                                />
                                <NeoToggle
                                    active={options.resize}
                                    onClick={() => setOptions({ ...options, resize: !options.resize })}
                                    icon={<Maximize2 size={18} />}
                                    title="Neural Upscale"
                                    desc="HD resampling (800px)"
                                >
                                    <div className="grid grid-cols-2 gap-3 mt-2 overflow-hidden">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase text-white/40 ml-1">Width (px)</label>
                                            <input
                                                type="number"
                                                placeholder="Auto"
                                                value={options.target_width}
                                                onChange={(e) => setOptions({ ...options, target_width: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-blue-500 transition-colors"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase text-white/40 ml-1">Height (px)</label>
                                            <input
                                                type="number"
                                                placeholder="Auto"
                                                value={options.target_height}
                                                onChange={(e) => setOptions({ ...options, target_height: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-blue-500 transition-colors"
                                            />
                                        </div>
                                    </div>
                                </NeoToggle>
                                <NeoToggle
                                    active={options.compress}
                                    onClick={() => setOptions({ ...options, compress: !options.compress })}
                                    icon={<Zap size={18} />}
                                    title="Smart Optim"
                                    desc="Reduced weight, high ISO"
                                />
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase mb-4 block">Engine Export Format</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {['original', 'png', 'jpeg', 'webp'].map(fmt => (
                                            <button
                                                key={fmt}
                                                onClick={() => setOptions({ ...options, target_format: fmt })}
                                                className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all
                                                    ${options.target_format === fmt
                                                        ? 'bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-600/40'
                                                        : 'bg-white/5 border-white/5 text-slate-400 hover:border-white/20'}`}
                                            >
                                                {fmt}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <motion.button
                                    onClick={handleUpload}
                                    disabled={!file || status === 'uploading' || status === 'processing' || (!options.grayscale && !options.resize && !options.compress && options.target_format === 'original')}
                                    initial="initial"
                                    animate="initial"
                                    whileHover={(!file || status === 'uploading' || status === 'processing' || (!options.grayscale && !options.resize && !options.compress && options.target_format === 'original')) ? "initial" : "hover"}
                                    whileTap={(!file || status === 'uploading' || status === 'processing' || (!options.grayscale && !options.resize && !options.compress && options.target_format === 'original')) ? "initial" : "tap"}
                                    variants={{
                                        initial: { scale: 1 },
                                        hover: { scale: 1.02 },
                                        tap: { scale: 0.98 }
                                    }}
                                    className={`w-full py-5 px-6 rounded-[30px] font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] text-xs sm:text-sm transition-all duration-500 group relative overflow-hidden flex items-center justify-center gap-3
                                        ${(!file || status === 'uploading' || status === 'processing' || (!options.grayscale && !options.resize && !options.compress && options.target_format === 'original'))
                                            ? 'bg-slate-800 text-white/20 cursor-not-allowed border border-white/5'
                                            : 'bg-slate-700 text-white border-2 border-white/10 hover:border-blue-500/50'
                                        }`}
                                >
                                    {/* Merambat (Sweeping) Gradient Overlay on Hover */}
                                    {(!file || status === 'uploading' || status === 'processing' || (!options.grayscale && !options.resize && !options.compress && options.target_format === 'original')) ? null : (
                                        <motion.div
                                            variants={{
                                                initial: { x: '-101%' },
                                                hover: { x: '0%' }
                                            }}
                                            transition={{ duration: 0.8, ease: "circOut" }}
                                            className="absolute inset-0 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 z-0 bg-[length:200%_100%] animate-gradient-x"
                                        />
                                    )}

                                    <span className="relative z-10 flex items-center gap-3">
                                        {status === 'uploading' || status === 'processing' ? (
                                            <RefreshCcw className="animate-spin" />
                                        ) : (
                                            <Zap size={18} className="fill-current" />
                                        )}
                                        TRANSFORM JOB
                                    </span>
                                </motion.button>

                                {status === 'success' && (
                                    <motion.a
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        href={`http://${API_URL}/download/${resultFilename}`}
                                        download
                                        className="w-full py-5 px-6 rounded-[30px] bg-white text-black font-black text-xs sm:text-sm tracking-tight sm:tracking-widest uppercase flex items-center justify-center gap-3 hover:bg-slate-200 transition-colors"
                                    >
                                        <Download size={18} /> Download Result
                                    </motion.a>
                                )}
                            </div>
                        </section>

                        <div className="p-6 rounded-[30px] bg-black/40 border border-white/10 italic text-[11px] font-medium text-slate-500 uppercase tracking-widest flex items-center gap-4">
                            <div className={`w-2 h-2 rounded-full ${status === 'error' ? 'bg-red-500' : 'bg-purple-500'} animate-pulse`}></div>
                            Status: {statusMsg}
                        </div>
                    </aside>
                </div>

                {/* History Section */}
                <AnimatePresence>
                    {history.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-20 border-t border-white/5 pt-12"
                        >
                            <h3 className="text-xl font-black mb-6 flex items-center gap-3 italic">
                                <RefreshCcw className="text-blue-500 w-4 h-4" /> RECENTLY UNLEASHED
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                {history.map((item, idx) => (
                                    <motion.div
                                        key={idx}
                                        whileHover={{ scale: 1.05, y: -5 }}
                                        className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 group cursor-pointer shadow-lg"
                                    >
                                        <img src={`http://${API_URL}${item.url}`} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt="History" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <a href={`http://${API_URL}/download/${item.name}`} download className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                                <Download size={10} /> Get
                                            </a>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

const HUDCard = ({ icon, label, value }) => (
    <div className="px-5 py-4 sm:px-6 sm:py-4 rounded-[25px] bg-white/5 border border-white/10 flex items-center gap-4 backdrop-blur-md">
        <div className="p-2 sm:p-2.5 rounded-xl bg-purple-500/20 text-purple-400 shrink-0">
            {icon}
        </div>
        <div className="min-w-0">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1.5">{label}</p>
            <p className="text-sm font-black tracking-tight truncate">{value}</p>
        </div>
    </div>
);

const NeoToggle = ({ active, onClick, icon, title, desc, children }) => (
    <div
        onClick={onClick}
        className={`group relative p-4 sm:p-5 rounded-[25px] border cursor-pointer transition-all duration-300 flex flex-col gap-4
            ${active ? 'bg-purple-500/10 border-purple-500/40' : 'bg-white/5 border-transparent hover:border-white/10'}`}
    >
        <div className="flex items-center gap-3 sm:gap-5">
            <div className={`p-3 rounded-2xl transition-all shrink-0 ${active ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/40' : 'bg-white/5 text-slate-500'}`}>
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="font-black text-xs uppercase tracking-widest mb-0.5 truncate">{title}</h4>
                <p className="text-[10px] text-slate-500 font-bold leading-tight line-clamp-2">{desc}</p>
            </div>
            <div className={`w-12 h-6 rounded-full p-1 transition-all shrink-0 ${active ? 'bg-purple-500' : 'bg-slate-800'}`}>
                <motion.div
                    animate={{ x: active ? 24 : 0 }}
                    className="w-4 h-4 bg-white rounded-full shadow-sm"
                />
            </div>
        </div>

        {children && (
            <AnimatePresence>
                {active && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                        onClick={(e) => e.stopPropagation()} // Prevent toggle click when interacting with inputs
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        )}
    </div>
);

export default ImageProcessor;