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
 * Sanitiza/format a URL do R2 para garantir que utilize o domínio público configurado.
 * Caso a URL venha do banco contendo o endpoint privado 'r2.cloudflarestorage.com',
 * substitui automaticamente esse prefixo pela URL pública (pub-*.r2.dev).
 */
export function formatR2Url(url) {
  if (!url || typeof url !== 'string') return url;

  const publicBaseUrl = (
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
    process.env.R2_PUBLIC_URL ||
    'https://pub-42d565a9b2e84ce4986d533a9e7a3358.r2.dev'
  ).replace(/\/$/, '');

  if (url.includes('r2.cloudflarestorage.com')) {
    const bucketName = process.env.R2_BUCKET_NAME || 'imoveis';
    try {
      const parsed = new URL(url);
      let pathname = parsed.pathname;

      // Se o pathname começar com /bucketName/bucketName/ (ex: /imoveis/imoveis/123.webp), remove o primeiro prefixo do bucket
      if (pathname.startsWith(`/${bucketName}/${bucketName}/`)) {
        pathname = pathname.substring(bucketName.length + 1);
      }

      return `${publicBaseUrl}${pathname}`;
    } catch (e) {
      return url.replace(/https?:\/\/[^\/]+\.r2\.cloudflarestorage\.com(\/[^\/]+)?/, publicBaseUrl);
    }
  }

  return url;
}

/**
 * Sanitiza um array de URLs do R2
 */
export function formatR2Urls(urls) {
  if (!Array.isArray(urls)) return [];
  return urls.map((url) => formatR2Url(url));
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
      const publicUrl = formatR2Url(data.publicUrl);
      console.log('✅ [R2 Client Success] URL pública recebida:', publicUrl);
      return publicUrl;
    } else {
      console.error('❌ [R2 Client Error] Servidor retornou erro:', data.error);
      return null;
    }
  } catch (err) {
    console.error('❌ [R2 Network Error]:', err);
    return null;
  }
}

