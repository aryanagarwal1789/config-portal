import { useRef, useState } from 'react';
import { uploadAsset } from '../api/experiencePortal';
import './SEOFieldsForm.css';

/* ── Collapsible schema card ── */
function SchemaCard({ title, icon, enabled, onToggle, children }) {
    const [open, setOpen] = useState(false);

    return (
        <div className={`schema-card ${enabled ? 'schema-enabled' : ''}`}>
            <div className="schema-card-header" onClick={() => enabled && setOpen((o) => !o)}>
                <div className="schema-card-left">
                    <label className="schema-toggle" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={enabled} onChange={(e) => { onToggle(e.target.checked); if (e.target.checked) setOpen(true); }} />
                        <span className="s-track"><span className="s-thumb" /></span>
                    </label>
                    <span className="schema-icon">{icon}</span>
                    <span className="schema-title">{title}</span>
                </div>
                {enabled && (
                    <span className={`schema-chevron ${open ? 'open' : ''}`}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </span>
                )}
            </div>
            {enabled && open && <div className="schema-card-body">{children}</div>}
        </div>
    );
}

/* ── Shared field components ── */
function Field({ label, hint, children }) {
    return (
        <div className="seo-field">
            <label>{label}{hint && <span className="seo-field-hint"> {hint}</span>}</label>
            {children}
        </div>
    );
}

function Input({ value, onChange, placeholder }) {
    return <input value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />;
}

function ImageUrlInput({ value, onChange, placeholder }) {
    const inputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);

    const handlePick = () => {
        setError(null);
        inputRef.current?.click();
    };

    const handleFile = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const res = await uploadAsset(file);
            if (res?.data?.path) onChange(res.data.path);
        } catch {
            setError('Upload failed. Try again.');
        } finally {
            setUploading(false);
            if (inputRef.current) inputRef.current.value = '';
        }
    };

    return (
        <div className="seo-image-input">
            <div className="seo-image-input-row">
                {value ? (
                    <img src={value} alt="" className="seo-image-thumb" />
                ) : (
                    <div className="seo-image-thumb placeholder">IMG</div>
                )}
                <input value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
                <button type="button" className="seo-image-upload-btn" onClick={handlePick} disabled={uploading}>
                    {uploading ? 'Uploading…' : 'Upload'}
                </button>
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFile}
                />
            </div>
            {error && <span className="seo-image-error">{error}</span>}
        </div>
    );
}

function Textarea({ value, onChange, placeholder, rows = 2 }) {
    return <textarea value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows} />;
}

/* ── Main SEOFieldsForm ── */
export default function SEOFieldsForm({ seo = {}, onChange }) {
    const set = (key, value) => onChange({ ...seo, [key]: value });
    const schemas = seo.schemas || {};
    const setSchema = (key, value) => onChange({ ...seo, schemas: { ...schemas, [key]: value } });
    const removeSchema = (key) => {
        const next = { ...schemas };
        delete next[key];
        onChange({ ...seo, schemas: Object.keys(next).length ? next : null });
    };

    /* Software Application */
    const sa = schemas.softwareApplication || {};
    const setSA = (k, v) => setSchema('softwareApplication', { ...sa, [k]: v });

    /* FAQ Page */
    const faqItems = schemas.faqPage?.items || [];
    const setFAQItems = (items) => setSchema('faqPage', { items });
    const addFAQ = () => setFAQItems([...faqItems, { question: '', answer: '' }]);
    const updateFAQ = (i, k, v) => setFAQItems(faqItems.map((item, idx) => idx === i ? { ...item, [k]: v } : item));
    const removeFAQ = (i) => setFAQItems(faqItems.filter((_, idx) => idx !== i));

    /* Organization */
    const org = schemas.organization || {};
    const setOrg = (k, v) => setSchema('organization', { ...org, [k]: v });

    /* Speakable */
    const sp = schemas.speakable || {};
    const setSP = (k, v) => setSchema('speakable', { ...sp, [k]: v });

    return (
        <div className="seo-fields-form">
            {/* ── Basic SEO ── */}
            <div className="seo-section-label">Basic SEO</div>
            <div className="seo-grid-2">
                <Field label="Meta Title">
                    <Input value={seo.metaTitle} onChange={(v) => set('metaTitle', v)} placeholder="Page title shown in search results" />
                </Field>
                <Field label="Focus Keyphrase">
                    <Input value={seo.focusKeyphrase} onChange={(v) => set('focusKeyphrase', v)} placeholder="e.g. experience portal" />
                </Field>
            </div>
            <Field label="Meta Description">
                <Textarea value={seo.metaDescription} onChange={(v) => set('metaDescription', v)} placeholder="Short description shown in search results" rows={2} />
            </Field>
            <Field label="Canonical URL">
                <Input value={seo.canonicalUrl} onChange={(v) => set('canonicalUrl', v)} placeholder="https://example.com/page" />
            </Field>

            {/* ── Open Graph ── */}
            <div className="seo-section-label" style={{ marginTop: 8 }}>Open Graph</div>
            <div className="seo-grid-2">
                <Field label="OG Title">
                    <Input value={seo.ogTitle} onChange={(v) => set('ogTitle', v)} placeholder="Title for social sharing" />
                </Field>
                <Field label="OG Image URL">
                    <ImageUrlInput value={seo.ogImage} onChange={(v) => set('ogImage', v)} placeholder="https://..." />
                </Field>
            </div>
            <Field label="OG Description">
                <Textarea value={seo.ogDescription} onChange={(v) => set('ogDescription', v)} placeholder="Description for social sharing" rows={2} />
            </Field>

            {/* ── Structured Data / Schemas ── */}
            <div className="seo-section-label" style={{ marginTop: 8 }}>Structured Data Schemas</div>
            <div className="schemas-list">

                {/* Software Application */}
                <SchemaCard
                    title="Software Application"
                    icon="💻"
                    enabled={!!schemas.softwareApplication}
                    onToggle={(on) => on ? setSchema('softwareApplication', { name: '', description: '', url: '', publisherName: '', publisherUrl: '' }) : removeSchema('softwareApplication')}
                >
                    <div className="seo-grid-2">
                        <Field label="Name"><Input value={sa.name} onChange={(v) => setSA('name', v)} placeholder="App name" /></Field>
                        <Field label="URL"><Input value={sa.url} onChange={(v) => setSA('url', v)} placeholder="https://..." /></Field>
                    </div>
                    <Field label="Description"><Textarea value={sa.description} onChange={(v) => setSA('description', v)} placeholder="App description" /></Field>
                    <div className="seo-grid-3">
                        <Field label="Price"><Input value={sa.price} onChange={(v) => setSA('price', v)} placeholder="0.00" /></Field>
                        <Field label="Currency"><Input value={sa.priceCurrency} onChange={(v) => setSA('priceCurrency', v)} placeholder="USD" /></Field>
                        <Field label="Price Description"><Input value={sa.priceDescription} onChange={(v) => setSA('priceDescription', v)} placeholder="Free trial" /></Field>
                    </div>
                    <div className="seo-grid-2">
                        <Field label="Rating Value"><Input value={sa.ratingValue} onChange={(v) => setSA('ratingValue', v)} placeholder="4.5" /></Field>
                        <Field label="Review Count"><Input value={sa.reviewCount} onChange={(v) => setSA('reviewCount', v)} placeholder="120" /></Field>
                        <Field label="Publisher Name"><Input value={sa.publisherName} onChange={(v) => setSA('publisherName', v)} placeholder="Company name" /></Field>
                        <Field label="Publisher URL"><Input value={sa.publisherUrl} onChange={(v) => setSA('publisherUrl', v)} placeholder="https://..." /></Field>
                    </div>
                </SchemaCard>

                {/* FAQ Page */}
                <SchemaCard
                    title="FAQ Page"
                    icon="❓"
                    enabled={!!schemas.faqPage}
                    onToggle={(on) => on ? setSchema('faqPage', { items: [{ question: '', answer: '' }] }) : removeSchema('faqPage')}
                >
                    <div className="faq-schema-list">
                        {faqItems.map((item, i) => (
                            <div key={i} className="faq-schema-item">
                                <div className="faq-schema-item-header">
                                    <span className="faq-schema-num">Q{i + 1}</span>
                                    <button type="button" className="faq-schema-remove" onClick={() => removeFAQ(i)}>Remove</button>
                                </div>
                                <Input value={item.question} onChange={(v) => updateFAQ(i, 'question', v)} placeholder="Question" />
                                <Textarea value={item.answer} onChange={(v) => updateFAQ(i, 'answer', v)} placeholder="Answer" rows={2} />
                            </div>
                        ))}
                    </div>
                    <button type="button" className="seo-btn-add" onClick={addFAQ}>+ Add FAQ Item</button>
                </SchemaCard>

                {/* Organization */}
                <SchemaCard
                    title="Organization"
                    icon="🏢"
                    enabled={!!schemas.organization}
                    onToggle={(on) => on ? setSchema('organization', { name: '', url: '', logo: '', description: '' }) : removeSchema('organization')}
                >
                    <div className="seo-grid-2">
                        <Field label="Name"><Input value={org.name} onChange={(v) => setOrg('name', v)} placeholder="Organization name" /></Field>
                        <Field label="URL"><Input value={org.url} onChange={(v) => setOrg('url', v)} placeholder="https://..." /></Field>
                        <Field label="Logo URL"><Input value={org.logo} onChange={(v) => setOrg('logo', v)} placeholder="https://..." /></Field>
                        <Field label="Founder Name"><Input value={org.founderName} onChange={(v) => setOrg('founderName', v)} placeholder="John Doe" /></Field>
                    </div>
                    <Field label="Description"><Textarea value={org.description} onChange={(v) => setOrg('description', v)} placeholder="About the organization" /></Field>
                    <div className="seo-grid-3">
                        <Field label="LinkedIn"><Input value={org.linkedIn} onChange={(v) => setOrg('linkedIn', v)} placeholder="https://linkedin.com/company/..." /></Field>
                        <Field label="Twitter"><Input value={org.twitter} onChange={(v) => setOrg('twitter', v)} placeholder="https://twitter.com/..." /></Field>
                        <Field label="YouTube"><Input value={org.youtube} onChange={(v) => setOrg('youtube', v)} placeholder="https://youtube.com/..." /></Field>
                    </div>
                    <Field label="Number of Employees" hint="(optional)">
                        <Input value={org.numberOfEmployees} onChange={(v) => setOrg('numberOfEmployees', v)} placeholder="50" />
                    </Field>
                </SchemaCard>

                {/* Speakable */}
                <SchemaCard
                    title="Speakable"
                    icon="🔊"
                    enabled={!!schemas.speakable}
                    onToggle={(on) => on ? setSchema('speakable', { url: '', cssSelectors: [] }) : removeSchema('speakable')}
                >
                    <Field label="URL"><Input value={sp.url} onChange={(v) => setSP('url', v)} placeholder="https://..." /></Field>
                    <Field label="CSS Selectors" hint="(comma-separated)">
                        <Input
                            value={Array.isArray(sp.cssSelectors) ? sp.cssSelectors.join(', ') : ''}
                            onChange={(v) => setSP('cssSelectors', v.split(',').map((s) => s.trim()).filter(Boolean))}
                            placeholder=".headline, .summary"
                        />
                    </Field>
                </SchemaCard>
            </div>
        </div>
    );
}
