"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type Kind = "post" | "video" | "download";
type Item = { id:string; type:Kind; title:string; description:string; fileName:string|null; size:string; publishedAt:string };

const labels = { post: "发布帖子", video: "上传视频", download: "上传文件" } as const;

export function AdminPanel() {
  const [kind, setKind] = useState<Kind>("post");
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  async function refresh() {
    const response = await fetch("/api/content");
    if (response.ok) setItems((await response.json()).items || []);
  }

  useEffect(() => { refresh().catch(() => undefined); }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(kind === "video" ? "正在上传视频，请不要关闭页面……" : "正在保存……");
    try {
      const form = new FormData(event.currentTarget);
      form.set("type", kind);
      const response = await fetch("/api/content", { method: "POST", body: form });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "保存失败");
      formRef.current?.reset();
      setMessage("已经发布成功。打开网站对应页面就能看到。");
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败，请重试");
    } finally { setBusy(false); }
  }

  async function remove(id: string, title: string) {
    if (!window.confirm(`确定删除“${title}”吗？删除后无法恢复。`)) return;
    const response = await fetch(`/api/content?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (response.ok) { setMessage("已经删除。"); await refresh(); }
    else setMessage("删除失败，请稍后重试。");
  }

  return (
    <div className="admin-wrap">
      <section className="admin-intro">
        <span className="admin-badge">本地内容管理</span>
        <h1>这里就是你的<br />发布后台。</h1>
        <p>不用写代码。选择想发布的内容，填写文字或选择文件，最后点击发布。</p>
        <div className="admin-steps"><span><b>1</b> 选择类型</span><span><b>2</b> 填写或选择文件</span><span><b>3</b> 点击发布</span></div>
      </section>

      <section className="admin-card">
        <div className="admin-tabs" role="tablist">
          {(Object.keys(labels) as Kind[]).map((value) => <button type="button" key={value} className={kind === value ? "selected" : ""} onClick={() => { setKind(value); setMessage(""); }}>{labels[value]}</button>)}
        </div>
        <form ref={formRef} onSubmit={submit} className="admin-form">
          <label><span>{kind === "download" ? "显示名称" : "标题"} <em>必填</em></span><input name="title" required placeholder={kind === "post" ? "例如：今天完成了我的个人网站" : kind === "video" ? "例如：我的第一支短片" : "例如：项目资料包"} /></label>
          <label><span>简单介绍</span><textarea name="description" rows={3} placeholder="用一两句话介绍这项内容，也可以暂时不填。" /></label>

          {kind === "post" && <>
            <label><span>正文 <em>必填</em></span><textarea name="body" rows={12} required placeholder={"直接在这里写文章。\n\n另起一段时，空一行即可。\n小标题可以写成：## 小标题"} /></label>
            <label className="file-field"><span>封面图片</span><input name="cover" type="file" accept="image/*" /><small>支持 JPG、PNG、WebP。没有封面也可以发布。</small></label>
            <label className="file-field"><span>正文图片（可多选）</span><input name="gallery" type="file" accept="image/*" multiple /><small>按住 Ctrl 可以选择多张，最多保存 12 张。</small></label>
          </>}

          {kind === "video" && <>
            <label className="file-field"><span>选择视频 <em>必填</em></span><input name="file" type="file" accept="video/*" required /><small>推荐 MP4 格式，单个视频不超过 250 MB。</small></label>
            <label className="file-field"><span>视频封面</span><input name="cover" type="file" accept="image/*" /><small>没有封面时会使用网站自带图片。</small></label>
          </>}

          {kind === "download" && <label className="file-field"><span>选择文件 <em>必填</em></span><input name="file" type="file" required /><small>可以上传 PDF、ZIP、图片、文档等，单个文件不超过 250 MB。</small></label>}

          <button className="publish-button" type="submit" disabled={busy}>{busy ? "正在处理，请稍等……" : labels[kind]}</button>
          {message && <p className={`admin-message ${message.includes("失败") || message.includes("请") && !message.includes("不要") ? "error" : ""}`} role="status">{message}</p>}
        </form>
      </section>

      <section className="admin-library">
        <div><p className="eyebrow">已经发布</p><h2>你的内容</h2></div>
        {items.length === 0 ? <p className="admin-empty">这里还没有你发布的内容。上面发布成功后，会出现在这里。</p> : <div className="admin-items">{items.map((item) => <article key={item.id}><div><span className="content-kind">{item.type === "post" ? "帖子" : item.type === "video" ? "视频" : "文件"}</span><h3>{item.title}</h3><p>{item.publishedAt}{item.fileName ? ` · ${item.fileName} · ${item.size}` : ""}</p></div><button onClick={() => remove(item.id, item.title)}>删除</button></article>)}</div>}
      </section>
    </div>
  );
}
