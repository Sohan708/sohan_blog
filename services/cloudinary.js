export async function uploadImage(file) {
  if (!file) return null;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !uploadPreset) {
    throw new Error('CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET must be set');
  }

  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const form = new FormData();
  const blob = new Blob([file.buffer], { type: file.mimetype || 'application/octet-stream' });
  form.append('file', blob, file.originalname || 'upload');
  form.append('upload_preset', uploadPreset);

  const response = await fetch(endpoint, { method: 'POST', body: form });
  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Cloudinary upload failed: ${response.status} ${details}`);
  }

  const payload = await response.json();
  return payload.secure_url || payload.url || null;
}
