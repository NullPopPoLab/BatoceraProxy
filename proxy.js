// ‡ HTTP Proxy for Batocera.linux
const fs=require('fs');
const http=require('http');
const mime=require('mime/lite');
const path=require('path');
const url=require('url');
const qs = require('querystring');
const stream = require('stream').Transform;

const runsig='now_running';

const config=JSON.parse(fs.readFileSync('config.json'));
const apibase=config.APIBase;

function httpRequest(url,opt={},onsend=null,onrecv=null,onok=null,onng=null){

	var end=false;
	var type=(opt?.headers)?opt.headers['Content-Type']:'';
	console.log('(req) '+opt.method+': '+url+(type?(' ('+type+')'):''));

	var req=http.request(url,opt,(res)=>{
		if(end)return;
		res.on('data',(d)=>{
			if(end)return;
			if(onrecv)onrecv(d);
		});
		res.on('error',(e)=>{
			console.log(e);
			if(end)return;
			end=true;
			if(onng)onng(e);
		});
		res.on('end',()=>{
			if(end)return;
			end=true;
			if(onok)onok(res);
		});
	});
	for(var x of ['error','timeout','uncaughtException']){
		req.on(x,(e)=>{
			console.log(e);
			if(end)return;
			end=true;
			if(onng)onng(e);
		});
	}
	if(onsend){
		var v=onsend();
		if(v)req.write(v);
	}
	req.end();
}

function act_get_call(u,req,res){

	var u2=apibase+u.href;
	var opt={method:'GET'}
	var body2=new stream();
	httpRequest(u2,opt,null,(data)=>{
		body2.push(data);
	},(res2)=>{
		console.log('[OK] '+u2);
		res.writeHead(res2.statusCode,{'Content-Type':res2.headers['content-type']??'application/octet-stream'});
		res.end(body2.read());
	},(err2)=>{
		console.log('[NG] '+u2);
		console.log(err2);
		res.writeHead(500,{'Content-Type':'application/json'});
		res.end(JSON.stringify({error:err2}));
	});
}

function act_post_call(u,req,res){

	var body1=new stream();
	var body2=new stream();
	req.on('data',(d)=>{
		body1.push(d);
	});
	req.on('error',(e)=>{
		res.writeHead(500,{'Content-Type':'application/json'});
		res.end(JSON.stringify({error:e}));
	});
	req.on('end',()=>{
		var u2=apibase+u.href;
		var opt={
			method:'POST',
			headers:{
			'Content-Type':req.headers['content-type']??'application/octet-stream',
			'Content-Length':body1.readableLength,
		}}
		httpRequest(u2,opt,()=>{
			return body1.read();
		},(data)=>{
			body2.push(data);
		},(res2)=>{
			console.log('[OK] '+u2);
			res.writeHead(200,{'Content-Type':res2.headers['content-type']??'application/octet-stream'});
			res.end(body2.read());
		},(err2)=>{
			console.log('[NG] '+u2);
			console.log(err2);
			res.writeHead(500,{'Content-Type':'application/json'});
			res.end(JSON.stringify({error:err2}));
		});
	});
}

function act_get_file(u,req,res){

	var p='fe'+u.pathname;
	for(var p of ['fe'+u.pathname,'fe/resources/services'+u.pathname]){
		if(!fs.existsSync(p))continue;
		console.log('[OK] File: '+p);
		var ext=path.extname(u.pathname);
		if(ext)ext=ext.substring(1);
		var ct=mime.getType(ext);
		if(!ct)ct='apllication/octet-stream';
		else if(ct=='text/html')ct+=';charset=utf-8;';
		res.writeHead(200,{'Content-Type':ct});
		res.end(fs.readFileSync(p));
		return;
	}

	act_get_call(u,req,res);
}

var api_get={
	caps:(u,req,res)=>act_get_call(u,req,res),
	emukill:(u,req,res)=>act_get_call(u,req,res),
	quit:(u,req,res)=>act_get_call(u,req,res),
	restart:(u,req,res)=>act_get_call(u,req,res),
	reloadgames:(u,req,res)=>act_get_call(u,req,res),
	runningGame:(u,req,res)=>act_get_call(u,req,res),
	systems:(u,req,res)=>act_get_call(u,req,res),
	screenshots:(u,req,res)=>act_get_call(u,req,res),
}

function act_get(u,req,res){

	var n=u.pathstep[1];
	if(api_get[n])api_get[n](u,req,res);
	else act_get_file(u,req,res);
}

function act_post_systems_games_meta(u,req,res){

	act_post_call(u,req,res);
}

function act_post_systems_games_media(u,req,res){

	if(!u.pathstep[6]){
		res.writeHead(403,{'Content-Type':'text/plain'});
		res.end('[NG] Target is Missing');
		return;
	}

	act_post_call(u,req,res);
}

function act_post_systems_games_remove_media(u,req,res){

	if(!u.pathstep[6]){
		res.writeHead(403,{'Content-Type':'text/plain'});
		res.end('[NG] Target is Missing');
		return;
	}

	act_post_call(u,req,res);
}

var api_post_systems_games={
	'':(u,req,res)=>act_post_systems_games_meta(u,req,res),
	media:(u,req,res)=>act_post_systems_games_media(u,req,res),
	remove_media:(u,req,res)=>act_post_systems_games_remove_media(u,req,res),
}

function act_post_systems_games(u,req,res){

	if(!u.pathstep[4]){
		res.writeHead(403,{'Content-Type':'text/plain'});
		res.end('[NG] Game is Missing');
		return;
	}

	var n=u.pathstep[5]??'';
	if(api_post_systems_games[n])api_post_systems_games[n](u,req,res);
	else{
		res.writeHead(405,{'Content-Type':'text/plain'});
		res.end('Not Allowed: POST');
	}
}

var api_post_systems={
	games:(u,req,res)=>act_post_systems_games(u,req,res),
}

function act_post_systems(u,req,res){

	if(!u.pathstep[2]){
		res.writeHead(403,{'Content-Type':'text/plain'});
		res.end('[NG] System is Missing');
		return;
	}

	var n=u.pathstep[3]??'';
	if(api_post_systems[n])api_post_systems[n](u,req,res);
	else{
		res.writeHead(405,{'Content-Type':'text/plain'});
		res.end('Not Allowed: POST');
	}
}

function act_post_save(u,req,res){

	var s='';
	req.on('data',(d)=>{
		s+=d;
	});
	req.on('error',(e)=>{
		res.writeHead(500,{'Content-Type':'application/json'});
		res.end(JSON.stringify({error:e}));
	});
	req.on('end',()=>{
		try{
			var q=JSON.parse(s);
			fs.writeFileSync(q.path,q.data);

			res.writeHead(200,{'Content-Type':'text/plain'});
			res.end('OK');
		}
		catch(e){
			res.writeHead(500,{'Content-Type':'application/json'});
			res.end(JSON.stringify({error:e}));
		}
	});
}

var api_post={
	launch:(u,req,res)=>act_post_call(u,req,res),
	messagebox:(u,req,res)=>act_post_call(u,req,res),
	notify:(u,req,res)=>act_post_call(u,req,res),
	systems:(u,req,res)=>act_post_systems(u,req,res),
	save:(u,req,res)=>act_post_save(u,req,res),
}

function act_post(u,req,res){
	var n=u.pathstep[1];
	if(api_post[n])api_post[n](u,req,res);
	else{
		res.writeHead(405,{'Content-Type':'text/plain'});
		res.end('Not Allowed: POST');
	}
}

var act_method={
	GET:(u,req,res)=>act_get(u,req,res),
	POST:(u,req,res)=>act_post(u,req,res),
}

var srv=http.createServer((req,res)=>{
	try{
		if(!act_method[req.method]){
			res.writeHead(405,{'Content-Type':'text/plain'});
			res.end('Not Allowed: '+req.method);
			return;
		}
		var u=url.parse(req.url,false);
		if(u.pathname=='/')u.pathname='/index.html';;
		u.pathstep=u.pathname.split('/');
		if(u.pathstep.length<2 || u.pathstep[0]){
			res.writeHead(400,{'Content-Type':'text/plain'});
			res.end('Illegal path');
			return;
		}
		act_method[req.method](u,req,res);
	}
	catch(e){
		console.log(e);
		res.writeHead(500,{'Content-Type':'application/json'});
		res.end(JSON.stringify({exeption:e}));
	}
});

fs.writeFileSync(runsig,'');
srv.listen(config.ListeningPort);

var iid=setInterval(()=>{
	if(fs.existsSync(runsig))return;
	clearInterval(iid);
	srv.close();
},100);
