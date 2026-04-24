import { useEffect, useState } from 'react';
import { getContent, updateContent } from '../../api/site';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminSection from '../../components/admin/AdminSection';
import Toast from '../../components/admin/Toast';
import FileUploadButton from '../../components/admin/FileUploadButton';
import '../../components/admin/adminShared.css';
import '../../components/forms.css';

export default function ContentPage() {
    const [content, setContent] = useState({ title: '', description: '', image: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        (async () => {
            try {
                const { data } = await getContent();
                setContent({
                    title: data.content?.title || '',
                    description: data.content?.description || '',
                    image: data.content?.image || ''
                });
            } catch {
                setToast({ type: 'error', message: 'Failed to load content' });
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const update = (patch) => setContent((c) => ({ ...c, ...patch }));

    const save = async () => {
        setSaving(true);
        try {
            await updateContent(content);
            setToast({ type: 'success', message: 'Content saved' });
        } catch {
            setToast({ type: 'error', message: 'Save failed' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="admin-loading">Loading…</div>;

    return (
        <>
            <AdminPageHeader
                title="Landing Page Content"
                subtitle="The headline, description, and hero image shown at the top of the salescode.ai landing page."
            >
                <button className="btn-primary" onClick={save} disabled={saving}>
                    {saving ? 'Saving…' : 'Save Changes'}
                </button>
            </AdminPageHeader>

            <form className="config-form" onSubmit={(e) => { e.preventDefault(); save(); }}>
                <AdminSection title="Hero content" collapsible={false}>
                    <div className="form-group">
                        <label>Title</label>
                        <input
                            value={content.title}
                            onChange={(e) => update({ title: e.target.value })}
                            placeholder="e.g. AI for Sales, eB2B and NextGen SFA for CPG Sales"
                        />
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            value={content.description}
                            onChange={(e) => update({ description: e.target.value })}
                            placeholder="Supporting paragraph displayed under the title"
                            rows={4}
                        />
                    </div>

                    <div className="form-group">
                        <label>Image</label>
                        {content.image && <img src={content.image} alt="" className="admin-media-thumb admin-media-thumb--hero" />}
                        <div className="admin-actions-bar">
                            <FileUploadButton
                                label={content.image ? 'Replace' : 'Upload'}
                                accept="image/*"
                                onUploaded={(url) => update({ image: url })}
                                onError={(msg) => setToast({ type: 'error', message: msg })}
                            />
                            {content.image && (
                                <button
                                    type="button"
                                    className="btn-remove"
                                    onClick={() => update({ image: '' })}
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>
                </AdminSection>

                <button type="submit" className="btn-save" disabled={saving}>
                    {saving ? 'Saving…' : 'Save Changes'}
                </button>
            </form>

            <Toast
                message={toast?.message}
                type={toast?.type}
                onClose={() => setToast(null)}
            />
        </>
    );
}
