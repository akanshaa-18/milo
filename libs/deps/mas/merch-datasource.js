function h(o,t={},s){let e=document.createElement(o);s instanceof HTMLElement?e.appendChild(s):e.innerHTML=s;for(let[a,c]of Object.entries(t))e.setAttribute(a,c);return e}function b(o=1e3){return new Promise(t=>setTimeout(t,o))}var m=class{#t;constructor(t){this.#t=/^author-/.test(t);let s=`https://${t}.adobeaemcloud.com`,e=`${s}/adobe/sites`;this.cfFragmentsUrl=`${e}/cf/fragments`,this.cfSearchUrl=`${this.cfFragmentsUrl}/search`,this.cfPublishUrl=`${this.cfFragmentsUrl}/publish`,this.wcmcommandUrl=`${s}/bin/wcmcommand`,this.csrfTokenUrl=`${s}/libs/granite/csrf/token.json`,this.headers={Authorization:`Bearer ${sessionStorage.getItem("masAccessToken")??window.adobeid?.authorize?.()}`,pragma:"no-cache","cache-control":"no-cache"}}async getCsrfToken(){let{token:t}=await fetch(this.csrfTokenUrl,{headers:this.headers}).then(s=>s.json());return t}async searchFragment({path:t,query:s,variant:e}){let a={};t&&(a.path=t),s&&(a.fullText={text:encodeURIComponent(s),queryMode:"EXACT_WORDS"});let c=new URLSearchParams({query:JSON.stringify({filter:a})}).toString();return fetch(`${this.cfSearchUrl}?${c}`,{headers:this.headers}).then(i=>i.json()).then(i=>i.items).then(i=>e?i.filter(r=>{let[n]=r.fields.find(l=>l.name==="variant")?.values;return n===e}):i)}async getFragmentByPath(t){let s=this.#t?this.headers:{};return fetch(`${this.cfFragmentsUrl}?path=${t}`,{headers:s}).then(e=>e.json()).then(({items:[e]})=>e)}async getFragment(t){let s=t.headers.get("Etag"),e=await t.json();return e.etag=s,e}async getFragmentById(t){return await fetch(`${this.cfFragmentsUrl}/${t}`,{headers:this.headers}).then(this.getFragment)}async saveFragment(t){let{title:s,fields:e}=t;return await fetch(`${this.cfFragmentsUrl}/${t.id}`,{method:"PUT",headers:{"Content-Type":"application/json","If-Match":t.etag,...this.headers},body:JSON.stringify({title:s,fields:e})}).then(this.getFragment)}async copyFragmentClassic(t){let s=await this.getCsrfToken(),e=t.path.split("/").slice(0,-1).join("/"),a=new FormData;a.append("cmd","copyPage"),a.append("srcPath",t.path),a.append("destParentPath",e),a.append("shallow","false"),a.append("_charset_","UTF-8");let c=await fetch(this.wcmcommandUrl,{method:"POST",headers:{...this.headers,"csrf-token":s},body:a});if(c.ok){let i=await c.text(),d=new DOMParser().parseFromString(i,"text/html").getElementById("Message")?.textContent.trim();await b();let g=await this.getFragmentByPath(d);return g&&(g=await this.getFragmentById(g.id)),g}throw new Error("Failed to copy fragment")}async publishFragment(t){await fetch(this.cfPublishUrl,{method:"POST",headers:{"Content-Type":"application/json","If-Match":t.etag,...this.headers},body:JSON.stringify({paths:[t.path],filterReferencesByStatus:["DRAFT","UNPUBLISHED"],workflowModelId:"/var/workflow/models/scheduled_activation_with_references"})})}async deleteFragment(t){await fetch(`${this.cfFragmentsUrl}/${t.id}`,{method:"DELETE",headers:{"Content-Type":"application/json","If-Match":t.etag,...this.headers}})}sites={cf:{fragments:{search:this.searchFragment.bind(this),getByPath:this.getFragmentByPath.bind(this),getById:this.getFragmentById.bind(this),save:this.saveFragment.bind(this),copy:this.copyFragmentClassic.bind(this),publish:this.publishFragment.bind(this),delete:this.deleteFragment.bind(this)}}}};var w="aem-bucket",f={CATALOG:"catalog",AH:"ah",CCD_ACTION:"ccd-action",SPECIAL_OFFERS:"special-offers"},T={[f.CATALOG]:{title:{tag:"h3",slot:"heading-xs"},prices:{tag:"h3",slot:"heading-xs"},description:{tag:"div",slot:"body-xs"},ctas:{size:"l"}},[f.AH]:{title:{tag:"h3",slot:"heading-xxs"},prices:{tag:"h3",slot:"heading-xs"},description:{tag:"div",slot:"body-xxs"},ctas:{size:"s"}},[f.CCD_ACTION]:{title:{tag:"h3",slot:"heading-xs"},prices:{tag:"h3",slot:"heading-xs"},description:{tag:"div",slot:"body-xs"},ctas:{size:"l"}},[f.SPECIAL_OFFERS]:{name:{tag:"h4",slot:"detail-m"},title:{tag:"h4",slot:"detail-m"},backgroundImage:{tag:"div",slot:"bg-image"},prices:{tag:"h3",slot:"heading-xs"},description:{tag:"div",slot:"body-xs"},ctas:{size:"l"}}};async function x(o,t,s,e){let a=o.fields.reduce((r,{name:n,multiple:l,values:d})=>(r[n]=l?d:d[0],r),{id:o.id});a.model=a.model;let{variant:c="catalog"}=a;s.setAttribute("variant",c);let i=T[c]??"catalog";if(a.icon?.forEach(r=>{let n=h("merch-icon",{slot:"icons",src:r,alt:"",href:"",size:"l"});t(n)}),a.title&&i.title&&t(h(i.title.tag,{slot:i.title.slot},a.title)),a.backgroundImage&&i.backgroundImage&&t(h(i.backgroundImage.tag,{slot:i.backgroundImage.slot},`<img loading="lazy" src="${a.backgroundImage}" width="600" height="362">`)),a.prices&&i.prices){let r=a.prices,n=h(i.prices.tag,{slot:i.prices.slot},r);t(n)}if(a.description&&i.description){let r=h(i.description.tag,{slot:i.description.slot},a.description);t(r)}if(a.ctas){let r=h("div",{slot:"footer"},a.ctas);[...r.querySelectorAll("a")].forEach(n=>{if(e)n.classList.add("con-button"),n.parentElement.tagName==="STRONG"&&n.classList.add("blue"),r.appendChild(n);else{let l=h("sp-button",{},n);l.addEventListener("click",d=>{d.stopPropagation(),n.click()}),r.appendChild(l)}}),t(r)}}var p=class{#t=new Map;clear(){this.#t.clear()}add(...t){t.forEach(s=>{let{path:e}=s;e&&this.#t.set(e,s)})}has(t){return this.#t.has(t)}get(t){return this.#t.get(t)}remove(t){this.#t.delete(t)}},y=new p,u=class extends HTMLElement{#t;cache=y;refs=[];path;consonant=!1;#e;static get observedAttributes(){return["source","path","consonant"]}attributeChangedCallback(t,s,e){this[t]=e}connectedCallback(){this.consonant=this.hasAttribute("consonant"),this.clearRefs();let t=this.getAttribute(w)??"publish-p22655-e59341";this.#t=new m(t),this.refresh(!0)}clearRefs(){this.refs.forEach(t=>{t.remove()})}async refresh(t=!0){this.path&&(this.#e&&!await Promise.race([this.#e,Promise.resolve(!1)])||(this.clearRefs(),this.refs=[],t&&this.cache.remove(this.path),this.#e=this.fetchData().then(()=>!0)))}async fetchData(){let t=y.get(this.path);if(t||(t=await this.#t.sites.cf.fragments.getByPath(this.path)),t){x(t,e=>{this.parentElement.appendChild(e),this.refs.push(e)},this.parentElement,this.consonant);return}}get updateComplete(){return this.#e??Promise.reject(new Error("datasource is not correctly configured"))}};customElements.define("merch-datasource",u);export{u as MerchDataSource};
//# sourceMappingURL=merch-datasource.js.map
