const {contextBridge,ipcRenderer}=require('electron');
const methods=['state','save','choose','models','pull','key','chat','agent','approve','stop','media','history','openJob','external'];
contextBridge.exposeInMainWorld('h3',Object.fromEntries([...methods.map(name=>[name,(value)=>ipcRenderer.invoke('h3:'+name,value)]),['events',fn=>{const handler=(_,event)=>fn(event);ipcRenderer.on('h3:event',handler);return()=>ipcRenderer.removeListener('h3:event',handler);}]]));
