"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type Kind = "post" | "video" | "download";
type Item = { id:string; type:Kind; title:string; description:string; fileName:string|null; size:string; publishedAt:string };
type TextBlock = { id:string; type:"text"; text:string };
type ImageBlock = { id:string; type:"image"; file:File|null; alt:string };
type PostBlock = TextBlock | ImageBlock;

const labels = { post: "发布帖子", video: "上传视频", download: "上传文件" } as const;

function newTextBlock(): TextBlock {
  return { id:crypto.randomUUID(), type:"text", text:"" };
}

function newImageBlock(): ImageBlock {
  return { id:crypto.randomUUID(), type:"image", file:null, alt:"" };
}

export function AdminPanel({ onLogout }: { onLogout?:() => void }) {
  const [kind, setKind] = useState<Kind>("post");
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [postBlocks, setPostBlocks] = useState<PostBlock[]>(() => [newTextBlock()]);
  const formRef = useRef<HTMLFormElement>(null);

  async function refresh() {
    const response = await fetch("/api/content?admin=1");
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
      if (kind === "post") {
        const blocks = postBlocks.filter((block) => block.type === "text" ? block.text.trim() : block.file);
        if (!blocks.length) throw new Error("请至少添加一段文字或一张图片");
        form.set("body", blocks.filter((block): block is TextBlock => block.type === "text").map((block) => block.text.trim()).join("\n\n"));
        form.set("contentBlocks", JSON.stringify(blocks.map((block) => block.type === "text"
          ? { type:"text", text:block.text.trim() }
          : { type:"image", field:`block-image-${block.id}`, alt:block.alt.trim() })));
        for (const block of blocks) {
          if (block.type === "image" && block.file) form.set(`block-image-${block.id}`, block.file);
        }
      }
      const response = await fetch("/api/content", { method: "POST", body: form });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "保存失败");
      formRef.current?.reset();
      setPostBlocks([newTextBlock()]);
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

  function updateBlock(id: string, update: Partial<{ text:string; file:File|null; alt:string }>) {
    setPostBlocks((current) => current.map((block) => block.id === id ? { ...block, ...update } as PostBlock : block));
  }

  function moveBlock(index: number, direction: -1 | 1) {
    setPostBlocks((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  }

  return (
    <div className="admin-wrap">
      <section className="admin-intro">
        <div className="admin-intro-tools"><span className="admin-badge">内容管理</span>{onLogout && <button type="button" onClick={onLogout}>退出登录</button>}</div>
        <h1>内容管理</h1>
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
            <div className="post-block-editor">
              <div className="post-block-heading">
                <div><span>帖子正文 <em>必填</em></span><small>文字和图片会严格按照这里的先后顺序显示。</small></div>
                <div className="post-block-add"><button type="button" onClick={() => setPostBlocks((blocks) => [...blocks, newTextBlock()])}>＋ 添加文字</button><button type="button" onClick={() => setPostBlocks((blocks) => [...blocks, newImageBlock()])}>＋ 添加图片</button></div>
              </div>
              <div className="post-block-list">
                {postBlocks.map((block, index) => <section className="post-editor-block" key={block.id}>
                  <header><strong>{index + 1}. {block.type === "text" ? "文字" : "图片"}</strong><div><button type="button" disabled={index === 0} onClick={() => moveBlock(index, -1)} aria-label="向上移动">↑</button><button type="button" disabled={index === postBlocks.length - 1} onClick={() => moveBlock(index, 1)} aria-label="向下移动">↓</button><button type="button" className="remove-block" disabled={postBlocks.length === 1} onClick={() => setPostBlocks((blocks) => blocks.filter((item) => item.id !== block.id))}>删除</button></div></header>
                  {block.type === "text" ? <textarea rows={7} value={block.text} onChange={(event) => updateBlock(block.id, { text:event.target.value })} placeholder={"在这里输入这一段文字。\n\n支持空行、小标题（## 小标题）和加粗（**文字**）。"} /> : <div className="post-image-input"><input type="file" accept="image/*" onChange={(event) => updateBlock(block.id, { file:event.target.files?.[0] || null })} /><input value={block.alt} onChange={(event) => updateBlock(block.id, { alt:event.target.value })} placeholder="图片说明（可以不填）" />{block.file && <small>已选择：{block.file.name}</small>}</div>}
                </section>)}
              </div>
              <div className="post-block-add post-block-add-bottom"><button type="button" onClick={() => setPostBlocks((blocks) => [...blocks, newTextBlock()])}>＋ 继续添加文字</button><button type="button" onClick={() => setPostBlocks((blocks) => [...blocks, newImageBlock()])}>＋ 继续添加图片</button></div>
            </div>
            <label className="file-field"><span>封面图片</span><input name="cover" type="file" accept="image/*" /><small>支持 JPG、PNG、WebP。没有封面也可以发布。</small></label>
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
