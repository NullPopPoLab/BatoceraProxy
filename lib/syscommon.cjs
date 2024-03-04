// ‡ System Common Utilities 

var sig_shutdown=false;
var engine=[]
var engine_toid=null;

function proc_new(cbpoll,cbdone,cbabort){

	if(!cbpoll){
		mif.log_warn('empty pollee');
	}

	var proc={
		end:false,
		cbpoll:cbpoll,
		cbdone:cbdone,
		cbabort:cbabort,

		abort:()=>{
			if(proc.end)return;
			proc.end=true;
			if(proc.cbabort)proc.cbabort();
		},
	}
	return proc;
}

function start_engine(){

	engine_toid=setInterval(()=>{

		if(engine.length<1)return;

		var proc=engine.shift();
		var r=(proc.cbpoll && !proc.end)?proc.cbpoll():false;
		if(r)engine.push(proc);
		else if(!proc.end){
			proc.end=true;
			if(proc.cbdone)proc.cbdone();
		}
	},1);
}

function stop_engine(){

	if(engine_toid){
		clearInterval(engine_toid);
		engine_toid=null;
	}

	for(var proc of engine){
		proc.abort();
	}
	engine=[]
}

var mif={

	log_level_name:['TICK','TRACE','DEBUG','INFO','NOTICE','WARN','FATAL','CRIT','ALERT','EMERG'],

	shutdown:()=>{
		if(sig_shutdown)return;
		sig_shutdown=true;
		stop_engine();
	},

	log_format:(lev,msg)=>{
		var lln=mif.log_level_name[lev]??('?'+lev+'?');
		return '['+lln+'] '+msg;
	},
	log_func:(lev,msg)=>{
		console.log(mif.log_format(lev,msg));
	},
	log_put:(lev,msg)=>{
		if(lev<mif.log_showable)return;
		mif.log_func(lev,msg);
	},

	launch:(cbpoll,cbdone,cbabort)=>{
		var proc=proc_new(cbpoll,cbdone,cbabort);
		engine.push(proc);
		return proc;
	},
}

mif.log_level={}
for(var i=0 in mif.log_level_name)mif.log_level[mif.log_level_name[i]]=i;
mif.log_level['NEVER']=mif.log_level.length;

mif.log_showable=mif.log_level.INFO;
mif.log_tick=(msg)=>mif.log_put(mif.log_level.TICK,msg);
mif.log_trace=(msg)=>mif.log_put(mif.log_level.TRACE,msg);
mif.log_debug=(msg)=>mif.log_put(mif.log_level.DEBUG,msg);
mif.log_info=(msg)=>mif.log_put(mif.log_level.INFO,msg);
mif.log_notice=(msg)=>mif.log_put(mif.log_level.NOTICE,msg);
mif.log_warn=(msg)=>mif.log_put(mif.log_level.WARN,msg);
mif.log_fatal=(msg)=>mif.log_put(mif.log_level.FATAL,msg);
mif.log_crit=(msg)=>mif.log_put(mif.log_level.CRIT,msg);
mif.log_alert=(msg)=>mif.log_put(mif.log_level.ALERT,msg);
mif.log_emerg=(msg)=>mif.log_put(mif.log_level.EMERG,msg);

start_engine();

module.exports=mif;
