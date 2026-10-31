import React, { useState, useRef } from 'react';
import { UserProfile } from '../types';

interface AvatarStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onSaveAvatar: (newAvatarUrl: string) => void;
  onShowToast: (title: string, message: string, type?: 'success' | 'info' | 'error') => void;
}

export const AvatarStudioModal: React.FC<AvatarStudioModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSaveAvatar,
  onShowToast,
}) => {
  const [selectedAvatar, setSelectedAvatar] = useState<string>(currentUser.avatarUrl);
  const [activeTab, setActiveTab] = useState<'gallery' | 'upload' | 'url'>('gallery');
  const [customUrlInput, setCustomUrlInput] = useState<string>('');
  const [filterStyle, setFilterStyle] = useState<'none' | 'warm' | 'bw' | 'cool'>('none');
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Curated Professional Corporate & Executive Avatars (High Resolution Unsplash Portraits)
  const professionalAvatars = [
    {
      id: 'exec-1',
      name: 'Elena Montes (Ejecutiva)',
      category: 'Ejecutivo',
      url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
    },
    {
      id: 'exec-2',
      name: 'Sofía Valenzuela (Directora)',
      category: 'Directivo',
      url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400',
    },
    {
      id: 'exec-3',
      name: 'Carlos Mendoza (Finanzas)',
      category: 'Ejecutivo',
      url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400',
    },
    {
      id: 'exec-4',
      name: 'Valeria Ramos (Banca Privada)',
      category: 'Privada',
      url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
    },
    {
      id: 'exec-5',
      name: 'Alejandro Vega (Inversiones)',
      category: 'Inversión',
      url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
    },
    {
      id: 'exec-6',
      name: 'Gabriela Silva (CEO & Founder)',
      category: 'Directivo',
      url: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=400',
    },
    {
      id: 'exec-7',
      name: 'Martín Duarte (Tech Lead)',
      category: 'Tecnología',
      url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400',
    },
    {
      id: 'exec-8',
      name: 'Camila Navarro (Consultora)',
      category: 'Consultoría',
      url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400',
    },
    {
      id: 'exec-9',
      name: 'Daniel Alarcón (Analista Senior)',
      category: 'Finanzas',
      url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400',
    },
    {
      id: 'exec-10',
      name: 'Lucía Benítez (Global Partner)',
      category: 'Directivo',
      url: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=400',
    },
    {
      id: 'exec-11',
      name: 'Rodrigo Castillo (Asset Manager)',
      category: 'Inversión',
      url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400',
    },
    {
      id: 'exec-12',
      name: 'Isabella Fontana (Private Wealth)',
      category: 'Privada',
      url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400',
    },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      onShowToast('Formato no válido', 'Por favor selecciona un archivo de imagen (PNG, JPG, WEBP).', 'error');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      onShowToast('Imagen muy grande', 'El archivo no debe superar los 8MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setSelectedAvatar(event.target.result);
        onShowToast('Imagen Cargada', 'Tu foto personalizada ha sido cargada correctamente.', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleApplyUrl = () => {
    if (!customUrlInput.trim()) {
      onShowToast('Enlace requerido', 'Por favor ingresa una URL de imagen válida.', 'error');
      return;
    }
    setSelectedAvatar(customUrlInput.trim());
    onShowToast('Imagen Vinculada', 'Se ha cargado la imagen desde el enlace web.', 'info');
  };

  const handleSave = () => {
    onSaveAvatar(selectedAvatar);
    onShowToast('Foto de Perfil Actualizada', 'Tu nuevo avatar profesional ha sido guardado con éxito.', 'success');
    onClose();
  };

  // Get CSS filter classes based on selected filter
  const getFilterClass = () => {
    switch (filterStyle) {
      case 'warm':
        return 'sepia-[0.18] contrast-[1.05] brightness-[1.03]';
      case 'bw':
        return 'grayscale contrast-[1.15] brightness-[0.98]';
      case 'cool':
        return 'contrast-[1.08] saturate-[1.12]';
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-xl w-full border border-black/[0.08] shadow-[0_24px_70px_rgba(0,0,0,0.18)] text-[#1D1D1F] max-h-[92vh] overflow-y-auto relative">
        
        {/* Modal Header */}
        <div className="flex justify-between items-start pb-3.5 mb-4 border-b border-black/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0071E3] flex items-center justify-center shadow-xs border border-blue-100">
              <span className="material-symbols-outlined text-[22px]">account_circle</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-[#1D1D1F]">
                  Estudio de Avatar Profesional
                </h3>
                <span className="text-[10px] font-bold text-[#0071E3] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                  HD Banca Nova
                </span>
              </div>
              <p className="text-xs text-[#86868B]">
                Elige un retrato ejecutivo o sube tu propia fotografía personal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F5F5F7] hover:bg-black/[0.08] text-[#86868B] hover:text-[#1D1D1F] flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Live Interactive Avatar Preview & Identity Card */}
        <div className="bg-gradient-to-br from-[#F5F5F7] to-blue-50/40 p-4 rounded-3xl border border-black/[0.06] mb-5 flex flex-col sm:flex-row items-center gap-4 shadow-2xs">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-[#0071E3] to-[#0284C7] shadow-md">
              <img
                src={selectedAvatar}
                alt="Vista Previa"
                className={`w-full h-full rounded-full object-cover bg-white ${getFilterClass()} transition-all duration-300`}
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400';
                }}
              />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-[#0071E3] text-white rounded-full w-6 h-6 flex items-center justify-center shadow-xs border-2 border-white">
              <span className="material-symbols-outlined text-[14px]">verified</span>
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              <h4 className="text-sm font-bold text-[#1D1D1F]">{currentUser.name}</h4>
              <span className="text-[10px] font-bold bg-black/[0.06] text-[#1D1D1F] px-2 py-0.5 rounded-full border border-black/[0.06]">
                {currentUser.plan || 'Black VIP'}
              </span>
            </div>
            <p className="text-xs text-[#86868B] leading-relaxed">
              Esta imagen se sincronizará en tu perfil, tarjetas, comprobantes de transferencia y barra de navegación.
            </p>

            {/* Subtle Filter Buttons */}
            <div className="flex items-center justify-center sm:justify-start gap-1.5 mt-2.5">
              <span className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider mr-1">
                Filtro:
              </span>
              {[
                { id: 'none', label: 'Natural' },
                { id: 'warm', label: 'Cálido' },
                { id: 'bw', label: 'B&N' },
                { id: 'cool', label: 'Nórdico' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilterStyle(f.id as any)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer border ${
                    filterStyle === f.id
                      ? 'bg-[#0071E3] text-white border-[#0071E3] shadow-2xs'
                      : 'bg-white text-[#86868B] border-black/[0.08] hover:bg-black/[0.03]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Method Switcher Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#F5F5F7] rounded-2xl mb-4 border border-black/[0.04]">
          <button
            type="button"
            onClick={() => setActiveTab('gallery')}
            className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'gallery'
                ? 'bg-white text-[#0071E3] shadow-xs ring-1 ring-black/[0.04]'
                : 'text-[#86868B] hover:text-[#1D1D1F]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">portrait</span>
            <span>Galería Ejecutiva</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-white text-[#0071E3] shadow-xs ring-1 ring-black/[0.04]'
                : 'text-[#86868B] hover:text-[#1D1D1F]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">upload_file</span>
            <span>Subir Archivo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'url'
                ? 'bg-white text-[#0071E3] shadow-xs ring-1 ring-black/[0.04]'
                : 'text-[#86868B] hover:text-[#1D1D1F]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">link</span>
            <span>Enlace Web</span>
          </button>
        </div>

        {/* TAB 1: EXECUTIVE GALLERY */}
        {activeTab === 'gallery' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#1D1D1F]">
                Selecciona un retrato ejecutivo de alta calidad:
              </span>
              <span className="text-[11px] text-[#0071E3] font-semibold bg-blue-50 px-2 py-0.5 rounded-full">
                12 Opciones Disponibles
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-[220px] overflow-y-auto p-1 pr-2 scrollbar-thin">
              {professionalAvatars.map((av) => {
                const isSelected = selectedAvatar === av.url;
                return (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => setSelectedAvatar(av.url)}
                    className={`relative p-1 rounded-2xl border transition-all cursor-pointer flex flex-col items-center gap-1 group ${
                      isSelected
                        ? 'border-[#0071E3] bg-blue-50/50 shadow-xs ring-2 ring-[#0071E3]/25'
                        : 'border-black/[0.08] hover:border-black/[0.2] bg-white hover:bg-[#F5F5F7]'
                    }`}
                  >
                    <div className="w-14 h-14 rounded-full overflow-hidden relative shadow-2xs">
                      <img
                        src={av.url}
                        alt={av.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <span className="text-[10px] font-bold text-[#1D1D1F] truncate w-full text-center px-1">
                      {av.category}
                    </span>
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#0071E3] text-white flex items-center justify-center shadow-xs">
                        <span className="material-symbols-outlined text-[11px]">check</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: UPLOAD FROM DEVICE */}
        {activeTab === 'upload' && (
          <div className="space-y-3">
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 rounded-3xl border-2 border-dashed text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                dragActive
                  ? 'border-[#0071E3] bg-blue-50'
                  : 'border-black/[0.15] bg-[#F9FAFB] hover:bg-blue-50/40 hover:border-[#0071E3]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0071E3] flex items-center justify-center mb-2 shadow-xs border border-blue-100">
                <span className="material-symbols-outlined text-[26px]">add_photo_alternate</span>
              </div>
              <p className="text-xs font-bold text-[#1D1D1F]">
                Haz clic para examinar o arrastra tu foto aquí
              </p>
              <p className="text-[11px] text-[#86868B] mt-1">
                Soporta archivos PNG, JPG o WEBP (Máximo 8MB)
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: CUSTOM IMAGE URL */}
        {activeTab === 'url' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-[#1D1D1F] mb-1.5">
                Dirección URL de tu Imagen:
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={customUrlInput}
                  onChange={(e) => setCustomUrlInput(e.target.value)}
                  placeholder="https://ejemplo.com/mi-foto-profesional.jpg"
                  className="flex-1 bg-[#F5F5F7] border border-black/[0.08] rounded-xl px-3 py-2 text-xs text-[#1D1D1F] outline-none focus:border-[#0071E3] focus:bg-white"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  className="px-4 py-2 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  Probar
                </button>
              </div>
            </div>
            <p className="text-[11px] text-[#86868B]">
              Puedes pegar un enlace directo a una imagen de LinkedIn, GitHub, Unsplash o cualquier servidor de imágenes.
            </p>
          </div>
        )}

        {/* Actions Footer */}
        <div className="flex gap-2.5 pt-4 mt-4 border-t border-black/[0.06]">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/[0.04] transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-[#0071E3] hover:bg-[#0077ED] text-white shadow-xs transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">save</span>
            <span>Guardar Foto de Perfil</span>
          </button>
        </div>

      </div>
    </div>
  );
};
