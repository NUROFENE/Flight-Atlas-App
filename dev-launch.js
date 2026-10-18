'use strict';
const {spawn}=require('node:child_process');
const electron=require('electron');
const child=spawn(electron,['.'],{
  cwd:__dirname,
  env:{...process.env,FLIGHT_ATLAS_DEV:'1'},
  stdio:'inherit',
  windowsHide:false
});
child.on('error',err=>{console.error(err);process.exitCode=1;});
child.on('exit',(code)=>{process.exitCode=code??1;});
