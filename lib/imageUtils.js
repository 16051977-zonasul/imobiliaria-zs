/**
 * Utility de otimização de imagens: Converte/comprime um arquivo para o formato .webp via HTML5 Canvas
 */
export async function convertToWebP(file, quality = 0.85) {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !file) {
      resolve(file);
      return;
    }

    if (!file.type.startsWith('image/')) {
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
 * Faz upload de um arquivo convertido para o Cloudflare R2 via URL pré-assinada
 */
export async function uploadFileToR2(file) {
  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: file.name,
        contentType: 'image/webp',
      }),
    });

    const data = await res.json();

    if (res.ok && data.uploadUrl && data.publicUrl) {
      const uploadRes = await fetch(data.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'image/webp' },
        body: file,
      });

      if (uploadRes.ok) {
        return data.publicUrl;
      } else {
        console.warn('PUT no R2 falhou:', uploadRes.statusText);
      }
    }
    return null;
  } catch (err) {
    console.error('Erro na chamada para a rota de upload R2:', err);
    return null;
  }
}
