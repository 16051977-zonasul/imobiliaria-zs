/**
 * Utility de otimização de imagens: Converte/comprime um arquivo para o formato .webp via HTML5 Canvas
 */
export async function convertToWebP(file, quality = 0.85) {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !file) {
      resolve(file);
      return;
    }

    if (!file.type || !file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const cleanName = file.name.replace(/\.[^/.]+$/, '') + '.webp';
          const webpFile = new File([blob], cleanName, {
            type: 'image/webp',
            lastModified: Date.now(),
          });
          console.log(`⚡ [WebP Success] ${file.name} (${(file.size / 1024).toFixed(1)} KB) ➔ ${cleanName} (${(webpFile.size / 1024).toFixed(1)} KB)`);
          resolve(webpFile);
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

/**
 * Envia um arquivo (convertido para WebP) para a API /api/upload em FormData
 */
export async function uploadFileToR2(file) {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();

    if (res.ok && data.publicUrl) {
      console.log('✅ [R2 Client Success] URL pública recebida:', data.publicUrl);
      return data.publicUrl;
    } else {
      console.error('❌ [R2 Client Error] Servidor retornou erro:', data.error);
      return null;
    }
  } catch (err) {
    console.error('❌ [R2 Network Error]:', err);
    return null;
  }
}
