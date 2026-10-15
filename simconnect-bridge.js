'use strict';
// Flight Atlas automatic local MSFS 2020/2024 SimConnect client.
const {open,Protocol,SimConnectDataType,SimConnectPeriod,SimConnectConstants}=require('node-simconnect');
const DEF=2711,REQUEST=2712;
class FlightAtlasSimConnect{
 constructor(){this.handle=null;this.timer=null;this.connecting=false;this.stopped=false;this.last=null;this.state='waiting';this.simulator='';this.error='';this.lastAt=0;}
 start(){if(this.timer)return;this.stopped=false;this._connect();this.timer=setInterval(()=>{if(!this.handle&&!this.connecting)this._connect();if(this.handle&&Date.now()-this.lastAt>12000&&this.lastAt){this._disconnect()}},5000);}
 stop(){this.stopped=true;if(this.timer)clearInterval(this.timer);this.timer=null;this._disconnect();}
 _disconnect(){const h=this.handle;this.handle=null;this.last=null;this.lastAt=0;this.state='waiting';if(h)try{h.close()}catch(_){}}
 async _connect(){
   if(this.stopped||this.connecting||this.handle)return;
   this.connecting=true;this.state='connecting';
   try{
    const {handle,recvOpen}=await open('Flight Atlas',Protocol.FSX_SP2);
    if(this.stopped){try{handle.close()}catch(_){};return}
    this.handle=handle;this.state='connected';this.simulator=String(recvOpen?.applicationName||'MSFS');this.error='';this.lastAt=0;
    const data=[['PLANE LATITUDE','degrees'],['PLANE LONGITUDE','degrees'],['PLANE ALTITUDE','feet'],['PLANE HEADING DEGREES TRUE','degrees'],['AIRSPEED INDICATED','knots'],['GROUND VELOCITY','knots']];
    for(const [name,units] of data)handle.addToDataDefinition(DEF,name,units,SimConnectDataType.FLOAT64);
    handle.on('simObjectData',packet=>{
      if(packet.requestID!==REQUEST)return;
      try{const buf=packet.data,vals=data.map(()=>buf.readFloat64());if(!vals.every(Number.isFinite)||Math.abs(vals[0])>90||Math.abs(vals[1])>180)return;
       this.last={lat:vals[0],lon:vals[1],altitude:vals[2],heading:vals[3],ias:vals[4],groundSpeed:vals[5],timestamp:Date.now()};
       this.lastAt=Date.now();this.state='connected';
      }catch(e){this.error=e.message}
    });
    const gone=()=>{if(this.handle===handle)this._disconnect()};
    handle.on('quit',gone);handle.on('close',gone);
    handle.on('exception',e=>{this.error='SimConnect: '+String(e?.exception||e)});
    handle.requestDataOnSimObject(REQUEST,DEF,SimConnectConstants.OBJECT_ID_USER,SimConnectPeriod.SECOND);
   }catch(e){this.handle=null;this.state='waiting';this.error=String(e?.message||e)}
   finally{this.connecting=false}
 }
 snapshot(){return {state:this.state,simulator:this.simulator,error:this.state==='connected'?'':this.error,position:this.last&&Date.now()-this.last.timestamp<10000?this.last:null}}
}
module.exports={FlightAtlasSimConnect};
