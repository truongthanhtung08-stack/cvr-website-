// Sinh src/components/HinhPhosphor.tsx: chỉ giữ kiểu nét web dùng của từng hình Phosphor. Chạy: node scripts/sinh-hinh-phosphor.cjs
const fs=require('fs');
const d='node_modules/@phosphor-icons/react/dist/defs/';
const can={House:['regular','fill'],Buildings:['regular','fill'],City:['regular','fill'],Newspaper:['regular','fill'],User:['regular','fill'],Heart:['regular','fill'],FileText:['regular','fill'],Plus:['regular','fill'],SquaresFour:['regular','fill'],Wallet:['regular','fill'],Receipt:['regular','fill'],Star:['regular','fill'],Bell:['regular','fill'],Gear:['regular','fill'],SignOut:['regular','fill'],ShieldCheck:['regular','fill'],ShareNetwork:['regular','fill'],
 MagnifyingGlass:['regular','bold','duotone'],ClockCounterClockwise:['regular','bold','duotone'],X:['regular','bold','duotone'],CircleNotch:['regular','bold','duotone'],ArrowUpLeft:['regular','bold','duotone']};
const FRAG=Symbol('frag');
const fake={Fragment:FRAG,createElement:(t,p,...c)=>({t,p:p||{},c})};
const jsx=n=>{if(typeof n==='string')return JSON.stringify(n);const kids=n.c.map(jsx).join('');if(n.t===FRAG)return `<>${kids}</>`;
 const at=Object.entries(n.p).map(([k,v])=>`${k}=${typeof v==='string'?JSON.stringify(v):`{${JSON.stringify(v)}}`}`).join(' ');return kids?`<${n.t} ${at}>${kids}</${n.t}>`:`<${n.t} ${at} />`;};
let out=`// SINH TỰ ĐỘNG từ @phosphor-icons/react 2.1.7 (dist/defs) — KHÔNG sửa tay. Đường vẽ chép NGUYÊN VĂN từ gói, chỉ giữ các
// kiểu nét web đang dùng (27/10/2026: mỗi hình của gói chở đủ 6 kiểu nét, 22 hình = 73 KB mã tải ở MỌI trang). Vẽ qua đúng
// khung gốc của gói (SSRBase) nên SVG ra y hệt. Thêm hình / kiểu nét mới: thêm vào danh sách can trong scripts/sinh-hinh-phosphor.cjs rồi chạy lại.
import { forwardRef, type ReactElement } from "react";
import SSRBase from "@phosphor-icons/react/dist/lib/SSRBase";
import type { Icon, IconProps, IconWeight } from "@phosphor-icons/react";

function tao(ten: string, weights: Map<IconWeight, ReactElement>): Icon {
  const C = forwardRef<SVGSVGElement, IconProps>((p, ref) => <SSRBase ref={ref} {...p} weights={weights} />);
  C.displayName = ten;
  return C;
}
`;
for(const [ten,nets] of Object.entries(can)){let src=fs.readFileSync(d+ten+'.mjs','utf8');
 const vn=(src.match(/import (\w+) from "react";/)||[])[1];src=src.replace(/import \w+ from "react";/,'').replace(/export\s*\{\s*(\w+) as default\s*\};?/,'return $1;').replace(/\/\* @__PURE__ \*\//g,'');
 const m=new Function(vn,src)(fake);
 out+=`\nexport const ${ten} = tao(${JSON.stringify(ten)}, new Map<IconWeight, ReactElement>([\n`+nets.map(w=>{if(!m.get(w))throw ten+w;return `  [${JSON.stringify(w)}, ${jsx(m.get(w))}],\n`}).join('')+`]));\n`;}
fs.writeFileSync('src/components/HinhPhosphor.tsx',out);
