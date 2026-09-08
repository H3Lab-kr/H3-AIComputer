const {packager}=require('@electron/packager');
const path=require('node:path');
const targets=process.argv.slice(2);const [platform=process.platform,arch=process.arch]=targets;
packager({dir:__dirname,out:path.join(__dirname,'dist'),platform,arch,name:'H3 AI Computer',executableName:'h3-ai-computer',appBundleId:'kr.h3lab.desktop',appVersion:'0.4.0',asar:true,overwrite:true,prune:true,ignore:[/^\/dist($|\/)/,/^\/tests($|\/)/,/^\/package\.cjs$/,/^\/README\.md$/],osxSign:false,win32metadata:{CompanyName:'H3Lab',FileDescription:'H3 AI Computer · Local-first workspace'}}).then(paths=>console.log(paths.join('\n'))).catch(e=>{console.error(e);process.exit(1);});
