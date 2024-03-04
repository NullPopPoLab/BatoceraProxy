// † MKKKKKS for web JS † //
// First Kit //

function booleanize(val){
	if(val===undefined)return false;
	if(val=='0')return false;
	if(val=='false')return false;
	return !!val;
}

function zerofill(val,col){
	var s='0'.repeat(col-1)+val;
	return s.substring(s.length-col);
}

function rxescape(src){
	const rg=/[\\^$.*+?()[\]{}|]/g;
	return src.replace(rg,'\\$&');
}

function uriescape(src){
}

function safestepiter(bgn,end,step,cbiter){

	var abort=false;
	for(var i=bgn;i<end;i+=step){
		if(abort)return;
		((i_)=>{
			if(cbiter(i_)===false)abort=true;
		})(i);
	}
}

function safearrayiter(src,cbiter){

	var abort=false;
	for(var t of src){
		if(abort)return;
		((t_)=>{
			if(cbiter(t_)===false)abort=true;
		})(t);
	}
}

function safeobjectiter(src,cbiter){

	var abort=false;
	for(var k in src){
		if(abort)return;
		((k_)=>{
			if(cbiter(k_,src[k_])===false)abort=true;
		})(k);
	}
}

log_level_name=['TICK','TRACE','DEBUG','INFO','NOTICE','WARN','FATAL','CRIT','ALERT','EMERG']
log_level={}
for(var i=0 in log_level_name)log_level[log_level_name[i]]=i;
log_level['NEVER']=log_level.length;

var log_showable=log_level.INFO;
function log_tick(msg){log_put(log_level.TICK,msg);}
function log_trace(msg){log_put(log_level.TRACE,msg);}
function log_debug(msg){log_put(log_level.DEBUG,msg);}
function log_info(msg){log_put(log_level.INFO,msg);}
function log_notice(msg){log_put(log_level.NOTICE,msg);}
function log_warn(msg){log_put(log_level.WARN,msg);}
function log_fatal(msg){log_put(log_level.FATAL,msg);}
function log_crit(msg){log_put(log_level.CRIT,msg);}
function log_alert(msg){log_put(log_level.ALERT,msg);}
function log_emerg(msg){log_put(log_level.EMERG,msg);}

function log_format(lev,msg){
	var lln=log_level_name[lev]??('?'+lev+'?');
	return '['+lln+'] '+msg;
}

var log_func=(lev,msg)=>{
	console.log(log_format(lev,msg));
}

function log_put(lev,msg){
	if(lev<log_showable)return;
	log_func(lev,msg);
}

function error_msg(src){
	var e={
		getSource:()=>{msg:src},
		toString:()=>src,
	}
	return e;
}

function error_obj(src){
	var e={
		getSource:()=>src,
		toString:()=>JSON.stringify(src),
	}
	return e;
}

function readfile(bin,file,cbok=null,cbng=null){

	var fd=new FileReader();
	if(bin)fd.readAsArrayBuffer(file);
	else fd.readAsText(file);

	var end=false;
	fd.addEventListener('load',()=>{
		if(end)return;
		end=true;
		if(cbok)cbok(file.name,fd.result);
	});
	fd.addEventListener('error',(err)=>{
		if(end)return;
		end=true;
		if(cbng)cbng(file.name,err);
	});
}

function http_request(method,url,opt,cbres=null,cbok=null,cbng=null){

	var req=new XMLHttpRequest();
	var ctx={
		url:url,
		opt:opt,
		accepted:false,
		end:false,
		send_progress:0.0,
		recv_progress:0.0,
		progress:0.0,
		req:req,
		abort:()=>{
			req.abort();
		},
	}
	var res={
		status:0,
		msg:'',
		timeout:false,
		data:null,
	}
	var sendratio=opt.sendratio??0.0;
	if(sendratio<0.0)sendratio=0.0;
	else if(sendratio>1.0)sendratio=1.0;

	req.addEventListener('loadstart',(ev)=>{
		ctx.accepted=true;
		ctx.send_progress=1.0;
		ctx.progress=sendratio;
	});
	req.addEventListener('progress',(ev)=>{
		if(!ev.lengthComputable)return;
		if(ev.total<1)return;
		ctx.recv_progress=ev.loaded/ev.total;
		ctx.progress=sendratio+((1.0-sendratio)*ctx.recv_progress);
	});
	req.addEventListener('load',(ev)=>{
		if(ctx.end)return;
		ctx.end=true;
		ctx.recv_progress=1.0;
		res.status=req.status;
		res.msg=req.statusText;
		res.body=req.response;
		res.head={}
		if(opt.refhead){
			for(var k of opt.refhead){
				res.head[k]=req.getResponseHeader(k);
			}
		}

		if(opt.cbgate){
			try{
				var r=opt.cbgate(res);
				if(r)cbres=r;
			}
			catch(e){
				if(cbng)cbng(error_obj(e));
				return;
			}
		}
		else if(res.status>299){
			if(cbng)cbng(error_obj(res));
			return;
		}

		if(cbres){
			var r=null;
			var e=null;
			try{
				r=cbres(res);
			}
			catch(exc){
				e=error_obj(exc);
				r=null;
			}

			if(e){
				if(cbng)cbng(e);
			}
			else if(r===null){
				e=error_msg('invalid response:');
				e.res=req.response;
				if(cbng)cbng(e);
			}
			else{
				if(cbok)cbok(r);
			}
		}
		else{
			if(cbok)cbok(res.body);
		}
	});
	req.addEventListener('error',(ev)=>{
		if(ctx.end)return;
		ctx.end=true;
		res.msg=ev.toString();
		if(cbng)cbng(error_msg(res.msg));
		else log_fatal(res.msg);
	});
	req.addEventListener('timeout',(ev)=>{
		if(ctx.end)return;
		ctx.end=true;
		res.timeout=true;
		res.msg='timed out';
		if(cbng)cbng(error_msg(res.msg));
		else log_fatal(res.msg);
	});
	req.addEventListener('abort',(ev)=>{
		if(ctx.end)return;
		ctx.end=true;
		res.msg='aborted';
		if(cbng)cbng(error_msg(res.msg));
		else log_notice(res.msg);
	});

	if(opt.restype)req.responseType=opt.restype;
	if(opt.timeout)req.timeout=opt.timeout;
	if(opt.header){
		for(var k in opt.header){
			req.setRequestHeader(k,opt.header[k]);
		}
	}

	if(opt.body){
		req.upload.addEventListener('progress',(ev)=>{
			if(ctx.end)return;
			if(ev.total<1)return;
			ctx.send_progress=ev.loaded/ev.total;
			ctx.progress=sendratio*ctx.send_progress;
		});
	}

	req.open(method,url);
	if(opt.body){
		if(opt.type)req.setRequestHeader('Content-Type',opt.type);
		req.send(opt.body);
	}
	else req.send();

	return ctx;
}

function http_get_text(url,cbok=null,cbng=null,opt={}){

	return http_request('GET',url,opt,
	(res)=>{
		if(res.status!=200)return null;
		return res.body;
	},cbok,cbng);
}

function http_get_blob(url,cbok=null,cbng=null,opt={}){

	return http_request('GET',url,Object.assign({
		restype:'blob',
	},opt),
	(res)=>{
		if(res.status!=200)return null;
		return res.body;
	},cbok,cbng);
}

function http_get_buf(url,cbok=null,cbng=null,opt={}){

	return http_request('GET',url,Object.assign({
		restype:'arraybuffer',
	},opt),
	(res)=>{
		if(res.status!=200)return null;
		return res.body;
	},cbok,cbng);
}

function http_get_json(url,cbok=null,cbng=null,opt={}){

	return http_request('GET',url,opt,
	(res)=>{
		if(res.status!=200)return null;
		return JSON.parse(res.body);
	},cbok,cbng);
}

function http_get_xml(url,cbok=null,cbng=null,opt={}){

	return http_request('GET',url,opt,
	(res)=>{
		if(res.status!=200)return null;
		var psr=new DOMParser();
		return psr.parseFromString(res.body,"text/xml");
	},cbok,cbng);
}

function http_post_text(url,text,cbok=null,cbng=null,opt={}){

	return http_request('POST',url,Object.assign({
		headers:{'Content-Type':'text/plain'},
		body:text,
		sendratio:0.99,
	},opt),
	(res)=>{
		return res.body;
	},cbok,cbng);
}

function http_post_json(url,data,cbok=null,cbng=null,opt={}){

	return http_request('POST',url,Object.assign({
		headers:{'Content-Type':'application/json'},
		body:JSON.stringify(data),
		sendratio:0.99,
	},opt),
	(res)=>{
		return res.body;
	},cbok,cbng);
}

function http_post_file(url,bin,file,cbok=null,cbng=null,opt={}){

	readfile(bin,file,(name,data)=>{
		return http_request('POST',url,Object.assign({
			type:file.type?file.type:'application/octet-stream',
			body:data,
			sendratio:0.99,
		},opt),
		(res)=>{
			return res.body;
		},cbok,cbng);
	},cbng);
}

function http_delete(url,cbok=null,cbng=null,opt={}){

	return http_request('DELETE',url,opt,
	(res)=>{
		return res.body;
	},cbok,cbng);
}

function quickhtml(prm){

	if(!prm.tag){
		if(prm.target && prm.sub){
			for(var sub of prm.sub){
				if(sub===null){}
				else if(typeof sub==='object')prm.target.append(sub);
				else prm.target.innerHTML+=sub;
			}
		}
		return null;
	}

	var el=document.createElement(prm.tag);
	if(prm.attr){
		for(var k in prm.attr){
			el.setAttribute(k,prm.attr[k]);
		}
	}
	if(prm.style){
		for(var k in prm.style){
			el.style[k]=prm.style[k];
		}
	}
	if(prm.sub){
		for(var t of prm.sub){
			if(t===null){}
			else if(typeof t==='object')el.append(t);
			else el.innerHTML+=t;
		}
	}
	if(prm.target)prm.target.append(el);
	return el;
}

var engine=[]
var engine_toid=null;

function proc_new(cbpoll,cbdone,cbabort){

	if(!cbpoll){
		log_warn('empty pollee');
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

function engine_launch(cbpoll,cbdone,cbabort){
	var proc=proc_new(cbpoll,cbdone,cbabort);
	engine.push(proc);
	return proc;
}

function poll_engine(){

	if(engine.length<1)return;

	var proc=engine.shift();
	var r=(proc.cbpoll && !proc.end)?proc.cbpoll():false;
	if(r)engine.push(proc);
	else if(!proc.end){
		proc.end=true;
		if(proc.cbdone)proc.cbdone();
	}

	engine_toid=setTimeout(poll_engine,20);
}

function start_engine(){

	if(engine_toid)return;
	engine_toid=setTimeout(poll_engine,1);
}

function stop_engine(){

	if(engine_toid){
		clearTimeout(engine_toid);
		engine_toid=null;
	}

	for(var proc of engine){
		proc.abort();
	}
	engine=[]
}

ipl_managers={}

function ipl_unmanage(mng){

	if(!mng.working)return;
	mng.working=false;
}

function ipl_manage(cate,ctor,dtor){

	var mng={
		working:true,
		uncache:false,
		ctor:ctor,
		dtor:dtor,
		target:{},
		loading:[],
	}
	mng.unload=(handle)=>{
		if(!handle.open)return;
		handle.open=false;
		if(!mng.target[handle.path])return;

		var unit=mng.target[handle.path];
		if(--unit.cnt>0)return;
		if(mng.dtor)mng.dtor(unit.inst);
		unit.abort();
		unit.inst=null;
		delete mng.target[handle.path];
	}
	mng.load_special=(path,loader)=>{
		var handle={
			unit:null,
			path:path,
			open:true,
			loader:loader,

			getInstance:()=>handle.unit?handle.unit.inst:null,
		}
		handle.abend=(err)=>{
			handle.open=false;
		}

		var unit=handle.unit=mng.target[path];
		if(unit){
			++unit.cnt;
		}
		else{
			unit=handle.unit={
				path:path,
				ready:false,
				cnt:1,
				inst:null,
				err:null,
			}
			mng.target[path]=unit;

			loader(handle);
		}
		mng.loading.push(handle);

		return handle;
	}

	mng.load=(path)=>{

		return mng.load_special(path,(handle)=>{
			var unit=handle.unit;
			var url=path;
			if(mng.uncache)url+='?'+Date.now();
			http_get_text(url,(text)=>{
				if(mng.ctor){
					try{
						unit.inst=mng.ctor(text);
						unit.ready=!!unit.inst;
					}
					catch(err){
						unit.err=err;
						handle.abend(err);
					}
				}
				else{
					unit.ready=true;
				}
			},(err)=>{
				unit.err=err;
				handle.abend(err);
			});
		});
	}

	mng.poll=()=>{
		if(mng.loading.length<1)return true;
		var handle=mng.loading.shift();
		var unit=mng.target[handle.path];
		if(unit.ready){
			return true;
		}
		mng.loading.push(handle);
		return true;
	}

	ipl_managers[cate]=mng;
	engine_launch(()=>mng.poll());
	return mng;
}

var style_holder=document.getElementById('styles');
var ipl_styles=ipl_manage('style',(text)=>{
	var el=document.createElement('style');
	el.innerHTML=text;
	style_holder.append(el);
	return el;
},(el)=>{
	el.remove();
});

var module_holder=document.getElementById('modules');
var ipl_modules=ipl_manage('module',(text)=>{
	var el=document.createElement('script');
	el.innerHTML="<!--\n"+text+'//-->';
	module_holder.append(el);
	return el;
},(el)=>{
	el.remove();
});

var ipl_resources_xml=ipl_manage('xml',(text)=>{

	var psr=new DOMParser();
	return psr.parseFromString(text, "text/xml");
},(el)=>{
});


ipl_modules.load_debug=(path,cbchk)=>{
	return ipl_modules.load_special(path,(handle)=>{
		var unit=handle.unit;
		unit.ready=false;

		var url=path;
		if(ipl_modules.uncache)url+='?'+Date.now();
		unit.inst=quickhtml({
			tag:'script',
			attr:{src:url},
		});
		module_holder.append(unit.inst);

		engine_launch(
			()=>{
				try{return !cbchk();}
				catch(e){return true;}
			},
			()=>{unit.ready=true;}
		);
	});
}

function ipl_isready(){

	var done=true;
	safeobjectiter(ipl_managers,(cate,mng)=>{
		if(mng.loading.length>0)done=false;
		else safeobjectiter(mng.target,(path,unit)=>{
			if(!unit.ready)done=false;
			return done;
		});
		return done;
	});
	return done;
}

function ipl_monitor(view){

	var tbl=quickhtml({
		tag:'table',
		attr:{class:'iplmon_table'},
		sub:[
			quickhtml({tag:'tr',attr:{class:'iplmon_thr'},sub:[
				quickhtml({tag:'th',attr:{class:'iplmon_th'},sub:['Category']}),
				quickhtml({tag:'th',attr:{class:'iplmon_th'},sub:['Label']}),
				quickhtml({tag:'th',attr:{class:'iplmon_th'},sub:['Condition']}),
			]}),
		]
	});
	safeobjectiter(ipl_managers,(cate,mng)=>{
		safeobjectiter(mng.target,(path,unit)=>{
			var tr=quickhtml({
				target:tbl,
				tag:'tr',
				attr:{class:'iplmon_tdr'},
				sub:[
					quickhtml({tag:'td',attr:{class:'iplmon_td_category'},sub:[cate]}),
					quickhtml({tag:'td',attr:{class:'iplmon_td_path'},sub:[unit.path]}),
				]
			});

			var s='';
			if(unit.ready)s='OK';
			else if(unit.err)s=unit.err.toString();
			else s='Wait for it...';
			quickhtml({target:tr,tag:'td',attr:{class:'iplmon_td_condition'},sub:[s]});
			return true;
		});
		return true;
	});
	view.innerHTML='';
	view.append(tbl);
}

function ipl_wait4ready(view,cbdone){

	return engine_launch(
		()=>{
			var r=ipl_isready();
			if(view)ipl_monitor(view);
			return !r;
		},
		()=>{
			if(cbdone)cbdone();
		},
	);
}

start_engine();
//ipl_wakeup();
