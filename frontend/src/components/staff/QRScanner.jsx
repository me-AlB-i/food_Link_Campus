/**
 * FoodLink Campus - QR Scanner Component
 * For staff to scan student reservation QR codes
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { QrCode, Camera, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { reservationAPI } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';

/**
 * Manual QR Code Entry Component - Single input field
 */
function ManualEntry({ onVerify, isLoading }) {
    const [code, setCode] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (code.trim()) {
            onVerify(code.trim());
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    QR Code Data
                </label>
                <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Paste the complete QR code here (format: FOODLINK-xxx|signature)"
                    className="input font-mono text-sm h-24 resize-none"
                    disabled={isLoading}
                />
                <p className="text-xs text-surface-400 mt-1">
                    Get this from the student's reservation QR code
                </p>
            </div>
            <button
                type="submit"
                disabled={!code.trim() || isLoading}
                className="btn-primary w-full"
            >
                {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Verify Reservation
                    </>
                )}
            </button>
        </form>
    );
}

/**
 * Verification Result Display
 */
function VerificationResult({ result, onReset }) {
    const isSuccess = result?.status === 'success';

    return (
        <div className={`text-center p-6 rounded-2xl ${isSuccess
            ? 'bg-green-50 dark:bg-green-900/20'
            : 'bg-red-50 dark:bg-red-900/20'
            }`}>
            <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${isSuccess ? 'bg-green-100 dark:bg-green-800' : 'bg-red-100 dark:bg-red-800'
                }`}>
                {isSuccess ? (
                    <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                ) : (
                    <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                )}
            </div>

            <h3 className={`text-xl font-semibold mb-2 ${isSuccess ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
                }`}>
                {isSuccess ? 'Verification Successful!' : 'Verification Failed'}
            </h3>

            <p className={`text-sm mb-4 ${isSuccess ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'
                }`}>
                {result?.message}
            </p>

            {isSuccess && result?.reservation?.food_item && (
                <div className="bg-white dark:bg-surface-800 rounded-xl p-4 mb-4 text-left">
                    <p className="font-medium text-surface-900 dark:text-surface-100">
                        {result.reservation.food_item.name}
                    </p>
                    <p className="text-sm text-surface-500 dark:text-surface-400">
                        {result.reservation.food_item.quantity} {result.reservation.food_item.unit}
                    </p>
                    {result.points_awarded > 0 && (
                        <p className="text-sm text-green-600 dark:text-green-400 mt-2 font-medium">
                            +{result.points_awarded} Green Points awarded
                        </p>
                    )}
                </div>
            )}

            <button onClick={onReset} className="btn-secondary">
                Scan Another
            </button>
        </div>
    );
}

/**
 * Main QR Scanner Component
 */
export default function QRScanner({ isOpen, onClose }) {
    const [mode, setMode] = useState('manual');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [cameraError, setCameraError] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    const { success, error: showError } = useNotification();

    const html5QrCodeRef = useRef(null);
    const isScannerActiveRef = useRef(false);

    // Stop camera function
    const stopCamera = useCallback(async () => {
        if (html5QrCodeRef.current) {
            try {
                if (html5QrCodeRef.current.isScanning) {
                    await html5QrCodeRef.current.stop();
                }
                await html5QrCodeRef.current.clear();
            } catch (err) {
                console.log('Camera stop error (may be expected):', err);
            }
            html5QrCodeRef.current = null;
        }
        isScannerActiveRef.current = false;
        setIsScanning(false);
    }, []);

    // Start camera function
    const startCamera = useCallback(async () => {
        if (isScannerActiveRef.current || html5QrCodeRef.current) {
            return;
        }

        const element = document.getElementById('qr-reader');
        if (!element) {
            setTimeout(startCamera, 100);
            return;
        }

        try {
            isScannerActiveRef.current = true;
            const html5QrCode = new Html5Qrcode("qr-reader", { verbose: false });
            html5QrCodeRef.current = html5QrCode;

            await html5QrCode.start(
                { facingMode: "environment" },
                { fps: 30, qrbox: { width: 250, height: 250 }, formatsToSupport: [0] },
                async (decodedText) => {
                    await stopCamera();
                    handleVerify(decodedText);
                },
                () => { }
            );

            setIsScanning(true);
            setCameraError(null);
        } catch (err) {
            console.error('Camera start error:', err);
            setCameraError('Camera access denied. Use manual entry.');
            isScannerActiveRef.current = false;
        }
    }, [stopCamera]);

    // Effect to handle camera based on mode and isOpen
    useEffect(() => {
        if (isOpen && mode === 'camera' && !result) {
            startCamera();
        } else {
            stopCamera();
        }

        return () => {
            stopCamera();
        };
    }, [isOpen, mode, result, startCamera, stopCamera]);

    // Cleanup on unmount or close
    useEffect(() => {
        if (!isOpen) {
            stopCamera();
            setResult(null);
            setIsLoading(false);
            setCameraError(null);
        }
    }, [isOpen, stopCamera]);

    const handleVerify = async (qrData) => {
        setIsLoading(true);
        console.log('=== QR Verification Debug ===');
        console.log('Raw QR data:', qrData);

        try {
            // Parse QR data - format: "qr_code_string|signature"
            const pipeIndex = qrData.lastIndexOf('|');
            let qrCode, signature;

            if (pipeIndex > 0) {
                qrCode = qrData.substring(0, pipeIndex);
                signature = qrData.substring(pipeIndex + 1);
            } else {
                // No pipe found, use whole string as qr_code
                qrCode = qrData;
                signature = '';
            }

            console.log('Parsed QR Code:', qrCode);
            console.log('Parsed Signature:', signature);
            console.log('Signature length:', signature.length);

            const response = await reservationAPI.verifyQR(qrCode, signature);
            console.log('API Response:', response.data);

            setResult({
                status: 'success',
                message: 'Collection verified successfully!',
                ...response.data,
            });

            success('Reservation verified and collected!');
        } catch (err) {
            console.error('Verification API error:', err);
            console.log('Error response:', err.response?.data);

            const errorMessage = err.response?.data?.error ||
                err.response?.data?.detail ||
                JSON.stringify(err.response?.data) ||
                'Verification failed - check console for details';

            setResult({
                status: 'error',
                message: errorMessage,
            });

            showError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        setResult(null);
        if (mode === 'camera') {
            startCamera();
        }
    };

    const handleModeChange = async (newMode) => {
        await stopCamera();
        setMode(newMode);
        setCameraError(null);
    };

    const handleClose = async () => {
        await stopCamera();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-surface-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-surface-100 dark:border-surface-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-staff-100 dark:bg-staff-900/50 rounded-xl flex items-center justify-center">
                            <QrCode className="w-5 h-5 text-staff-600 dark:text-staff-400" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-surface-900 dark:text-surface-100">Verify Pickup</h2>
                            <p className="text-sm text-surface-500 dark:text-surface-400">Scan or enter QR code</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 rounded-lg text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {result ? (
                        <VerificationResult result={result} onReset={handleReset} />
                    ) : (
                        <>
                            {/* Mode Toggle */}
                            <div className="flex gap-2 mb-6">
                                <button
                                    onClick={() => handleModeChange('manual')}
                                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${mode === 'manual'
                                        ? 'bg-staff-500 text-white'
                                        : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400'
                                        }`}
                                >
                                    Enter Code
                                </button>
                                <button
                                    onClick={() => handleModeChange('camera')}
                                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${mode === 'camera'
                                        ? 'bg-staff-500 text-white'
                                        : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400'
                                        }`}
                                >
                                    <Camera className="w-4 h-4 inline mr-1" />
                                    Camera
                                </button>
                            </div>

                            {mode === 'manual' ? (
                                <ManualEntry onVerify={handleVerify} isLoading={isLoading} />
                            ) : (
                                <div className="text-center">
                                    <style>{`
                                        #qr-reader { border: none !important; }
                                        #qr-reader video { border-radius: 1rem; width: 100% !important; }
                                        #qr-reader__dashboard { display: none !important; }
                                    `}</style>
                                    <div
                                        id="qr-reader"
                                        className="w-full max-w-xs mx-auto rounded-2xl overflow-hidden bg-surface-800"
                                        style={{ minHeight: '280px' }}
                                    />

                                    {cameraError && (
                                        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
                                            <AlertCircle className="w-4 h-4 inline mr-2" />
                                            {cameraError}
                                        </div>
                                    )}

                                    {isScanning && !cameraError && (
                                        <p className="text-surface-500 text-sm mt-4">
                                            Point camera at student's QR code
                                        </p>
                                    )}

                                    {isLoading && (
                                        <div className="mt-4 flex items-center justify-center gap-2 text-staff-600">
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Verifying...</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

/**
 * QR Scanner Button - Floating action button for staff
 */
export function QRScannerButton({ onClick }) {
    return (
        <button
            onClick={onClick}
            className="fixed bottom-24 right-6 z-40 w-14 h-14 rounded-full bg-staff-500 text-white shadow-lg hover:bg-staff-600 hover:scale-110 transition-all flex items-center justify-center"
            aria-label="Scan QR Code"
        >
            <QrCode className="w-6 h-6" />
        </button>
    );
}
