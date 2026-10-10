"use client";
import React, { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { Brief, Scene, Storyboard } from "../core/schema.ts";
import type { Job, Project } from "../server/store.ts";
const PlayerPanel = dynamic(() => import("./PlayerPanel.tsx"), { ssr: false, loading: () => <div className="player-loading">جارٍ تجهيز المعاينة…</div> });

async function api<T>(url: string, method = "GET", body?: unknown): Promise<T> {
  const response = await fetch(`/api/${url}`, { method, ...(body ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "تعذّر إكمال الطلب");
  return data;
}
function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    play: <path d="m9 5 11 7-11 7Z" />,
    arrow: <path d="M19 12H5m6-6-6 6 6 6" />,
    save: <><path d="M5 3h12l4 4v14H3V3Z" /><path d="M7 3v6h10V3M7 21v-8h10v8" /></>,
    film: <><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M7 3v18M17 3v18M3 8h4m-4 8h4M17 8h4m-4 8h4" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    upload: <><path d="M12 16V3m-5 5 5-5 5 5M4 15v6h16v-6" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] ?? paths.grid}</svg>;
}
const kinds: Record<Scene["kind"], string> = { hook: "الافتتاحية", problem: "المشكلة", reveal: "ظهور المنتج", benefit: "ميزة المنتج", offer: "العرض", cta: "الدعوة للإجراء" };
const statuses: Record<Job["status"], string> = { queued: "في الانتظار", running: "جارٍ الإنتاج", succeeded: "اكتمل التصدير", failed: "تعذّر التصدير" };
function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return <label className="field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [project, setProject] = useState<Project>();
  const [brief, setBrief] = useState<Brief>();
  const [sb, setSb] = useState<Storyboard>();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [step, setStep] = useState(0);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [briefDirty, setBriefDirty] = useState(false);
  const [sceneDirty, setSceneDirty] = useState(false);
  const [uploaded, setUploaded] = useState<string[]>([]);
  const select = useCallback((p: Project) => { setProject(p); setBrief(structuredClone(p.brief)); setSb(structuredClone(p.storyboard)); setBriefDirty(false); setSceneDirty(false); setSceneIndex(0); setUploaded([]); setJobs([]); }, []);
  useEffect(() => {
    api<Project[]>("projects").then(list => { setProjects(list); if (list[0]) select(list[0]); }).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [select]);
  useEffect(() => {
    if (!project) return;
    let live = true;
    const refresh = () => api<Job[]>(`projects/${project.id}/jobs`).then(list => { if (live) setJobs(list); }).catch(e => { if (live) setError(e.message); });
    void refresh(); const timer = setInterval(refresh, 2500);
    return () => { live = false; clearInterval(timer); };
  }, [project]);
  const act = async (action: () => Promise<void>) => {
    setBusy(true); setError(""); setNotice("");
    try { await action(); } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };
  const accept = (p: Project) => { select(p); setProjects(list => [p, ...list.filter(item => item.id !== p.id)]); };
  const create = () => act(async () => { accept(await api<Project>("projects", "POST", {})); setStep(0); setNotice("أُنشئ مشروع ببيانات تجريبية. عدّل البيانات وأضف صور منتجك."); });
  const switchProject = (p: Project) => {
    if ((briefDirty || sceneDirty) && !window.confirm("لديك تعديلات غير محفوظة. هل تريد الانتقال دون حفظها؟")) return;
    void act(async () => { select(await api<Project>(`projects/${p.id}`)); setStep(0); });
  };
  const changeBrief = (value: Brief) => { setBrief(value); setBriefDirty(true); };
  const changeSb = (value: Storyboard) => { setSb({ ...value, approved: false, durationInFrames: value.scenes.reduce((sum, s) => sum + s.durationInFrames, 0) }); setSceneDirty(true); };
  const saveBrief = () => act(async () => {
    const p = await api<Project>(`projects/${project!.id}`, "PATCH", { revision: project!.revision, brief }); accept(p); setStep(1); setNotice("حُفظت البيانات وأُعيد تخطيط المشاهد. راجعها قبل الاعتماد.");
  });
  const saveScenes = () => act(async () => { accept(await api<Project>(`projects/${project!.id}`, "PATCH", { revision: project!.revision, storyboard: sb })); setNotice("حُفظت المشاهد. يمكنك الآن اعتماد هذه النسخة."); });
  const approve = () => act(async () => { accept(await api<Project>(`projects/${project!.id}/approve`, "POST", { revision: project!.revision })); setStep(2); setNotice("اعتمدت هذه النسخة من المشاهد."); });
  const render = () => act(async () => { await api<Job>(`projects/${project!.id}/jobs`, "POST", { revision: project!.revision }); setJobs(await api<Job[]>(`projects/${project!.id}/jobs`)); setNotice("أُضيف الإعلان إلى طابور الإنتاج."); });
  const upload = (file: File | undefined, logo: boolean) => {
    if (!file || !brief || !project) return;
    void act(async () => {
      if (file.size > 15 * 1024 * 1024) throw new Error("الحد الأقصى للصورة 15 ميغابايت");
      const data = new FormData(); data.append("file", file);
      const response = await fetch(`/api/projects/${project.id}/assets`, { method: "POST", body: data });
      const result = await response.json(); if (!response.ok) throw new Error(result.error);
      setUploaded(paths => [...paths, result.path]);
      changeBrief(logo ? { ...brief, brand: { ...brief.brand, logo: result.path } } : { ...brief, product: { ...brief.product, images: [...brief.product.images, result.path].slice(-6) } });
      setNotice("أُضيفت الصورة. احفظ بيانات الإعلان لتستخدمها في المشاهد.");
    });
  };
  const scene = sb?.scenes[sceneIndex];
  const patchScene = (patch: Partial<Scene>) => { if (sb) changeSb({ ...sb, scenes: sb.scenes.map((s, i) => i === sceneIndex ? { ...s, ...patch } : s) }); };
  const reorder = (delta: number) => {
    if (!sb || sceneIndex + delta < 1 || sceneIndex + delta >= sb.scenes.length - 1) return;
    const scenes = [...sb.scenes]; const to = sceneIndex + delta;
    [scenes[sceneIndex], scenes[to]] = [scenes[to]!, scenes[sceneIndex]!]; changeSb({ ...sb, scenes }); setSceneIndex(to);
  };
  const dirty = briefDirty || sceneDirty;
  const activeJob = jobs.find(j => j.status === "queued" || j.status === "running");
  const productImages = [...new Set([...(brief?.product.images ?? []), ...(project?.brief.product.images ?? []), ...uploaded])];

  return <div className="app-shell">
    <aside className="sidebar">
      <a href="/" className="wordmark"><span className="brand-symbol"><Icon name="film" size={25} /></span><span>مصنع الإعلانات<small dir="ltr">AD FACTORY / STUDIO</small></span></a>
      <div className="sidebar-label">مساحة العمل</div>
      <div className="nav-active"><Icon name="grid" /> المشاريع <span>{projects.length.toLocaleString("ar")}</span></div>
      <button className="new-project" disabled={busy} onClick={create}><Icon name="plus" /> مشروع جديد</button>
      <div className="sidebar-label">مشاريعك</div>
      <div className="project-list">{projects.map(p => <button key={p.id} onClick={() => switchProject(p)} className={project?.id === p.id ? "selected" : ""}><span className="project-dot" style={{ background: p.brief.brand.colors.primary }} /><span>{p.brief.client.brand}<small>{p.brief.product.name}</small></span></button>)}</div>
      <div className="sidebar-bottom"><span className="online-dot" /> إنتاج محلي<small>فكرتك. هويتك. إعلانك.</small></div>
    </aside>
    <main className="workspace">
      <header className="topbar"><div className="breadcrumb">مساحة العمل <span>/</span> المشاريع <span>/</span> <b>{project?.brief.client.brand ?? "البداية"}</b></div><span className="workspace-badge">استوديو الإنتاج <span className="online-dot" /></span></header>
      <div className="page-body">
        {error && <div role="alert" className="alert error">{error}<button aria-label="إغلاق الخطأ" onClick={() => setError("")}>×</button></div>}
        {notice && <div role="status" className="alert success">{notice}</div>}
        {loading ? <div className="empty"><span className="spinner" /> جارٍ تحميل المشاريع…</div> : !project || !brief || !sb ? <div className="empty welcome"><span className="eyebrow">من الفكرة إلى الشاشة</span><h1>إعلانك القادم يبدأ هنا.</h1><p>أضف بيانات المنتج، راجع المشاهد، ثم صدّر فيديو بهويتك.</p><button className="primary" disabled={busy} onClick={create}><Icon name="plus" /> أنشئ أول مشروع</button><small>ستبدأ بنموذج تجريبي قابل للتعديل.</small></div> : <>
          <div className="page-heading"><div><span className="eyebrow">مشروع الإعلان / {project.revision.toLocaleString("ar")}</span><h1>{brief.product.name}</h1><p>من بيانات المنتج إلى إعلان يستحق المشاهدة.</p></div><div className="heading-meta"><span className={`pill ${dirty ? "amber" : sb.approved ? "green" : ""}`}>{dirty ? "تعديلات غير محفوظة" : sb.approved ? "المشاهد معتمدة" : "مسودة للمراجعة"}</span><span className="format-tag" dir="ltr">9:16 · 1080p</span></div></div>
          <div className="steps">{["بيانات الإعلان", "المشاهد والإبداع", "التصدير والتسليم"].map((label, i) => <button key={label} onClick={() => setStep(i)} className={step === i ? "active" : ""}><span>{i + 1}</span><b>{label}</b>{i < 2 && <Icon name="arrow" size={16} />}</button>)}</div>
          <div className="studio-grid">
            <section className="editor-area">
              {step === 0 && <>
                <div className="panel"><div className="panel-heading"><div><h2>لنبدأ بالمنتج</h2><p>أدخل الحقائق التي تريد أن يعرفها جمهورك.</p></div><span className="section-number">01</span></div>
                  <div className="demo-note">هذا المشروع يبدأ ببيانات وصور نَفَس التجريبية. استبدلها ببيانات منتجك.</div>
                  <div className="form-grid">
                    <Field label="اسم العميل"><input value={brief.client.name} onChange={e => changeBrief({ ...brief, client: { ...brief.client, name: e.target.value } })} /></Field>
                    <Field label="اسم العلامة"><input value={brief.client.brand} onChange={e => changeBrief({ ...brief, client: { ...brief.client, brand: e.target.value } })} /></Field>
                    <Field label="اسم المنتج"><input maxLength={40} value={brief.product.name} onChange={e => changeBrief({ ...brief, product: { ...brief.product, name: e.target.value } })} /></Field>
                    <Field label="فئة المنتج"><input value={brief.product.category} onChange={e => changeBrief({ ...brief, product: { ...brief.product, category: e.target.value } })} /></Field>
                    <div className="span-two"><Field label="مميزات المنتج" hint="ميزة واحدة في كل سطر، حتى 5 مميزات. استخدم حقائق مؤكدة فقط."><textarea rows={3} value={brief.product.features.join("\n")} onChange={e => changeBrief({ ...brief, product: { ...brief.product, features: e.target.value.split("\n") } })} /></Field></div>
                    <Field label="السعر (اختياري)"><input type="number" min="0" step="0.01" value={brief.product.price ?? ""} onChange={e => changeBrief({ ...brief, product: { ...brief.product, price: e.target.value ? Number(e.target.value) : undefined } })} /></Field>
                    <Field label="العملة"><input value={brief.product.currency ?? ""} onChange={e => changeBrief({ ...brief, product: { ...brief.product, currency: e.target.value || undefined } })} /></Field>
                    <Field label="السعر السابق (اختياري)"><input type="number" min="0" step="0.01" value={brief.product.oldPrice ?? ""} onChange={e => changeBrief({ ...brief, product: { ...brief.product, oldPrice: e.target.value ? Number(e.target.value) : undefined } })} /></Field>
                    <Field label="العرض (اختياري)"><input maxLength={40} value={brief.product.offer ?? ""} onChange={e => changeBrief({ ...brief, product: { ...brief.product, offer: e.target.value || undefined } })} /></Field>
                    <div className="span-two"><Field label="المشكلة التي يعالجها المنتج (اختياري)"><input maxLength={70} value={brief.product.problem ?? ""} onChange={e => changeBrief({ ...brief, product: { ...brief.product, problem: e.target.value || undefined } })} /></Field></div>
                  </div>
                </div>
                <div className="panel"><div className="panel-heading"><div><h2>صور المنتج</h2><p>حتى 6 صور · PNG، JPG، WebP أو SVG · 15 ميغابايت للصورة</p></div><Icon name="upload" /></div>
                  <div className="asset-grid">{productImages.map((image, i) => <label key={image} className={`asset-card ${brief.product.images.includes(image) ? "chosen" : ""}`}><img alt={`صورة المنتج ${i + 1}`} src={`/api/projects/${project.id}/${image}`} /><span><input type="checkbox" checked={brief.product.images.includes(image)} onChange={e => changeBrief({ ...brief, product: { ...brief.product, images: e.target.checked ? [...brief.product.images, image].slice(-6) : brief.product.images.filter(a => a !== image) } })} /> {image.endsWith("can.svg") || image.endsWith("glass.svg") ? "صورة تجريبية" : `صورة ${i + 1}`}</span></label>)}<label className="upload-card"><Icon name="plus" size={28} /><span>أضف صورة</span><input aria-label="رفع صورة المنتج" type="file" accept=".png,.jpg,.jpeg,.webp,.svg" disabled={busy} onChange={e => { upload(e.target.files?.[0], false); e.target.value = ""; }} /></label></div>
                </div>
                <div className="panel"><div className="panel-heading"><div><h2>الهوية والاتجاه</h2><p>اضبط شكل الإعلان ولغته وهدفه.</p></div><span className="section-number">02</span></div>
                  <div className="form-grid">
                    <div className="span-two"><Field label="الجمهور المستهدف"><input value={brief.audience} onChange={e => changeBrief({ ...brief, audience: e.target.value })} /></Field></div>
                    <Field label="هدف الإعلان"><select value={brief.goal} onChange={e => changeBrief({ ...brief, goal: e.target.value as Brief["goal"] })}>{Object.entries({ sell: "زيادة المبيعات", awareness: "التعريف بالعلامة", launch: "إطلاق منتج", engagement: "زيادة التفاعل" }).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
                    <Field label="نبرة الإعلان"><select value={brief.tone} onChange={e => changeBrief({ ...brief, tone: e.target.value as Brief["tone"] })}>{Object.entries({ fast: "سريعة", cinematic: "سينمائية", funny: "مرحة", luxury: "فاخرة", informative: "توضيحية" }).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
                    <Field label="اللغة"><select value={brief.language} onChange={e => changeBrief({ ...brief, language: e.target.value as Brief["language"] })}><option value="ar">العربية</option><option value="en">الإنجليزية</option></select></Field>
                    <Field label="المدة بالثواني"><input type="number" min="10" max="30" step="0.5" value={brief.durationSec} onChange={e => changeBrief({ ...brief, durationSec: Number(e.target.value) })} /></Field>
                    <Field label="الدعوة للإجراء"><input maxLength={30} value={brief.cta} onChange={e => changeBrief({ ...brief, cta: e.target.value })} /></Field>
                    <Field label="حساب العلامة"><input dir="ltr" value={brief.client.handle ?? ""} onChange={e => changeBrief({ ...brief, client: { ...brief.client, handle: e.target.value || undefined } })} /></Field>
                    <div className="span-two"><Field label="الوسوم" hint="افصل الوسوم بمسافات، حتى 8 وسوم."><input value={brief.hashtags.join(" ")} onChange={e => changeBrief({ ...brief, hashtags: e.target.value.split(" ") })} onBlur={() => changeBrief({ ...brief, hashtags: brief.hashtags.filter(Boolean) })} /></Field></div>
                  </div>
                  <div className="color-row">{Object.entries(brief.brand.colors).map(([key, value]) => <Field key={key} label={({ primary: "الأساسي", secondary: "الثانوي", accent: "التفاصيل", background: "الخلفية", text: "النص" } as Record<string, string>)[key]!}><input aria-label={`لون ${key}`} type="color" value={value} onChange={e => changeBrief({ ...brief, brand: { ...brief.brand, colors: { ...brief.brand.colors, [key]: e.target.value } } })} /></Field>)}</div>
                  <div className="logo-row">{brief.brand.logo && <img alt="شعار العلامة" src={`/api/projects/${project.id}/${brief.brand.logo}`} />}<label className="secondary upload-button"><Icon name="upload" /> رفع شعار<input aria-label="رفع شعار العلامة" type="file" accept=".png,.jpg,.jpeg,.webp,.svg" disabled={busy} onChange={e => { upload(e.target.files?.[0], true); e.target.value = ""; }} /></label>{brief.brand.logo && <button className="text-button" onClick={() => changeBrief({ ...brief, brand: { ...brief.brand, logo: undefined } })}>إزالة الشعار</button>}</div>
                  <p className="muted">القالب الحالي: Bold Commercial. تنويع القوالب والنبرة البصرية يأتي في المرحلة الرابعة.</p>
                </div>
                <div className="action-bar"><small>حفظ البيانات يعيد تخطيط المشاهد ويلغي اعتماد النسخة السابقة.</small><button className="primary" disabled={busy} onClick={saveBrief}>حفظ وبناء المشاهد <Icon name="arrow" /></button></div>
              </>}
              {step === 1 && <>
                {briefDirty && <div className="alert warning">احفظ بيانات الإعلان أولًا لتحديث المشاهد.</div>}
                <div className="panel"><div className="panel-heading"><div><h2>البداية تصنع الفرق</h2><p>اختر افتتاحية الإعلان من ثلاث زوايا.</p></div><span className="section-number">01</span></div>
                  <div className="hook-options">{sb.hooks.map((hook, i) => <button key={i} className={sb.selectedHook === i ? "chosen" : ""} onClick={() => { const scenes = sb.scenes.map(s => s.kind === "hook" ? { ...s, headline: hook, emphasis: [] } : s); changeSb({ ...sb, selectedHook: i, scenes }); setSceneIndex(0); }}><span>زاوية {i + 1} {sb.selectedHook === i && <Icon name="check" size={16} />}</span><b>{hook}</b></button>)}</div>
                </div>
                <div className="panel"><div className="panel-heading"><div><h2>مشهدًا بعد مشهد</h2><p>عدّل النص والصورة والإيقاع. المعاينة تتحدث مباشرة.</p></div><span className="pill">{sb.scenes.length.toLocaleString("ar")} مشاهد</span></div>
                  <div className="scene-strip">{sb.scenes.map((s, i) => <button key={s.id} className={i === sceneIndex ? "selected" : ""} onClick={() => setSceneIndex(i)}><span>{String(i + 1).padStart(2, "0")}</span><b>{kinds[s.kind]}</b><small>{(s.durationInFrames / 30).toLocaleString("ar")} ث</small></button>)}</div>
                  {scene && <div className="scene-form"><div className="scene-title"><h3>{kinds[scene.kind]}</h3><div>{sceneIndex > 0 && sceneIndex < sb.scenes.length - 1 && <><button className="secondary small" aria-label="تقديم المشهد" disabled={sceneIndex === 1} onClick={() => reorder(-1)}>↑ تقديم</button><button className="secondary small" aria-label="تأخير المشهد" disabled={sceneIndex === sb.scenes.length - 2} onClick={() => reorder(1)}>↓ تأخير</button></>}</div></div>
                    <Field label="النص الرئيسي"><input maxLength={120} value={scene.headline} onChange={e => patchScene({ headline: e.target.value, emphasis: [] })} /></Field>
                    <Field label="النص الثانوي"><input maxLength={120} value={scene.sub ?? ""} onChange={e => patchScene({ sub: e.target.value || undefined })} /></Field>
                    <div className="form-grid"><Field label="المدة بالإيقاعات" hint="كل إيقاع = نصف ثانية. المدة الكلية من 10 إلى 30 ثانية."><input type="number" min="2" max="40" value={scene.durationInFrames / 15} onChange={e => { const n = Number(e.target.value); if (n >= 2 && n <= 40) patchScene({ durationInFrames: Math.round(n) * 15 }); }} /></Field><Field label="صورة المشهد"><select value={scene.image ?? ""} onChange={e => patchScene({ image: e.target.value || undefined })}><option value="">بدون صورة</option>{project.brief.product.images.map((image, i) => <option key={image} value={image}>صورة المنتج {i + 1}</option>)}</select></Field></div>
                    <div className="field"><span>تمييز الكلمات</span><span className="word-options">{scene.headline.split(/[ \t\n]+/).filter(Boolean).map((word, i) => <button type="button" key={i} aria-pressed={scene.emphasis.includes(i)} className={scene.emphasis.includes(i) ? "chosen" : ""} onClick={() => patchScene({ emphasis: scene.emphasis.includes(i) ? scene.emphasis.filter(n => n !== i) : [...scene.emphasis, i] })}>{word}</button>)}</span><small>اضغط الكلمات التي تريد إبرازها في العنوان.</small></div>
                    <div className="source-note">النص الذي تُدخله يُحفظ ضمن بيانات الإعلان كمحتوى قدّمته أنت. تأكد من صحة أي ادعاء قبل الاعتماد.</div>
                  </div>}
                </div>
                <div className="action-bar"><button className="secondary" disabled={busy || briefDirty} onClick={saveScenes}><Icon name="save" /> حفظ المشاهد</button><button className="primary" disabled={busy || dirty || sb.approved} onClick={approve}>اعتماد المشاهد <Icon name="check" /></button></div>
              </>}
              {step === 2 && <>
                <div className="panel"><div className="panel-heading"><div><h2>جاهز للخطوة الأخيرة؟</h2><p>صدّر الفيديو، ثم راجع نتيجة فحص الجودة.</p></div><Icon name="film" size={27} /></div>
                  <div className="export-summary"><div><span>الصورة</span><b dir="ltr">1080 × 1920</b><small>H.264 · 30 fps</small></div><div><span>المدة</span><b>{(sb.durationInFrames / 30).toLocaleString("ar")} ثانية</b><small>{sb.scenes.length.toLocaleString("ar")} مشاهد</small></div><div><span>الصوت</span><b>موسيقى ومؤثرات</b><small>بدون تعليق صوتي</small></div></div>
                  <div className="approval-line"><span className={`pill ${sb.approved && !dirty ? "green" : "amber"}`}>{sb.approved && !dirty ? "تم اعتماد هذه النسخة" : "يلزم حفظ المشاهد واعتمادها"}</span><p>الاعتماد يؤكد مراجعتك للنصوص والصور والحقائق.</p></div>
                  <button className="primary render-button" disabled={busy || dirty || !sb.approved || !!activeJob} onClick={render}><Icon name="play" /> {activeJob ? statuses[activeJob.status] : "إنتاج الإعلان"}</button>
                  <p className="muted">يشمل التسليم الفيديو، وصورة الغلاف، ونص المنشور، وتقرير الجودة. نجاح الفحص التقني يحتاج أيضًا مراجعتك البصرية.</p>
                </div>
                <div className="panel"><div className="panel-heading"><div><h2>سجل الإنتاج</h2><p>كل تصدير يحتفظ بنسخة البيانات المستخدمة.</p></div><Icon name="clock" /></div>
                  {!jobs.length ? <div className="jobs-empty">لم تبدأ أي مهمة بعد. إعلانك الأول على بُعد خطوة.</div> : jobs.map(job => <article className="job" key={job.id}><div className="job-heading"><div><b>نسخة {job.revision.toLocaleString("ar")}</b><small>{new Date(job.createdAt).toLocaleString("ar", { dateStyle: "short", timeStyle: "short" })}</small></div><span className={`pill ${job.status === "succeeded" ? "green" : job.status === "failed" ? "red" : "amber"}`}>{statuses[job.status]}</span></div>
                    {job.status === "succeeded" && <div className="delivery-links">{Object.entries({ video: "تحميل الفيديو", cover: "الغلاف", caption: "نص المنشور", report: "تقرير الجودة" }).map(([key, label]) => <a key={key} href={`/api/jobs/${job.id}/delivery/${key}`} download>{label} <Icon name="arrow" size={14} /></a>)}</div>}
                    {job.status === "failed" && <p className="failure-note">لم يكتمل التصدير. راجع السجل أدناه، ثم أعد الإنتاج.</p>}
                    <details open={job.status === "running" || job.status === "failed"}><summary>سجل المهمة</summary><pre dir="ltr">{job.log || "المهمة في الطابور؛ ستبدأ تلقائيًا عند تفرّغ العامل."}</pre></details>
                  </article>)}
                </div>
              </>}
            </section>
            <aside className="preview-panel"><div className="preview-heading"><h2>معاينة الإعلان</h2><span className="live-label"><span /> مباشرة</span></div><div className="preview-frame"><PlayerPanel storyboard={sb} projectId={project.id} sceneIndex={sceneIndex} /></div><div className="preview-metadata"><span dir="ltr">9:16</span><span>{(sb.durationInFrames / 30).toLocaleString("ar")} ثانية</span><span>30 إطار / ث</span></div><p>معاينة الحركة؛ الموسيقى والمؤثرات تُضاف عند التصدير.</p>{briefDirty && <div className="preview-note">احفظ بيانات الإعلان لتحديث المعاينة.</div>}<div className="preview-footer"><span>القالب</span><b dir="ltr">Bold Commercial</b></div></aside>
          </div>
        </>}
        <footer className="page-footer"><span>مصنع الإعلانات</span><span>صُمّم للفكرة. بُني للإنتاج.</span></footer>
      </div>
    </main>
  </div>;
}
