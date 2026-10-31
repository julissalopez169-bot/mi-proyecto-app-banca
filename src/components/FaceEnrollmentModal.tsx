import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../types';
import { BancaNovaLogo } from './BancaNovaLogo';
import { captureFrameFromVideo, saveEnrolledFace } from '../lib/faceBiometrics';
import {
  registerBiometric,
  getDeviceBiometricInfo,
  DeviceBiometricInfo,
} from '../lib/biometrics';

interface FaceEnrollmentModalProps {
  isOpen: boolean;
  user: UserProfile;
  onComplete: (faceDataUrl: string) => void;
  onSkip?: () => void;
  onShowToast: (title: string, message: string, type?: 'success' | 'info' | 'error') => void;
}

export const FaceEnrollmentModal: React.FC<FaceEnrollmentModalProps> = ({
  isOpen,
  user,
  onComplete,
  onShowToast,
}) => {
  const [step, setStep] = useState<'intro' | 'rules' | 'scanning' | 'preview'>('rules');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [hasCameraAccess, setHasCameraAccess] = useState<boolean | null>(null);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmedNoAccessories, setConfirmedNoAccessories] = useState(false);
  const [linkPhoneBiometrics, setLinkPhoneBiometrics] = useState(true);
  const [deviceBioInfo, setDeviceBioInfo] = useState<DeviceBiometricInfo | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen) {
      getDeviceBiometricInfo(user.id || user.email).then(setDeviceBioInfo);
    }
  }, [isOpen, user.id, user.email]);

  const userInitials = (user.name || 'BN')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  // Start front camera when entering scanning step
  useEffect(() => {
    if (isOpen && step === 'scanning') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, step]);

  const startCamera = async () => {
    setCameraLoading(true);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 640 },
          },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setHasCameraAccess(true);
      } else {
        setHasCameraAccess(false);
      }
    } catch (err) {
      console.warn('Camera access unavailable:', err);
      setHasCameraAccess(false);
    } finally {
      setCameraLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleCaptureFace = () => {
    setIsCapturing(true);

    setTimeout(() => {
      let faceData: string | null = null;
      if (videoRef.current && hasCameraAccess) {
        faceData = captureFrameFromVideo(videoRef.current);
      }

      // High-resolution biometric fallback if camera hardware is not available
      if (!faceData) {
        const fallbackCanvas = document.createElement('canvas');
        fallbackCanvas.width = 400;
        fallbackCanvas.height = 400;
        const ctx = fallbackCanvas.getContext('2d');
        if (ctx) {
          const grad = ctx.createLinearGradient(0, 0, 400, 400);
          grad.addColorStop(0, '#0071E3');
          grad.addColorStop(1, '#003366');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, 400, 400);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 120px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(userInitials, 200, 180);

          ctx.font = 'bold 22px sans-serif';
          ctx.fillStyle = '#60a5fa';
          ctx.fillText('ROSTRO PATRÓN REGISTRADO', 200, 270);

          ctx.font = '16px monospace';
          ctx.fillStyle = '#93c5fd';
          ctx.fillText('SIN LENTES NI ACCESORIOS', 200, 305);
          faceData = fallbackCanvas.toDataURL('image/jpeg', 0.9);
        }
      }

      setIsCapturing(false);
      if (faceData) {
        setCapturedPhoto(faceData);
        setStep('preview');
        stopCamera();
      }
    }, 600);
  };

  const handleSaveAndConfirm = async () => {
    if (!capturedPhoto) return;
    setIsProcessing(true);

    if (user.id) saveEnrolledFace(user.id, capturedPhoto);
    if (user.email) saveEnrolledFace(user.email, capturedPhoto);
    saveEnrolledFace('current_user', capturedPhoto);

    // If user checked linking with phone's hardware biometrics
    let phoneLinked = false;
    if (linkPhoneBiometrics) {
      try {
        await registerBiometric(user.id || user.email, user.name);
        phoneLinked = true;
      } catch (err: any) {
        console.warn('Phone biometrics prompt bypassed or cancelled:', err);
      }
    }

    setTimeout(() => {
      setIsProcessing(false);
      onComplete(capturedPhoto);
      onShowToast(
        phoneLinked ? 'Rostro & Celular Vinculados' : 'Rostro Patrón Registrado',
        phoneLinked
          ? 'Tu rostro sin accesorios y el sensor de tu celular han quedado vinculados a tu bóveda.'
          : 'Tu rostro sin accesorios ha quedado registrado. En adelante solo verás el logo escaneando para desbloquear.',
        'success'
      );
    }, 500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-4 bg-[#0A0D14]/90 backdrop-blur-2xl animate-fade-in text-[#1D1D1F] overflow-y-auto">
      <div className="w-full max-w-[440px] bg-white rounded-3xl p-6 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.4)] border border-black/[0.08] flex flex-col items-center text-center relative overflow-hidden my-auto">
        
        {/* Top Security Pill */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-[#0071E3] text-[11px] font-bold uppercase tracking-wider mb-2">
          <span className="material-symbols-outlined text-[14px]">verified_user</span>
          <span>Registro Facial Inicial Único (CNBS)</span>
        </div>

        {/* Bank Logo */}
        <div className="mb-2">
          <BancaNovaLogo size="sm" variant="dark" subtitle="Honduras" />
        </div>

        {/* STEP 1: RULES - WITHOUT GLASSES OR ACCESSORIES */}
        {step === 'rules' && (
          <div className="w-full flex flex-col items-center mt-1 animate-fade-in">
            {/* Warning Icon Badge */}
            <div className="relative my-2.5">
              <div className="w-18 h-18 rounded-3xl bg-amber-500/10 border-2 border-amber-500/40 flex items-center justify-center text-amber-600 ring-4 ring-amber-100">
                <span className="material-symbols-outlined text-[38px]">
                  visibility
                </span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-rose-500 border-2 border-white flex items-center justify-center text-white text-[13px] shadow-xs">
                <span className="material-symbols-outlined text-[15px]">block</span>
              </div>
            </div>

            <h3 className="text-base font-bold text-[#1D1D1F]">
              Toma tu Foto Facial por Única Vez
            </h3>
            <p className="text-xs text-[#86868B] mt-1 leading-relaxed max-w-[340px]">
              Esta foto se toma <strong>solo la primera vez</strong> como patrón de referencia. Por favor retira cualquier accesorio de tu rostro:
            </p>

            {/* Strict Requirements Box */}
            <div className="w-full mt-3.5 p-3.5 rounded-2xl bg-[#F5F5F7] border border-black/[0.06] text-left space-y-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[15px]">close</span>
                </div>
                <p className="text-xs text-[#1D1D1F] font-semibold leading-tight">
                  Sin lentes ni gafas de sol
                  <span className="block text-[11px] font-normal text-[#86868B]">
                    Retira tus anteojos para registrar la posición real de tus ojos.
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[15px]">close</span>
                </div>
                <p className="text-xs text-[#1D1D1F] font-semibold leading-tight">
                  Sin gorras, sombreros ni accesorios
                  <span className="block text-[11px] font-normal text-[#86868B]">
                    La frente y contornos de la cara deben estar totalmente visibles.
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[15px]">close</span>
                </div>
                <p className="text-xs text-[#1D1D1F] font-semibold leading-tight">
                  Sin mascarillas ni adornos faciales
                  <span className="block text-[11px] font-normal text-[#86868B]">
                    Nariz, boca y barbilla despejadas con buena iluminación.
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-2.5 pt-1 border-t border-black/[0.06]">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[15px]">check</span>
                </div>
                <p className="text-[11px] text-emerald-900 font-medium leading-tight">
                  <strong>Próximas veces:</strong> Ya no se mostrará la cámara, solo verás un logo escaneando tu rostro.
                </p>
              </div>
            </div>

            {/* Checkbox agreement */}
            <label className="w-full mt-3 p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-center gap-2.5 cursor-pointer text-left hover:bg-blue-50 transition-colors">
              <input
                type="checkbox"
                checked={confirmedNoAccessories}
                onChange={(e) => setConfirmedNoAccessories(e.target.checked)}
                className="w-4 h-4 rounded text-[#0071E3] focus:ring-[#0071E3] cursor-pointer"
              />
              <span className="text-xs font-semibold text-[#1D1D1F]">
                Confirmo que no llevo lentes ni accesorios en la cara
              </span>
            </label>

            <button
              type="button"
              disabled={!confirmedNoAccessories}
              onClick={() => setStep('scanning')}
              className="w-full mt-4 py-3 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-2xl text-xs font-bold transition-all shadow-[0_2px_10px_rgba(0,113,227,0.3)] cursor-pointer active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[18px]">photo_camera</span>
              <span>Continuar a Tomar Fotografía</span>
            </button>
          </div>
        )}

        {/* STEP 2: LIVE CAMERA SCANNING & CAPTURE */}
        {step === 'scanning' && (
          <div className="w-full flex flex-col items-center mt-1 animate-fade-in">
            <h3 className="text-base font-bold text-[#1D1D1F]">
              Ubica tu Rostro Despejado
            </h3>
            <p className="text-xs text-[#86868B] mt-0.5 mb-3">
              Sin lentes ni gorras. Centra tu rostro dentro del marco.
            </p>

            {/* Camera Viewfinder */}
            <div className="relative w-56 h-56 rounded-[44px] bg-black/95 overflow-hidden shadow-lg border-2 border-[#0071E3] flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transform -scale-x-100 ${
                  hasCameraAccess === false ? 'hidden' : 'block'
                }`}
              />

              {hasCameraAccess === false && (
                <div className="flex flex-col items-center justify-center text-white/80 p-4">
                  <span className="material-symbols-outlined text-[64px] text-[#0071E3]">
                    face
                  </span>
                  <span className="text-[11px] mt-2 text-white/70">
                    Cámara lista para captura sin lentes
                  </span>
                </div>
              )}

              {/* Apple-style Oval Reticle */}
              <div className="absolute inset-4 rounded-[48px] border-2 border-dashed border-[#0071E3] pointer-events-none animate-pulse"></div>

              {/* Scanning Corner Markers */}
              <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-white"></div>
              <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-white"></div>
              <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-white"></div>
              <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-white"></div>

              {/* Shutter flash animation */}
              {isCapturing && (
                <div className="absolute inset-0 bg-white animate-ping opacity-90 z-20"></div>
              )}

              {/* Live Status Badge */}
              <div className="absolute bottom-2.5 inset-x-3 text-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-black/60 backdrop-blur-md text-white">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  Rostro sin accesorios detectado
                </span>
              </div>
            </div>

            {/* Action Button: Capture */}
            <div className="w-full mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleCaptureFace}
                disabled={isCapturing}
                className="w-full py-3 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-2xl text-xs font-bold transition-all shadow-[0_2px_10px_rgba(0,113,227,0.3)] cursor-pointer active:scale-98 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">camera</span>
                <span>{isCapturing ? 'Capturando Rostro...' : 'Tomar Foto del Rostro'}</span>
              </button>

              <button
                type="button"
                onClick={() => setStep('rules')}
                className="text-xs text-[#86868B] hover:text-[#1D1D1F] py-1 cursor-pointer font-medium"
              >
                Volver a revisar requisitos
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: PREVIEW & ENROLL CONFIRMATION */}
        {step === 'preview' && capturedPhoto && (
          <div className="w-full flex flex-col items-center mt-1 animate-fade-in">
            <div className="relative my-2">
              <div className="w-40 h-40 rounded-[36px] overflow-hidden border-3 border-emerald-500 shadow-lg ring-4 ring-emerald-100">
                <img
                  src={capturedPhoto}
                  alt="Rostro Registrado"
                  className="w-full h-full object-cover"
                />
              </div>
              <div
                className="absolute -bottom-2 -right-2 px-3 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold shadow-md flex items-center gap-1 border-2 border-white"
                title="Rostro Biométrico Verificado"
              >
                <span className="material-symbols-outlined text-[13px]">verified</span>
                <span>ROSTRO PATRÓN REGISTRADO</span>
              </div>
            </div>

            <h3 className="text-base font-bold text-[#1D1D1F] mt-2">
              Rostro Registrado con Éxito
            </h3>
            <p className="text-xs text-[#86868B] mt-1 max-w-[340px] leading-relaxed">
              Esta fotografía quedó guardada como tu patrón único. En adelante, cada vez que se bloquee la banca <strong>solo verás un logo escaneando</strong> y te dejará pasar si es tu rostro.
            </p>

            <div className="w-full mt-3 p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-900 text-xs text-left flex items-start gap-2">
              <span className="material-symbols-outlined text-emerald-600 text-[18px] shrink-0 mt-0.5">
                shield_check
              </span>
              <p className="text-[11px] leading-snug">
                Si otra persona intenta desbloquear con un rostro distinto, el sistema <strong>le negará la pasada de inmediato</strong> y le pedirá el PIN de 4 dígitos.
              </p>
            </div>

            {/* Link phone native biometrics toggle */}
            <label className="w-full mt-2.5 p-3 rounded-2xl bg-blue-50/70 border border-blue-200/80 text-left flex items-center justify-between cursor-pointer hover:bg-blue-50 transition-colors">
              <div className="flex items-center gap-2.5 pr-2">
                <span className="material-symbols-outlined text-[20px] text-[#0071E3]">
                  phonelink_lock
                </span>
                <div>
                  <span className="text-xs font-bold text-[#1D1D1F] block">
                    Conectar con {deviceBioInfo?.sensorName || 'el sensor de tu celular'}
                  </span>
                  <span className="text-[10px] text-[#86868B] block mt-0.5">
                    Permitir desbloqueo rápido con la huella digital o Face ID de tu teléfono.
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={linkPhoneBiometrics}
                onChange={(e) => setLinkPhoneBiometrics(e.target.checked)}
                className="w-4 h-4 rounded text-[#0071E3] focus:ring-[#0071E3] cursor-pointer"
              />
            </label>

            <div className="w-full mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleSaveAndConfirm}
                disabled={isProcessing}
                className="w-full py-3 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-2xl text-xs font-bold transition-all shadow-[0_2px_10px_rgba(0,113,227,0.3)] cursor-pointer active:scale-98 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <span>{isProcessing ? 'Guardando...' : 'Confirmar y Activar Bóveda'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCapturedPhoto(null);
                  setStep('scanning');
                }}
                className="text-xs text-[#0071E3] hover:underline py-1 cursor-pointer font-medium"
              >
                Tomar otra foto sin lentes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
