// † EmulationStation NullPopPoCustom † //
// required: 1stkit.js

function http_request_context(cbreq,cbok,cbng){

	var rqc={
		done:false,
		end:false,
		err:null,
		req:null,
		cbreq:cbreq,
		cbok:cbok,
		cbng:cbng,

		progress:()=>{
			return rqc.req?rqc.req.progress:0.0;
		},

		abort:()=>{
			if(rqc.end)return;
			rqc.end=true;
			if(rqc.req)rqc.req.abort();
			if(!rqc.err)rqc.err=error_msg('Aborted');
			if(rqc.cbng)rqc.cbng(rqc.err);
		},
	}
	return rqc;
}

function http_respond_ok(rqc,data){
	if(rqc.end)return rqc.end;
	rqc.end=true;
	rqc.done=true;
	if(rqc.cbok)rqc.cbok(data);
}

function http_respond_ng(rqc,err){
	if(rqc.end)return rqc.end;
	rqc.end=true;
	if(!rqc.err)rqc.err=err;
	if(rqc.cbng)rqc.cbng(err);
}

function http_controller_new(opt={}){
	var count_ok=0;
	var count_ng=0;

	var ctrl={
		end:false,
		secure:opt.secure??false,
		base:opt.base??'',
		limit:opt.limit??null,
		interval:opt.interval??100,
		wip:[],
		queue:[],
		cbprg:[],
		cbend:[],
		proc:engine_launch(()=>http_controller_poll(ctrl),()=>http_controller_abort(ctrl)),

		count_ok:()=>{return count_ok;},
		count_ng:()=>{return count_ng;},
		count_all:()=>{return count_ok+count_ng+ctrl.wip.length+ctrl.queue.length;},
		count_reset:()=>{
			count_ok=0;
			count_ng=0;
		},
		is_ng:()=>{return count_ng>0;},
		is_ok:()=>{return count_ng<1 && ctrl.wip.length<1 && ctrl.queue.length<1;},
		progress:()=>{
			var d=ctrl.count_all();
			if(d<1)return 1.0;
			var m=ctrl.count_ok();
			for(var rqc of ctrl.wip){
				// todo: rqc progress 
			}
			return m/d;
		},

		abort:()=>{
			if(ctrl.end)return;
			ctrl.end=true;
			ctrl.proc.abort();
			for(var rqc of ctrl.wip)rqc.abort();
			for(var rqc of ctrl.queue)rqc.abort();
			ctrl.wip=[]
			count_ng+=ctrl.queue.length;
			ctrl.queue=[]
			for(var cb of ctrl.cbend)cb();
			ctrl.cbend=[]
			ctrl.cbprg=[]
		},
		sync:(cbp,cbe)=>{
			if(ctrl.end){
				if(cbe)cbe();
				return;
			}
			if(cbp)ctrl.cbprg.push(cbp);
			if(cbe)ctrl.cbend.push(cbe);
		},

		makeurl:(path)=>{
			if(!ctrl.base)return path;
			var scheme=ctrl.secure?'https':'http';
			return scheme+'://'+ctrl.base+path;
		},

		get_text:(path,cbok=null,cbng=null,opt={})=>{
			var url=ctrl.makeurl(path);
			var rqc=http_request_context(
				()=>http_get_text(url,
					(data)=>respond_ok(rqc,data),
					(err)=>respond_ng(rqc,err),
					opt
				),
				cbok,cbng
			);
			ctrl.queue.push(rqc);
			if(ctrl.end)rqc.abort();
			return rqc;
		},
		get_blob:(path,cbok=null,cbng=null,opt={})=>{
			var url=ctrl.makeurl(path);
			var rqc=http_request_context(
				()=>http_get_blob(url,
					(data)=>respond_ok(rqc,data),
					(err)=>respond_ng(rqc,err),
					opt
				),
				cbok,cbng
			);
			ctrl.queue.push(rqc);
			if(ctrl.end)rqc.abort();
			return rqc;
		},
		get_buf:(path,cbok=null,cbng=null,opt={})=>{
			var url=ctrl.makeurl(path);
			var rqc=http_request_context(
				()=>http_get_buf(url,
					(data)=>respond_ok(rqc,data),
					(err)=>respond_ng(rqc,err),
					opt
				),
				cbok,cbng
			);
			ctrl.queue.push(rqc);
			if(ctrl.end)rqc.abort();
			return rqc;
		},
		get_json:(path,cbok=null,cbng=null,opt={})=>{
			var url=ctrl.makeurl(path);
			var rqc=http_request_context(
				()=>http_get_json(url,
					(data)=>respond_ok(rqc,data),
					(err)=>respond_ng(rqc,err),
					opt
				),
				cbok,cbng
			);
			ctrl.queue.push(rqc);
			if(ctrl.end)rqc.abort();
			return rqc;
		},
		get_xml:(path,cbok=null,cbng=null,opt={})=>{
			var url=ctrl.makeurl(path);
			var rqc=http_request_context(
				()=>http_get_xml(url,
					(data)=>respond_ok(rqc,data),
					(err)=>respond_ng(rqc,err),
					opt
				),
				cbok,cbng
			);
			ctrl.queue.push(rqc);
			if(ctrl.end)rqc.abort();
			return rqc;
		},

		post_text:(path,text,cbok=null,cbng=null,opt={})=>{
			var url=ctrl.makeurl(path);
			var rqc=http_request_context(
				()=>http_post_text(url,text,
					(data)=>respond_ok(rqc,data),
					(err)=>respond_ng(rqc,err),
					opt
				),
				cbok,cbng
			);
			ctrl.queue.push(rqc);
			if(ctrl.end)rqc.abort();
			return rqc;
		},
		post_json:(path,json,cbok=null,cbng=null,opt={})=>{
			var url=ctrl.makeurl(path);
			var rqc=http_request_context(
				()=>http_post_json(url,json,
					(data)=>respond_ok(rqc,data),
					(err)=>respond_ng(rqc,err),
					opt
				),
				cbok,cbng
			);
			ctrl.queue.push(rqc);
			if(ctrl.end)rqc.abort();
			return rqc;
		},
		post_file:(path,bin,file,cbok=null,cbng=null,opt={})=>{
			var url=ctrl.makeurl(path);
			var rqc=http_request_context(
				()=>http_post_file(url,bin,file,
					(data)=>respond_ok(rqc,data),
					(err)=>respond_ng(rqc,err),
					opt
				),
				cbok,cbng
			);
			ctrl.queue.push(rqc);
			if(ctrl.end)rqc.abort();
			return rqc;
		},

		delete:(path,cbok=null,cbng=null,opt={})=>{
			var url=ctrl.makeurl(path);
			var rqc=http_request_context(
				()=>http_delete(url,
					(data)=>respond_ok(rqc,data),
					(err)=>respond_ng(rqc,err),
					opt
				),
				cbok,cbng
			);
			ctrl.queue.push(rqc);
			return rqc;
		},
	}
	var respond_ok=(rqc,data)=>{
		++count_ok;
		http_respond_ok(rqc,data);
	}
	var respond_ng=(rqc,err)=>{
		++count_ng;
		http_respond_ng(rqc,err);
	}

	ctrl.last_launched=Date.now()-ctrl.interval;
	return ctrl;
}

function http_controller_poll(ctrl){

	if(ctrl.end)return false;

	var pf=false;
	var cont=[]
	for(var rqc of ctrl.wip){
		if(rqc.end)pf=true;
		else cont.push(rqc);
	}
	ctrl.wip=cont;

	while(ctrl.queue.length>0){
		if(ctrl.limit!==null && ctrl.wip.length>=ctrl.limit)break;
		if(Date.now()<ctrl.last_launched+ctrl.interval)break;
		pf=true;
		var rqc=ctrl.queue.shift();
		ctrl.wip.push(rqc);
		rqc.req=rqc.cbreq();
	}

	if(pf){
		for(var cb of ctrl.cbprg)cb();
	}
	if(ctrl.wip.length<1 && ctrl.cbend.length>0){
		var cbe=ctrl.cbend;
		ctrl.cbend=[]
		for(var cb of cbe)cb();
		ctrl.cbprg=[]
	}

	return true;
}

function http_controller_abort(ctrl){

	if(ctrl.end)return;
	ctrl.end=true;

	for(var proc of ctrl.wip)proc.abort();
	for(var proc of ctrl.queue)proc.abort();

	log_info('end of client controller');
}

function http_controller(opt={}){
	var ctrl=http_controller_new(opt);

	engine_launch(
		()=>http_controller_poll(ctrl),
		null,
		()=>http_controller_abort(ctrl)
	);

	return ctrl;
}

const http_client_ready=true;
