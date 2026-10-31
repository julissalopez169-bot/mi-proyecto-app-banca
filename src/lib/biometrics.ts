const credentialStorageKey = (userId: string) => `bancanova_biometric_${userId}`;

const toBase64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const fromBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
};

export const supportsBiometrics = () =>
  typeof window !== 'undefined' &&
  window.isSecureContext &&
  !!window.PublicKeyCredential &&
  !!navigator.credentials;

export const supportsPlatformBiometrics = async () => {
  if (!supportsBiometrics()) return false;
  if (!PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) return true;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
};

export interface DeviceBiometricInfo {
  supported: boolean;
  platformAvailable: boolean;
  sensorName: string;
  isMobile: boolean;
  isApple: boolean;
  isAndroid: boolean;
  hasCredential: boolean;
}

export const getDeviceBiometricInfo = async (userId?: string): Promise<DeviceBiometricInfo> => {
  const isSupported = supportsBiometrics();
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isApple = /iPhone|iPad|iPod|Macintosh/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  const isMobile = isAndroid || /iPhone|iPad|iPod/i.test(ua);
  const isWindows = /Windows/i.test(ua);

  let sensorName = 'Sensor Biométrico del Celular';
  if (isApple) {
    sensorName = isMobile ? 'Face ID / Touch ID de tu iPhone' : 'Touch ID de Apple';
  } else if (isAndroid) {
    sensorName = 'Huella Digital / Biometría de tu Android';
  } else if (isWindows) {
    sensorName = 'Windows Hello (Huella / Rostro)';
  }

  let platformAvailable = false;
  try {
    if (isSupported && PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
      platformAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    }
  } catch {
    platformAvailable = false;
  }

  return {
    supported: isSupported,
    platformAvailable,
    sensorName,
    isMobile,
    isApple,
    isAndroid,
    hasCredential: userId ? hasBiometricCredential(userId) : false,
  };
};

export const hasBiometricCredential = (userId: string) =>
  localStorage.getItem(credentialStorageKey(userId)) !== null;

export const hasAccountUsedBiometrics = (userId: string): boolean => {
  if (!userId) return false;
  return (
    hasBiometricCredential(userId) ||
    localStorage.getItem(`bancanova_biometric_enabled_${userId}`) === 'true'
  );
};

export const markAccountBiometricUsed = (userId: string) => {
  if (!userId) return;
  localStorage.setItem(`bancanova_biometric_enabled_${userId}`, 'true');
  localStorage.setItem('bancanova_last_biometric_user_id', userId);
};

export const registerBiometric = async (userId: string, username: string) => {
  if (!supportsBiometrics()) {
    throw new Error('Este navegador o dispositivo no soporta biometría WebAuthn.');
  }

  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const userIdBytes = new TextEncoder().encode(userId);
  let credential: PublicKeyCredential | null = null;

  try {
    credential = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: 'Banca Nova Honduras' },
        user: {
          id: userIdBytes,
          name: username || 'Usuario Banca Nova',
          displayName: username || 'Titular',
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 }, // ES256
          { type: 'public-key', alg: -257 }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
        },
        timeout: 60000,
        attestation: 'none',
      },
    })) as PublicKeyCredential | null;
  } catch (error: any) {
    if (error?.name === 'NotAllowedError') {
      throw new Error('La verificación fue cancelada o no se reconoció la huella/Face ID en el celular.');
    }
    if (error?.name === 'SecurityError') {
      throw new Error('El navegador restringió el acceso a la biometría por política de seguridad.');
    }
    throw new Error(error?.message || 'No se pudo registrar la autenticación biométrica del celular.');
  }

  if (!credential) throw new Error('No se recibió confirmación del sensor biométrico.');
  localStorage.setItem(credentialStorageKey(userId), toBase64Url(new Uint8Array(credential.rawId)));
  return credential;
};

export const authenticateBiometric = async (userId: string) => {
  if (!supportsBiometrics()) return false;
  const storedCredential = localStorage.getItem(credentialStorageKey(userId));
  if (!storedCredential) return false;

  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        allowCredentials: [{ type: 'public-key', id: fromBase64Url(storedCredential) }],
        userVerification: 'required',
        timeout: 60000,
      },
    });
    return !!assertion;
  } catch (error: any) {
    if (error?.name === 'NotAllowedError') {
      throw new Error('La lectura biométrica fue cancelada o no coincidió.');
    }
    throw error;
  }
};

export interface DeviceBiometricResult {
  success: boolean;
  error?: 'canceled' | 'unsupported' | 'iframe_restriction' | 'failed';
  message: string;
  sensorUsed?: string;
}

/**
 * Conecta directamente con la huella digital o Face ID integrado del celular/dispositivo.
 * Si no está vinculado aún, lanza la creación/vinculación nativa en el celular.
 * Si ya está registrado, pide autenticación nativa al sensor del teléfono.
 */
export const verifyWithDeviceBiometrics = async (
  userId: string,
  username: string = 'Titular'
): Promise<DeviceBiometricResult> => {
  const info = await getDeviceBiometricInfo(userId);

  if (!info.supported) {
    return {
      success: false,
      error: 'unsupported',
      message: 'Este navegador o entorno no tiene habilitada la API biométrica del dispositivo.',
      sensorUsed: info.sensorName,
    };
  }

  // Si ya tiene credencial guardada, intentamos autenticar directamente con el sensor del celular
  if (info.hasCredential) {
    try {
      const ok = await authenticateBiometric(userId);
      if (ok) {
        return {
          success: true,
          message: `¡${info.sensorName} autenticado correctamente!`,
          sensorUsed: info.sensorName,
        };
      }
    } catch (err: any) {
      if (err?.message?.includes('cancelada') || err?.name === 'NotAllowedError') {
        return {
          success: false,
          error: 'canceled',
          message: 'La lectura de la huella/Face ID fue cancelada en el celular.',
          sensorUsed: info.sensorName,
        };
      }
      // Si la credencial falló, intentamos re-vincular de inmediato
    }
  }

  // Si no está registrado o la credencial expiró, activamos el sensor del celular para vincularlo y autenticarlo
  try {
    await registerBiometric(userId, username);
    return {
      success: true,
      message: `¡${info.sensorName} vinculado y autenticado con éxito!`,
      sensorUsed: info.sensorName,
    };
  } catch (err: any) {
    if (err?.name === 'NotAllowedError' || err?.message?.includes('cancelada')) {
      return {
        success: false,
        error: 'canceled',
        message: 'La lectura del sensor biométrico fue cancelada o no reconocida en tu celular.',
        sensorUsed: info.sensorName,
      };
    }
    if (err?.name === 'SecurityError') {
      return {
        success: false,
        error: 'iframe_restriction',
        message: 'Acceso al sensor del celular restringido por el navegador en este marco.',
        sensorUsed: info.sensorName,
      };
    }
    return {
      success: false,
      error: 'failed',
      message: err?.message || 'Error al conectar con el sensor biométrico del celular.',
      sensorUsed: info.sensorName,
    };
  }
};

export const removeBiometric = (userId: string) => {
  localStorage.removeItem(credentialStorageKey(userId));
};