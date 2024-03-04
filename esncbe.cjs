// ‡ HTTP Proxy for Batocera.linux
const fs=require('fs');
//const qs = require('querystring');

const sys=require('./lib/syscommon.cjs');
const server=require('./lib/http_server.cjs');
const client=require('./lib/http_client.cjs');

sys.log_showable=sys.log_level.TRACE;

const runsig='now_running';

const config=JSON.parse(fs.readFileSync('config.json'));
const apibase=config.APIBase;

const controller=client.create_controller(sys,{
	base:apibase,
	limit:5,
});

function transfer(srv,purl,req,res){

	var path=purl.pathname;
	if(path=='/')path='/index.html';

	for(var p of ['fe'+path,'fe/resources/services'+path]){
		if(!fs.existsSync(p))continue;
		if(!fs.lstatSync(p).isFile())continue;
		console.log('[OK] File: '+p);
		server.transfer(res,p);
		return;
	}

	controller.proxy_get(purl.href,req,res);
}

function post_media(srv,purl,req,res){

	var sname=purl.pathstep[2]
	var gid=purl.pathstep[4]
	var mname=purl.pathstep[6]
	if(!mname){
		srv.cberr(res,403,'Forbidden');
		return;
	}

	if(purl.pathstep.length==7){
		controller.proxy_post('/systems/'+sname+'/games/'+gid+'/media/'+mname,req,res);
		return;
	}

	srv.cberr(res,403,'Forbidden');
}

function post_remove_media(srv,purl,req,res){

	var sname=purl.pathstep[2]
	var gid=purl.pathstep[4]
	var mname=purl.pathstep[6]
	if(!mname){
		srv.cberr(res,403,'Forbidden');
		return;
	}

	if(purl.pathstep.length==7){
		controller.proxy_post('/systems/'+sname+'/games/'+gid+'/remove_media/'+mname,req,res);
		return;
	}

	srv.cberr(res,403,'Forbidden');
}

function delete_media(srv,purl,req,res){

	var sname=purl.pathstep[2]
	var gid=purl.pathstep[4]
	var mname=purl.pathstep[6]
	if(!mname){
		srv.cberr(res,403,'Forbidden');
		return;
	}

	if(purl.pathstep.length==7){
		controller.proxy_delete('/systems/'+sname+'/games/'+gid+'/media/'+mname,req,res);
		return;
	}

	srv.cberr(res,403,'Forbidden');
}

function post_games(srv,purl,req,res){

	var sname=purl.pathstep[2]
	var gid=purl.pathstep[4]
	if(!gid){
		srv.cberr(res,403,'Forbidden');
		return;
	}

	if(purl.pathstep.length==5){
		controller.proxy_post('/systems/'+sname+'/games/'+gid,req,res);
		return;
	}

	if(purl.pathstep.length>6){
		return {
			level:5,
			route:{
				media:{POST:post_media},
				remove_media:{POST:post_remove_media},
			}
		}
	}

	srv.cberr(res,403,'Forbidden');
}

function delete_games(srv,purl,req,res){

	var sname=purl.pathstep[2]
	var gid=purl.pathstep[4]
	if(!gid){
		srv.cberr(res,403,'Forbidden');
		return;
	}

	if(purl.pathstep.length>6){
		return {
			level:5,
			route:{
				media:{DELETE:delete_media},
			}
		}
	}

	srv.cberr(res,403,'Forbidden');
}

function digg_systems(srv,purl,req,res){

	var sname=purl.pathstep[2]
	if(!sname){
		srv.cberr(res,403,'Forbidden');
		return;
	}

	if(purl.pathstep.length>4){
		return {
			level:3,
			route:{
				games:{
					POST:post_games,
					DELETE:delete_games
				},
			}
		}
	}

	srv.cberr(res,403,'Forbidden');
}

var route_root={
	caps:{GET:(srv,purl,req,res)=>controller.proxy_get(purl.href,req,res)},
	emukill:{GET:(srv,purl,req,res)=>controller.proxy_get(purl.href,req,res)},
	quit:{GET:(srv,purl,req,res)=>controller.proxy_get(purl.href,req,res)},
	restart:{GET:(srv,purl,req,res)=>controller.proxy_get(purl.href,req,res)},
	reloadgames:{GET:(srv,purl,req,res)=>controller.proxy_get(purl.href,req,res)},
	runningGame:{GET:(srv,purl,req,res)=>controller.proxy_get(purl.href,req,res)},
	systems:{
		GET:(srv,purl,req,res)=>controller.proxy_get(purl.href,req,res),
		POST:digg_systems,
		DELETE:digg_systems,
	},
	screenshots:{GET:(srv,purl,req,res)=>controller.proxy_get(purl.href,req,res)},
	music:{GET:(srv,purl,req,res)=>controller.proxy_get(purl.href,req,res)},
	splash:{GET:(srv,purl,req,res)=>controller.proxy_get(purl.href,req,res)},
	launch:{POST:(srv,purl,req,res)=>controller.proxy_post(purl.href,req,res)},
	notify:{POST:(srv,purl,req,res)=>controller.proxy_post(purl.href,req,res)},
	messagebox:{POST:(srv,purl,req,res)=>controller.proxy_post(purl.href,req,res)},
	'':{GET:transfer}
}

fs.writeFileSync(runsig,'');
var srv=server.setup(sys,config.ListeningPort,route_root);

var iid=setInterval(()=>{
	if(fs.existsSync(runsig))return;
	clearInterval(iid);
	srv.close();
	sys.shutdown();
},100);
