import { useRef, useState } from 'react';
import { uploadAsset } from '../../api/site';

export default function FileUploadButton({ accept = 'image/*', label = 'Upload', onUploaded, onError, className }) {
    const inputRef = useRef(null);
    const [uploading, setUploading] = useState(false);

    const pick = () => inputRef.current?.click();

    const handleFile = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        setUploading(true);
        try {
            const { data } = await uploadAsset(file);
            onUploaded?.(data.url);
        } catch (err) {
            console.error(err);
            onError?.(err?.response?.data?.error || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    return (
        <>
            <button type="button" onClick={pick} className={className || 'btn-add'} disabled={uploading}>
                {uploading ? 'Uploading…' : label}
            </button>
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                style={{ display: 'none' }}
                onChange={handleFile}
            />
        </>
    );
}
