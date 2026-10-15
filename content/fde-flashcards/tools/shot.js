const { chromium } = require('playwright');
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
 const p=await b.newPage({viewport:{width:400,height:820},deviceScaleFactor:2});
 const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('file://'+process.cwd()+'/GitHub card preview.html');
 for(let s=0;s<3;s++){await p.screenshot({path:`side${s+1}.png`});await p.click('#body',{position:{x:5,y:5}}).catch(()=>{});}
 console.log('errors',errs);await b.close();
})();
