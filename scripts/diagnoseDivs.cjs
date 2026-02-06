// Converted to .cjs version for CommonJS
const fs = require('fs');
const s = fs.readFileSync('src/pages/HaitiSocialApp.jsx','utf8');
const regex = /(<div\b[^>]*?>)|(<!--[^]*?-->)|(<\/div>)/g; // match opening div (non-greedy), comments, or closing div

let m;
let stack = [];
let lineIdx = 1;
let lastIndex = 0;
while((m = regex.exec(s)) !== null){
  const prev = s.slice(lastIndex, m.index);
  const lines = prev.split('\n').length - 1;
  lineIdx += lines;
  if(m[1]){
    const tag = m[1];
    if(!/\/>\s*$/.test(tag)) {
      stack.push({line: lineIdx, tag});
    }
  } else if (m[3]) {
    if(stack.length === 0){
      console.log('Extra closing </div> at line', lineIdx);
    } else {
      stack.pop();
    }
  }
  lastIndex = m.index;
}
console.log('Unclosed <div> count:', stack.length);
stack.slice(0,50).forEach(x => console.log('Unclosed at line', x.line, x.tag));
