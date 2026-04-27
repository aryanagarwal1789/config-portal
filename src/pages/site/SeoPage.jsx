import { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { getSeo, updateSeo, SEO_PAGES } from '../../api/site';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminSection from '../../components/admin/AdminSection';
import Toast from '../../components/admin/Toast';
import FileUploadButton from '../../components/admin/FileUploadButton';
import '../../components/admin/adminShared.css';
import '../../components/forms.css';

const BLANK_SOFTWARE_APPLICATION = {
    name: '', description: '', url: '',
    price: '', priceCurrency: '', priceDescription: '',
    ratingValue: '', reviewCount: '',
    publisherName: '', publisherUrl: ''
};
const BLANK_FAQ = { items: [] };
const BLANK_ORGANIZATION = {
    name: '', url: '', logo: '', description: '',
    linkedIn: '', twitter: '', youtube: '',
    founderName: '', numberOfEmployees: ''
};
const BLANK_SPEAKABLE = { url: '', cssSelectors: [] };

const BLANK_SCHEMAS = {
    softwareApplication: BLANK_SOFTWARE_APPLICATION,
    faqPage: BLANK_FAQ,
    organization: BLANK_ORGANIZATION,
    speakable: BLANK_SPEAKABLE
};

const BLANK_SCHEMAS_ENABLED = {
    softwareApplication: false,
    faqPage: false,
    organization: false,
    speakable: false
};

const BLANK_SEO = {
    metaTitle: '',
    metaDescription: '',
    keywords: [],
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    twitterTitle: '',
    twitterDescription: '',
    twitterImage: '',
    canonicalUrl: '',
    focusKeyphrase: '',
    robots: 'index, follow',
    schemas: BLANK_SCHEMAS,
    schemasEnabled: BLANK_SCHEMAS_ENABLED
};

function EnableToggle({ checked, onChange, label = 'Enable' }) {
    return (
        <label className="admin-toggle" title={label} onClick={(e) => e.stopPropagation()}>
            <input
                type="checkbox"
                checked={!!checked}
                onChange={(e) => onChange(e.target.checked)}
            />
            <span className="admin-toggle-track">
                <span className="admin-toggle-thumb" />
            </span>
        </label>
    );
}

function SeoValidation({ result }) {
    return <div className={`seo-validation is-${result.status}`}>{result.message}</div>;
}

function SeoValidationPill({ result }) {
    return <span className={`seo-validation-pill is-${result.status}`}>{result.message}</span>;
}

const parseKeywords = (input) =>
    input.split(',').map((k) => k.trim()).filter(Boolean);

const parseSelectors = (input) =>
    input.split('\n').map((s) => s.trim()).filter(Boolean);

const isValidUrl = (v) => {
    try { new URL(v); return true; } catch { return false; }
};

const validateMetaTitle = (v) => {
    const len = (v || '').length;
    if (!v) return { status: 'red', message: 'Required' };
    if (len < 30) return { status: 'orange', message: `Too short (${len}/60) — aim for 50–60` };
    if (len <= 60) return { status: 'green', message: `Good (${len}/60)` };
    return { status: 'red', message: `Too long (${len}/60) — Google cuts off at 60` };
};

const validateMetaDescription = (v) => {
    const len = (v || '').length;
    if (!v) return { status: 'red', message: 'Required' };
    if (len < 80) return { status: 'orange', message: `Too short (${len}/160) — aim for 120–160` };
    if (len <= 160) return { status: 'green', message: `Good (${len}/160)` };
    return { status: 'red', message: `Too long (${len}/160) — Google cuts off at 160` };
};

const validateKeywords = (arr) => {
    const n = arr.length;
    if (n === 0) return { status: 'orange', message: 'No keywords added' };
    if (n < 3) return { status: 'orange', message: `Add more keywords (${n} added)` };
    return { status: 'green', message: `Good (${n} keywords)` };
};

const validateOgTitle = (v) => {
    const len = (v || '').length;
    if (!v) return { status: 'orange', message: 'Defaults to metaTitle if blank' };
    if (len > 60) return { status: 'red', message: `Too long (${len}/60)` };
    return { status: 'green', message: `Good (${len}/60)` };
};

const validateOgDescription = (v) => {
    const len = (v || '').length;
    if (!v) return { status: 'orange', message: 'Defaults to metaDescription if blank' };
    if (len > 160) return { status: 'red', message: `Too long (${len}/160)` };
    return { status: 'green', message: `Good (${len}/160)` };
};

const validateOgImage = (v) => {
    if (!v) return { status: 'red', message: 'Required — social previews will be blank' };
    return { status: 'green', message: 'Good' };
};

const validateTwitterTitle = (v) => {
    const len = (v || '').length;
    if (!v) return { status: 'orange', message: 'Defaults to ogTitle if blank' };
    if (len > 60) return { status: 'red', message: `Too long (${len}/60)` };
    return { status: 'green', message: `Good (${len}/60)` };
};

const validateTwitterDescription = (v) => {
    const len = (v || '').length;
    if (!v) return { status: 'orange', message: 'Defaults to ogDescription if blank' };
    if (len > 160) return { status: 'red', message: `Too long (${len}/160)` };
    return { status: 'green', message: `Good (${len}/160)` };
};

const validateTwitterImage = (v) => {
    if (!v) return { status: 'orange', message: 'Defaults to ogImage if blank' };
    return { status: 'green', message: 'Good' };
};

const validateCanonicalUrl = (v) => {
    if (!v) return { status: 'orange', message: 'Defaults to page URL if blank' };
    if (!isValidUrl(v)) return { status: 'red', message: 'Invalid URL format' };
    return { status: 'green', message: 'Good' };
};

const validateFocusKeyphrase = (v) => {
    if (!v) return { status: 'orange', message: 'Helps with SEO analysis scoring' };
    return { status: 'green', message: 'Good' };
};

const validateRobots = (v) => {
    if (!v) return { status: 'orange', message: 'Defaults to index, follow' };
    return { status: 'green', message: 'Good' };
};

const schemaStatus = (enabled, allFilled) => {
    if (!enabled) return { status: 'grey', message: 'Not enabled' };
    if (!allFilled) return { status: 'orange', message: 'Fill in schema fields' };
    return { status: 'green', message: 'Good' };
};

const validateSoftwareApplication = (enabled, sa) => {
    const filled = !!sa.name && !!sa.description && !!sa.url && !!sa.publisherName && !!sa.publisherUrl;
    return schemaStatus(enabled, filled);
};

const validateFaqPage = (enabled, faq) => {
    const filled = faq.items.length > 0 && faq.items.every((i) => i.question && i.answer);
    return schemaStatus(enabled, filled);
};

const validateOrganization = (enabled, org) => {
    const filled = !!org.name && !!org.url && !!org.logo && !!org.description;
    return schemaStatus(enabled, filled);
};

const validateSpeakable = (enabled, speak, selectors) => {
    const filled = !!speak.url && selectors.length > 0;
    return schemaStatus(enabled, filled);
};

export default function SeoPage() {
    const { pageKey } = useParams();
    const pageMeta = SEO_PAGES.find((p) => p.key === pageKey);

    const [seo, setSeo] = useState(BLANK_SEO);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [keywordsInput, setKeywordsInput] = useState('');
    const [speakableSelectorsInput, setSpeakableSelectorsInput] = useState('');

    useEffect(() => {
        if (!pageMeta) return;
        setLoading(true);
        (async () => {
            try {
                const { data } = await getSeo(pageKey);
                const loaded = data.seo || {};
                const mergedSchemas = {
                    softwareApplication: { ...BLANK_SOFTWARE_APPLICATION, ...(loaded.schemas?.softwareApplication || {}) },
                    faqPage: { items: loaded.schemas?.faqPage?.items || [] },
                    organization: { ...BLANK_ORGANIZATION, ...(loaded.schemas?.organization || {}) },
                    speakable: {
                        url: loaded.schemas?.speakable?.url || '',
                        cssSelectors: loaded.schemas?.speakable?.cssSelectors || []
                    }
                };
                const mergedEnabled = { ...BLANK_SCHEMAS_ENABLED, ...(loaded.schemasEnabled || {}) };
                setSeo({
                    ...BLANK_SEO,
                    ...loaded,
                    schemas: mergedSchemas,
                    schemasEnabled: mergedEnabled
                });
                setKeywordsInput((loaded.keywords || []).join(', '));
                setSpeakableSelectorsInput((mergedSchemas.speakable.cssSelectors || []).join('\n'));
            } catch {
                setToast({ type: 'error', message: 'Failed to load SEO' });
            } finally {
                setLoading(false);
            }
        })();
    }, [pageKey, pageMeta]);

    if (!pageMeta) {
        return <Navigate to="/seo/landing" replace />;
    }

    const update = (patch) => setSeo((prev) => ({ ...prev, ...patch }));

    const updateSchema = (key, patch) =>
        setSeo((prev) => ({
            ...prev,
            schemas: {
                ...prev.schemas,
                [key]: { ...prev.schemas[key], ...patch }
            }
        }));

    const toggleSchema = (key, value) =>
        setSeo((prev) => ({
            ...prev,
            schemasEnabled: { ...prev.schemasEnabled, [key]: value }
        }));

    const updateFaqItem = (idx, patch) =>
        setSeo((prev) => ({
            ...prev,
            schemas: {
                ...prev.schemas,
                faqPage: {
                    items: prev.schemas.faqPage.items.map((item, i) =>
                        i === idx ? { ...item, ...patch } : item
                    )
                }
            }
        }));

    const addFaqItem = () =>
        setSeo((prev) => ({
            ...prev,
            schemas: {
                ...prev.schemas,
                faqPage: {
                    items: [...prev.schemas.faqPage.items, { question: '', answer: '' }]
                }
            }
        }));

    const removeFaqItem = (idx) =>
        setSeo((prev) => ({
            ...prev,
            schemas: {
                ...prev.schemas,
                faqPage: {
                    items: prev.schemas.faqPage.items.filter((_, i) => i !== idx)
                }
            }
        }));

    const save = async () => {
        setSaving(true);
        try {
            const keywords = keywordsInput
                .split(',')
                .map((k) => k.trim())
                .filter(Boolean);
            const cssSelectors = speakableSelectorsInput
                .split('\n')
                .map((s) => s.trim())
                .filter(Boolean);
            const payload = {
                ...seo,
                keywords,
                schemas: {
                    ...seo.schemas,
                    speakable: { ...seo.schemas.speakable, cssSelectors }
                }
            };
            await updateSeo(pageKey, payload);
            setToast({ type: 'success', message: 'SEO saved' });
        } catch {
            setToast({ type: 'error', message: 'Save failed' });
        } finally {
            setSaving(false);
        }
    };

    const sa = seo.schemas.softwareApplication;
    const faq = seo.schemas.faqPage;
    const org = seo.schemas.organization;
    const speak = seo.schemas.speakable;

    const parsedKeywords = parseKeywords(keywordsInput);
    const parsedSelectors = parseSelectors(speakableSelectorsInput);

    const saStatus = validateSoftwareApplication(seo.schemasEnabled.softwareApplication, sa);
    const faqStatus = validateFaqPage(seo.schemasEnabled.faqPage, faq);
    const orgStatus = validateOrganization(seo.schemasEnabled.organization, org);
    const speakStatus = validateSpeakable(seo.schemasEnabled.speakable, speak, parsedSelectors);

    return (
        <>
            <AdminPageHeader
                title="SEO"
                subtitle={`Meta tags, Open Graph, and structured data schemas for each page on salescode.ai. Editing: ${pageMeta.label}`}
            >
                <button className="btn-primary" onClick={save} disabled={saving || loading}>
                    {saving ? 'Saving…' : 'Save Changes'}
                </button>
            </AdminPageHeader>

            {loading ? (
                <div className="admin-loading">Loading…</div>
            ) : (
                <form className="config-form" onSubmit={(e) => { e.preventDefault(); save(); }}>
                    <AdminSection title="Basic Meta" accent="indigo">
                        <div className="form-group">
                            <label>Meta title</label>
                            <input value={seo.metaTitle} onChange={(e) => update({ metaTitle: e.target.value })} placeholder="Page title for search engines" />
                            <SeoValidation result={validateMetaTitle(seo.metaTitle)} />
                        </div>
                        <div className="form-group">
                            <label>Meta description</label>
                            <textarea value={seo.metaDescription} onChange={(e) => update({ metaDescription: e.target.value })} placeholder="Summary shown in search results (150–160 chars)" />
                            <SeoValidation result={validateMetaDescription(seo.metaDescription)} />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Focus keyphrase</label>
                                <input value={seo.focusKeyphrase} onChange={(e) => update({ focusKeyphrase: e.target.value })} placeholder="Primary keyword for this page" />
                                <SeoValidation result={validateFocusKeyphrase(seo.focusKeyphrase)} />
                            </div>
                            <div className="form-group">
                                <label>Canonical URL</label>
                                <input value={seo.canonicalUrl} onChange={(e) => update({ canonicalUrl: e.target.value })} placeholder="https://salescode.ai/..." />
                                <SeoValidation result={validateCanonicalUrl(seo.canonicalUrl)} />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Keywords <span className="hint">comma-separated</span></label>
                            <input value={keywordsInput} onChange={(e) => setKeywordsInput(e.target.value)} placeholder="sales, ai, cpg, sfa" />
                            <SeoValidation result={validateKeywords(parsedKeywords)} />
                        </div>
                        <div className="form-group">
                            <label>Robots</label>
                            <input value={seo.robots} onChange={(e) => update({ robots: e.target.value })} placeholder="index, follow" />
                            <SeoValidation result={validateRobots(seo.robots)} />
                        </div>
                    </AdminSection>

                    <AdminSection title="Open Graph (Facebook, LinkedIn)" accent="purple" defaultOpen={false}>
                        <div className="form-group">
                            <label>OG title</label>
                            <input value={seo.ogTitle} onChange={(e) => update({ ogTitle: e.target.value })} placeholder="Shown when the page is shared" />
                            <SeoValidation result={validateOgTitle(seo.ogTitle)} />
                        </div>
                        <div className="form-group">
                            <label>OG description</label>
                            <textarea value={seo.ogDescription} onChange={(e) => update({ ogDescription: e.target.value })} placeholder="Description shown when shared" />
                            <SeoValidation result={validateOgDescription(seo.ogDescription)} />
                        </div>
                        <div className="form-group">
                            <label>OG image</label>
                            {seo.ogImage && <img src={seo.ogImage} alt="" className="admin-media-thumb" />}
                            <div className="admin-actions-bar">
                                <FileUploadButton
                                    label={seo.ogImage ? 'Replace' : 'Upload'}
                                    accept="image/*"
                                    onUploaded={(url) => update({ ogImage: url })}
                                    onError={(msg) => setToast({ type: 'error', message: msg })}
                                />
                                {seo.ogImage && (
                                    <button type="button" className="btn-remove" onClick={() => update({ ogImage: '' })}>
                                        Clear
                                    </button>
                                )}
                            </div>
                            <SeoValidation result={validateOgImage(seo.ogImage)} />
                        </div>
                    </AdminSection>

                    <AdminSection title="Twitter / X" accent="cyan" defaultOpen={false}>
                        <div className="form-group">
                            <label>Twitter title</label>
                            <input value={seo.twitterTitle} onChange={(e) => update({ twitterTitle: e.target.value })} />
                            <SeoValidation result={validateTwitterTitle(seo.twitterTitle)} />
                        </div>
                        <div className="form-group">
                            <label>Twitter description</label>
                            <textarea value={seo.twitterDescription} onChange={(e) => update({ twitterDescription: e.target.value })} />
                            <SeoValidation result={validateTwitterDescription(seo.twitterDescription)} />
                        </div>
                        <div className="form-group">
                            <label>Twitter image</label>
                            {seo.twitterImage && <img src={seo.twitterImage} alt="" className="admin-media-thumb" />}
                            <div className="admin-actions-bar">
                                <FileUploadButton
                                    label={seo.twitterImage ? 'Replace' : 'Upload'}
                                    accept="image/*"
                                    onUploaded={(url) => update({ twitterImage: url })}
                                    onError={(msg) => setToast({ type: 'error', message: msg })}
                                />
                                {seo.twitterImage && (
                                    <button type="button" className="btn-remove" onClick={() => update({ twitterImage: '' })}>
                                        Clear
                                    </button>
                                )}
                            </div>
                            <SeoValidation result={validateTwitterImage(seo.twitterImage)} />
                        </div>
                    </AdminSection>

                    <AdminSection
                        title="Software Application Schema"
                        accent="indigo"
                        defaultOpen={false}
                        description="JSON-LD structured data so Google can show this page as a software product with price and ratings."
                        actions={
                            <>
                                <SeoValidationPill result={saStatus} />
                                <EnableToggle
                                    checked={seo.schemasEnabled.softwareApplication}
                                    onChange={(v) => toggleSchema('softwareApplication', v)}
                                />
                            </>
                        }
                    >
                        <div className="form-row">
                            <div className="form-group">
                                <label>Name</label>
                                <input value={sa.name} onChange={(e) => updateSchema('softwareApplication', { name: e.target.value })} placeholder="Salescode AI" />
                            </div>
                            <div className="form-group">
                                <label>URL</label>
                                <input value={sa.url} onChange={(e) => updateSchema('softwareApplication', { url: e.target.value })} placeholder="https://salescode.ai" />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Description</label>
                            <textarea value={sa.description} onChange={(e) => updateSchema('softwareApplication', { description: e.target.value })} placeholder="Short description of the application" />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Price <span className="hint">optional</span></label>
                                <input value={sa.price} onChange={(e) => updateSchema('softwareApplication', { price: e.target.value })} placeholder="0" />
                            </div>
                            <div className="form-group">
                                <label>Currency <span className="hint">optional</span></label>
                                <input value={sa.priceCurrency} onChange={(e) => updateSchema('softwareApplication', { priceCurrency: e.target.value })} placeholder="USD" />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Price description <span className="hint">optional</span></label>
                            <input value={sa.priceDescription} onChange={(e) => updateSchema('softwareApplication', { priceDescription: e.target.value })} placeholder="Free trial available" />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Rating value <span className="hint">optional</span></label>
                                <input value={sa.ratingValue} onChange={(e) => updateSchema('softwareApplication', { ratingValue: e.target.value })} placeholder="4.8" />
                            </div>
                            <div className="form-group">
                                <label>Review count <span className="hint">optional</span></label>
                                <input value={sa.reviewCount} onChange={(e) => updateSchema('softwareApplication', { reviewCount: e.target.value })} placeholder="120" />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Publisher name</label>
                                <input value={sa.publisherName} onChange={(e) => updateSchema('softwareApplication', { publisherName: e.target.value })} placeholder="Salescode" />
                            </div>
                            <div className="form-group">
                                <label>Publisher URL</label>
                                <input value={sa.publisherUrl} onChange={(e) => updateSchema('softwareApplication', { publisherUrl: e.target.value })} placeholder="https://salescode.ai" />
                            </div>
                        </div>
                    </AdminSection>

                    <AdminSection
                        title="FAQ Page Schema"
                        accent="emerald"
                        defaultOpen={false}
                        description="Questions and answers that may appear as rich FAQ results in Google."
                        actions={
                            <>
                                <SeoValidationPill result={faqStatus} />
                                <EnableToggle
                                    checked={seo.schemasEnabled.faqPage}
                                    onChange={(v) => toggleSchema('faqPage', v)}
                                />
                            </>
                        }
                    >
                        <div className="admin-list">
                            {faq.items.length === 0 && (
                                <div className="admin-empty">No FAQ items yet. Click “Add question” to start.</div>
                            )}
                            {faq.items.map((item, idx) => (
                                <div className="admin-item-card" key={idx}>
                                    <div className="form-group">
                                        <label>Question {idx + 1}</label>
                                        <input
                                            value={item.question}
                                            onChange={(e) => updateFaqItem(idx, { question: e.target.value })}
                                            placeholder="What is Salescode AI?"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Answer</label>
                                        <textarea
                                            value={item.answer}
                                            onChange={(e) => updateFaqItem(idx, { answer: e.target.value })}
                                            placeholder="Salescode AI is…"
                                        />
                                    </div>
                                    <div className="admin-actions-bar">
                                        <button type="button" className="btn-secondary" onClick={() => removeFaqItem(idx)}>
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="admin-actions-bar" style={{ marginTop: 12 }}>
                            <button type="button" className="btn-secondary" onClick={addFaqItem}>
                                + Add question
                            </button>
                        </div>
                    </AdminSection>

                    <AdminSection
                        title="Organization Schema"
                        accent="purple"
                        defaultOpen={false}
                        description="Company-level info used by Google's Knowledge Graph (name, logo, social profiles)."
                        actions={
                            <>
                                <SeoValidationPill result={orgStatus} />
                                <EnableToggle
                                    checked={seo.schemasEnabled.organization}
                                    onChange={(v) => toggleSchema('organization', v)}
                                />
                            </>
                        }
                    >
                        <div className="form-row">
                            <div className="form-group">
                                <label>Name</label>
                                <input value={org.name} onChange={(e) => updateSchema('organization', { name: e.target.value })} placeholder="Salescode" />
                            </div>
                            <div className="form-group">
                                <label>URL</label>
                                <input value={org.url} onChange={(e) => updateSchema('organization', { url: e.target.value })} placeholder="https://salescode.ai" />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Logo</label>
                            {org.logo && <img src={org.logo} alt="" className="admin-media-thumb" />}
                            <div className="admin-actions-bar">
                                <FileUploadButton
                                    label={org.logo ? 'Replace' : 'Upload'}
                                    accept="image/*"
                                    onUploaded={(url) => updateSchema('organization', { logo: url })}
                                    onError={(msg) => setToast({ type: 'error', message: msg })}
                                />
                                {org.logo && (
                                    <button type="button" className="btn-remove" onClick={() => updateSchema('organization', { logo: '' })}>
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Description</label>
                            <textarea value={org.description} onChange={(e) => updateSchema('organization', { description: e.target.value })} placeholder="What the organization does" />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>LinkedIn <span className="hint">optional</span></label>
                                <input value={org.linkedIn} onChange={(e) => updateSchema('organization', { linkedIn: e.target.value })} placeholder="https://linkedin.com/company/…" />
                            </div>
                            <div className="form-group">
                                <label>Twitter / X <span className="hint">optional</span></label>
                                <input value={org.twitter} onChange={(e) => updateSchema('organization', { twitter: e.target.value })} placeholder="https://x.com/…" />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>YouTube <span className="hint">optional</span></label>
                                <input value={org.youtube} onChange={(e) => updateSchema('organization', { youtube: e.target.value })} placeholder="https://youtube.com/@…" />
                            </div>
                            <div className="form-group">
                                <label>Founder name <span className="hint">optional</span></label>
                                <input value={org.founderName} onChange={(e) => updateSchema('organization', { founderName: e.target.value })} placeholder="Jane Doe" />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Number of employees <span className="hint">optional</span></label>
                            <input value={org.numberOfEmployees} onChange={(e) => updateSchema('organization', { numberOfEmployees: e.target.value })} placeholder="50" />
                        </div>
                    </AdminSection>

                    <AdminSection
                        title="Speakable Schema"
                        accent="cyan"
                        defaultOpen={false}
                        description="Tells voice assistants which parts of the page are safe to read aloud."
                        actions={
                            <>
                                <SeoValidationPill result={speakStatus} />
                                <EnableToggle
                                    checked={seo.schemasEnabled.speakable}
                                    onChange={(v) => toggleSchema('speakable', v)}
                                />
                            </>
                        }
                    >
                        <div className="form-group">
                            <label>URL</label>
                            <input value={speak.url} onChange={(e) => updateSchema('speakable', { url: e.target.value })} placeholder="https://salescode.ai/some-page" />
                        </div>
                        <div className="form-group">
                            <label>CSS selectors <span className="hint">one per line</span></label>
                            <textarea
                                value={speakableSelectorsInput}
                                onChange={(e) => setSpeakableSelectorsInput(e.target.value)}
                                placeholder={'.article-headline\n.article-body p'}
                                rows={4}
                            />
                        </div>
                    </AdminSection>

                </form>
            )}

            <Toast
                message={toast?.message}
                type={toast?.type}
                onClose={() => setToast(null)}
            />
        </>
    );
}
