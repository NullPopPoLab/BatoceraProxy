// ‡ HTTP Client
const http=require('http');
const https=require('https');
const stream=require('stream').Transform;
//const path=require('path');
//const mime=require('mime/lite');

function request_context(sys,method,secure,url,send,cbrecv,cbok,cbng,opt={}){

	var rqw={
		done:false,
		aborted:false,
		err:null,
		sys:sys,
		method:method,
		secure:secure,
		url:url,
		send:send,
		cbrecv:cbrecv,
		cbok:cbok,
		cbng:cbng,
		opt:opt,

		abort:()=>{
			if(rqw.aborted)return;
			rqw.aborted=true;
			if(!rqw.err)rqw.err={code:0,msg:'Aborted'}
			if(rqw.cbng)rqw.cbng(rqw.err);
		},
	}
	return rqw;
}

function request_start(rqw){

	var end=false;
	var type=(rqw.opt.headers)?rqw.opt.headers['Content-Type']:'';
	rqw.sys.log_debug('(req) '+rqw.method+' '+rqw.url+(type?(' ('+type+')'):''));

	var scheme=rqw.secure?https:http;
	var opt=Object.assign({method:rqw.method},rqw.opt);
	var req=scheme.request(rqw.url,opt,(res)=>{
		if(end)return;
		res.on('data',(d)=>{
			if(rqw.end)return;
			if(rqw.cbrecv)rqw.cbrecv(d);
		});
		res.on('error',(e)=>{
			rqw.sys.log_fatal(e);
			if(rqw.end)return;
			rqw.end=true;
			if(rqw.cbng)rqw.cbng(e);
		});
		res.on('end',()=>{
			if(rqw.end)return;
			rqw.end=true;
			if(rqw.cbok)rqw.cbok(res);
		});
	});
	for(var x of ['error','timeout','uncaughtException']){
		req.on(x,(e)=>{
			rqw.sys.log_fatal(e);
			if(rqw.end)return;
			rqw.end=true;
			if(rqw.cbng)rqw.cbng(e);
		});
	}
	if(rqw.send){
		if(rqw.end)return;
		if(rqw.readableLength<1)return;
		try{
			var v=rqw.send.read();
			req.write(v);
		}
		catch(e){
			rqw.sys.log_fatal(e);
			if(rqw.end)return;
			rqw.end=true;
			if(rqw.cbng)rqw.cbng(e);
		}
	}
	req.end();
}

function controller_new(sys,opt={}){

	var ctl={
		end:false,
		sys:sys,
		secure:opt.secure??false,
		base:opt.base??'',
		limit:opt.limit??null,
		interval:opt.interval??500,
		wip:[],
		queue:[],
		proc:sys.launch(()=>controller_poll(ctl),()=>controller_abort(ctl)),

		abort:()=>{
			ctl.proc.abort();
		},

		get:(urlsuf,cbrecv,cbok,cbng,opt={})=>{
			ctl.queue.push(request_context(
				sys,'GET',ctl.secure,ctl.base+urlsuf,null,
				cbrecv,cbok,cbng,opt
			));
		},
		proxy_get:(urlsuf,req,res,opt={})=>{
			var recv=new stream();
			ctl.queue.push(request_context(
				sys,'GET',ctl.secure,ctl.base+urlsuf,null,
				(data)=>proxy_recv(ctl,res,data,recv),
				(res2)=>proxy_ok(ctl,res,res2,recv),
				(err2)=>proxy_ng(ctl,res,err2),
				opt,
			));
		},

		post:(urlsuf,data,cbrecv,cbok,cbng,opt={})=>{
			var send=new stream();
			send.push(data);
			ctl.queue.push(request_context(
				sys,'POST',ctl.secure,ctl.base+urlsuf,send,
				cbrecv,cbok,cbng,opt
			));
		},
		proxy_post:(urlsuf,req,res,opt={})=>{
			var send=new stream();
			var recv=new stream();
			req.on('data',(d)=>{
				send.push(d);
			});
			req.on('error',(e)=>{
				res.writeHead(500,{'Content-Type':'application/json'});
				res.end(JSON.stringify({error:e}));
			});
			req.on('end',()=>{
				opt.headers=req.headers;
				ctl.queue.push(request_context(
					sys,'POST',ctl.secure,ctl.base+urlsuf,send,
					(data)=>proxy_recv(ctl,res,data,recv),
					(res2)=>proxy_ok(ctl,res,res2,recv),
					(err2)=>proxy_ng(ctl,res,err2),
					opt,
				));
			});
		},

		delete:(urlsuf,cbrecv,cbok,cbng,opt={})=>{
			ctl.queue.push(request_context(
				sys,'DELETE',ctl.secure,ctl.base+urlsuf,null,
				cbrecv,cbok,cbng,opt
			));
		},
		proxy_delete:(urlsuf,req,res,opt={})=>{
			var recv=new stream();
			ctl.queue.push(request_context(
				sys,'DELETE',ctl.secure,ctl.base+urlsuf,null,
				(data)=>proxy_recv(ctl,res,data,recv),
				(res2)=>proxy_ok(ctl,res,res2,recv),
				(err2)=>proxy_ng(ctl,res,err2),
				opt,
			));
		},
	}
	ctl.last_launched=Date.now()-ctl.interval;
	return ctl;
}

function controller_poll(ctl){

	if(ctl.end)return false;

	var cont=[]
	for(var rqw of ctl.wip){
		if(rqw.end)continue;
		cont.push(rqw);
	}
	ctl.wip=cont;

	while(ctl.queue.length>0){
		if(ctl.limit!==null && ctl.wip.length>=ctl.limit)break;
		if(Date.now()<ctl.last_launched+ctl.interval)break;
		var rqw=ctl.queue.shift();
		ctl.wip.push(rqw);
		request_start(rqw);
	}

	return true;
}
function controller_abort(ctl){

	if(ctl.end)return;
	ctl.end=true;

	for(var proc of ctl.wip)proc.abort();
	for(var proc of ctl.queue)proc.abort();

	ctl.sys.log_info('end of client controller');
}

function proxy_recv(ctl,res,data,recv){

	recv.push(data);
}
function proxy_ok(ctl,res,res2,recv){

	var hd={}
	var len=res2.headers['content-length'];
	if(len)hd['Content-Length']=len;
	hd['Content-Type']=res2.headers['content-type']??'application/octet-stream';
	res.writeHead(res2.statusCode,res2.headers);
	res.end(recv.read());
}
function proxy_ng(ctl,res,err){

	res.writeHead(500,{'Content-Type':'application/json'});
	res.end(JSON.stringify({error:err}));
}

var mif={

	create_controller:(sys,opt={})=>{
		var ctl=controller_new(sys,opt);

		sys.launch(
			()=>controller_poll(ctl),
			null,
			()=>controller_abort(ctl)
		);

		return ctl;
	},
}

module.exports=mif;
