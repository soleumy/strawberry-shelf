import{c as N,u as w,j as a,B as L,a as g,m as C,g as S,f as E}from"./index-B0IIucVq.js";import{r as d,L as f}from"./vendor-CdnXQ27w.js";import{B}from"./bookmark-CF_3eaXb.js";import{C as I}from"./check-circle-BxPdNnBZ.js";import"./supabase-Be25SE7n.js";/**
 * @license lucide-react v0.300.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const z=N("FolderHeart",[["path",{d:"M11 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v1.5",key:"6hud8k"}],["path",{d:"M13.9 17.45c-1.2-1.2-1.14-2.8-.2-3.73a2.43 2.43 0 0 1 3.44 0l.36.34.34-.34a2.43 2.43 0 0 1 3.45-.01v0c.95.95 1 2.53-.2 3.74L17.5 21Z",key:"vgq86i"}]]);/**
 * @license lucide-react v0.300.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const A=N("PauseCircle",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["line",{x1:"10",x2:"10",y1:"15",y2:"9",key:"c1nkhi"}],["line",{x1:"14",x2:"14",y1:"15",y2:"9",key:"h65svq"}]]),j=[{id:"reading",label:"Leyendo",icon:L},{id:"want_to_read",label:"Por leer",icon:B},{id:"completed",label:"Completadas",icon:I},{id:"paused",label:"En pausa",icon:A}];function v(s){var n,c;return((n=s==null?void 0:s.author)==null?void 0:n.display_name)||((c=s==null?void 0:s.author)==null?void 0:c.username)||(s==null?void 0:s.author_name_override)||(s==null?void 0:s.author)||"Comunidad"}function P(){var x;const{user:s}=w(),[n,c]=d.useState("reading"),[m,b]=d.useState([]),[_,h]=d.useState(!0);async function l(){h(!0);let e=[],r=[];if(g.isConfigured!==!1&&s){const{data:i}=await g.from("reading_list").select(`
          status,
          novel_id,
          novel:novels (
            id,
            title,
            cover_url,
            synopsis,
            author_name_override,
            author:profiles(display_name, username)
          )
        `).eq("user_id",s.id);e=(i||[]).filter(t=>t.novel).map(t=>({...t.novel,id:String(t.novel.id),status:t.status,author_name:v(t.novel)})),r=e}const o=C(r),u=S(s==null?void 0:s.id).map(i=>{const t=o.find(k=>String(k.id)===String(i.novel_id))||E(i.novel_id);return t?{...t,id:String(t.id),status:i.status,author_name:v(t)}:null}).filter(Boolean),y=new Map;[...e,...u].forEach(i=>y.set(`${i.status}:${i.id}`,i)),b([...y.values()]),h(!1)}d.useEffect(()=>(l(),window.addEventListener("strawberry:library-updated",l),()=>window.removeEventListener("strawberry:library-updated",l)),[s==null?void 0:s.id]);const p=m.filter(e=>e.status===n);return a.jsx("main",{className:"library-page kawaii-dashboard-content",children:a.jsxs("section",{className:"reader-card",children:[a.jsxs("div",{className:"page-header-row",children:[a.jsxs("div",{children:[a.jsxs("p",{className:"reader-novel",children:[a.jsx(z,{size:18})," Mi biblioteca"]}),a.jsx("h1",{children:"Mi estantería"}),a.jsx("p",{className:"muted",children:"Organiza tus lecturas y retoma tus novelas cuando quieras."})]}),a.jsx(f,{to:"/",className:"secondary-action",children:"Volver al catálogo"})]}),a.jsx("div",{className:"library-tabs",children:j.map(e=>{const r=e.icon,o=n===e.id;return a.jsxs("button",{type:"button",className:o?"active":"",onClick:()=>c(e.id),children:[a.jsx(r,{size:16}),e.label,a.jsx("span",{children:m.filter(u=>u.status===e.id).length})]},e.id)})}),_?a.jsx("div",{className:"empty-state",children:"Organizando tus estantes..."}):p.length===0?a.jsxs("div",{className:"empty-state",children:['No tienes novelas en "',(x=j.find(e=>e.id===n))==null?void 0:x.label,'".']}):a.jsx("div",{className:"kawaii-grid",children:p.map(e=>{var r;return a.jsxs(f,{to:`/novel/${e.id}`,className:"kawaii-novel-card",children:[a.jsxs("div",{className:"kawaii-cover",children:[a.jsx("img",{src:e.cover_url||e.cover||"/placeholder-cover.png",alt:e.title,loading:"lazy"}),a.jsxs("span",{children:[((r=e.chapters)==null?void 0:r.length)||0," caps"]})]}),a.jsxs("div",{children:[a.jsx("h3",{children:e.title}),a.jsx("p",{children:e.author_name})]})]},`${e.status}-${e.id}`)})})]})})}export{P as Library};
