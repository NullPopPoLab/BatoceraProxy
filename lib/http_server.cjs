// ‡ HTTP Server
const http=require('http');
const url=require('url');
const mime=require('mime/lite');
const fs=require('fs');
const path=require('path');

function server_new(sys,port,route){

	var srv={
		sys:sys,
		open:true,
		route:route,
		html_charset:'utf-8',
		cberr:default_cberr,
	}

	srv.close=()=>{
		if(!srv.open)return;
		srv.open=false;
		srv.inst.close();
		sys.log_info('end of server port '+port);
	}

	srv.inst=http.createServer((req,res)=>cbreq(srv,req,res));
	return srv;
}

function default_cberr(res,code,msg){
	res.writeHead(code,{'Content-Type':'text/plain'});
	res.end('['+code+'] '+msg);
}

function digg(srv,req,res,route,purl,idx){

	var n=purl.pathstep[idx]
	if(!route[n])n='';
	if(!route[n]){
		srv.cberr(res,404,'Not found');
		return;
	}

	var m=req.method;
	if(route[n][m]){
		var q=route[n][m](srv,purl,req,res);
		if(q){
			digg(srv,req,res,q.route,purl,q.level);
		}
	}
	else if(route[n]['']){
		digg(srv,req,res,route[n][''],purl,idx+1);
	}
	else{
		srv.cberr(res,405,'Not allowed');
	}
}

function cbreq(srv,req,res){

	try{
		var purl=url.parse(req.url,false);
		purl.pathstep=purl.pathname.split('/');
		if(purl.pathstep.length<1)purl.pathstep=['']
		else if(purl.pathstep[0]){
			srv.cberr(res,400,'Bad request');
			return;
		}
		digg(srv,req,res,srv.route,purl,1);
	}
	catch(e){
		srv.sys.log_fatal(e);
		srv.cberr(res,500,JSON.stringify({exeption:e}));
	}
}

var mif={
	transfer:(res,pathname,contenttype=null,charset=null)=>{

		var body=fs.readFileSync(pathname);

		var ext=path.extname(pathname);
		if(ext)ext=ext.substring(1);
		if(!contenttype)contenttype=mime.getType(ext);
		if(!contenttype)contenttype='apllication/octet-stream';
		else if(contenttype=='text/html'){
			if(!charset)charset=mif.html_charset;
			if(charset)contenttype+=';charset='+charset;
		}
		res.writeHead(200,{'Content-Type':contenttype});
		res.end(body);
	},

	setup:(sys,port,route)=>{

		var srv=server_new(sys,port,route);
		srv.inst.listen(port);
		sys.log_info('bgn of server port '+port);
		return srv;
	},
}

module.exports=mif;
