// † EmulationStation NullPopPoCustom † //
// Client Common //

ipl_modules.load('http_client.js');
ipl_modules.load('monoq.js');
ipl_modules.load('xsv.js');

var es_client=null;
var es_resource={}
var es_tsvproc=null;

var es_caps={
	Version:'unknown (maybe official)',
	GenreLanguages:{
		'de':'Deutsch',
		'en':'English',
		'es':'Español',
		'fr':'Français',
		'ja':'日本語',
		'pt':'Português',
	},
	Flags:{
		'kidgame':"Kid's Game",
		'favorite':'Favorite',
		'hidden':'Hidden'
	},
	Texts:{},
	Books:{
		'manual':'Manual',
		'magazine':'Magazine'
	},
	Videos:{'video':'Video'},
	Images:{
		'thumbnail':'Box',
		'image':'Image',
		'titleshot':'Title shot',
		'bezel':'Bezel (16:9)',
		'marquee':'Logo',
		'boxart':'Alt Boxart',
		'boxback':'Box backside',
		'cartridge':'Cartridge',
		'wheel':'Wheel',
		'fanart':'Fan art',
		'mix':'Mix',
		'map':'Map',
	},
}

function es_date_format(val){

	if(!val)return '';
	var yp=0;
	var mp=4;
	var dp=6;
	switch(val.length){
		// YYYYMMDDThhmmss 
		case 8: case 15:
		break;

		// YYYY-MM-DDThh:mm:ss 
		case 10: case 19:
		mp+=1;
		dp+=2;
		break;

		default:
		return '';
	}

	var y=parseInt(val.substring(yp,yp+4));
	if(isNaN(y))return '';
	var m=parseInt(val.substring(mp,mp+2));
	if(isNaN(m))return '';
	var d=parseInt(val.substring(dp,dp+2));
	if(isNaN(d))return '';
	return [y,m,d]
}

function es_date_short(val){
	val=es_date_format(val);
	if(!val)return '';

	return zerofill(''+val[0],4)+zerofill(val[1],2)+zerofill(val[2],2);
}

function es_seconds(val){

	if(isNaN(val))return '';

	var h=Math.floor(val/3600);
	val-=h*3600;
	var m=Math.floor(val/60);
	val-=m*60;
	var s=Math.floor(val);
	return ''+h+':'+zerofill(m,2)+':'+zerofill(s,2);
}

function es_date(val){
	val=es_date_format(val);
	if(!val)return '';

	return zerofill(''+val[0],4)+'-'+zerofill(val[1],2)+'-'+zerofill(val[2],2);
}

function es_datetime(val){
	var date=es_date(val);
	if(!date)return '';

	var tp=8;
	var hp=9;
	var ip=11;
	var sp=13;
	switch(val.length){
		// YYYYMMDDThhmmss 
		case 8: case 15:
		break;

		// YYYY-MM-DDThh:mm:ss 
		case 10: case 19:
		tp+=2;
		hp+=2;
		ip+=3;
		sp+=4;
		break;

		default:
		return date;
	}

	if(val.substring(tp,tp+1)!='T')return date;

	var h=parseInt(val.substring(hp,hp+2));
	if(isNaN(h))return date;
	var i=parseInt(val.substring(ip,ip+2));
	if(isNaN(i))return date;
	var s=parseInt(val.substring(sp,sp+2));
	if(isNaN(s))return date;

	return date+' '+zerofill(h,2)+':'+zerofill(i,2)+':'+zerofill(s,2);
}

function es_games_export(target){

	var errview=(err)=>{
		var div=quickhtml({tag:'div'});
		quickhtml({
			target:div,
			tag:'div',
			sub:[err.toString()]
		});
		var btn=quickhtml({
			target:div,
			tag:'button',
			sub:['Cancel']
		});
		btn.onclick=()=>{
			ctrl.view.close();
		}
		return div;
	}

	var ctrl={
		view:quickhtml({
			target:target,
			tag:'dialog',
			attr:{class:'dialog'},
		}),

		exec:(sdata,cbdone)=>{
			var monoq=es_monoq(ctrl.view);
			ctrl.view.showModal();

			var sname=sdata.name;
			var req=es_client.get_json('/systems/'+sname+'/games',(data)=>{

				stg.show('');
				var tsv=xsv_export_full(data,tsvproc);
				var blob=new Blob([tsv],{type:'text/tab-separated-values'});

				var saver=quickhtml({
					target:ctrl.view,
					tag:'a',
				});
				saver.href=URL.createObjectURL(blob);
				saver.download=sname+'.tsv';
				saver.click();
				ctrl.view.close();
				if(cbdone)cbdone();
			},
			(err)=>{
				stg.show(errview(err.toString()));
			});
			var stg=monoq.stage(req);
		}
	}
	return ctrl;
}

function es_games_import(target){

	var showerr=(err,filebtn)=>{
		ctrl.view.innerHTML='';
		quickhtml({
			target:ctrl.view,
			tag:'div',
			sub:[err.toString()]
		});
		var btn=quickhtml({
			target:ctrl.view,
			tag:'button',
			sub:['End']
		});
		btn.onclick=()=>{
			ctrl.view.close();
			filebtn.show();
		}
	}

	var ctrl={
		view:quickhtml({
			target:target,
			tag:'dialog',
			attr:{class:'dialog'},
		}),

		seton:(target,sdata)=>{
			var opt=({
				target:target,
				filter:'.tsv',
				caption_select:'Import',
				cbselect:(ctrl2,files)=>{
					var path=files[0].name;
					ctrl.view.innerHTML=path;
					btn.confirm();
				},
				cbcancel:(ctrl2,files)=>{
					ctrl.view.close();
					btn.show();
				},
				cbexec:(ctrl2,files)=>{
					var prgbar=es_progress(ctrl.view,()=>{
						http.abort();
					});

					ctrl.view.showModal();
	
					var http=http_controller({
						secure:es_client.secure,
						base:es_client.base,
						limit:10,
						interval:25,
					});
					var fr=new FileReader();
					fr.onerror=()=>{
						showerr(fr.error,btn);
					}
					fr.onload=()=>{
						var data=xsv_import_full(fr.result,tsvproc);
						if(!data){
							showerr('format error',btn);
						}
						else{
							var sname=sdata.name;
							for(var row of data){
								if(sname!=row.systemName)continue;
								var gid=row.id;
								var dst={}
								for(var k in row){
									if(k=='id')continue;
									if(k=='path')continue;
									if(k=='systemName')continue;
									dst[k]=row[k];
								}

								var url='/systems/'+sname+'/games/'+gid;
								http.post_json(url,dst);
							}
							http.sync(
								()=>{
									prgbar.value=http.progress();
								},
								()=>{
									if(http.is_ng()){
										showerr(''+http.count_ng()+' entries failure',btn);
									}
									else{
										ctrl.view.close();
										btn.show();
									}
								}
							);
						}
					}
					fr.readAsText(files[0]);
				},
			});
			var btn=htmlut_filebutton(opt);
		}
	}

	return ctrl;
}

function es_progress(view,cbabort=null){

	view.innerHTML='';
	quickhtml({
		target:view,
		tag:'div',
		sub:['Wait for it...']
	});
	var prgbar=quickhtml({
		target:view,
		tag:'meter',
		attr:{value:0,min:0,max:1},
		style:{width:'100%'},
	});
	var panel=quickhtml({
		target:view,
		tag:'div',
	});
	var btn=quickhtml({
		target:panel,
		tag:'button',
		sub:['Cancel']
	});
	btn.onclick=()=>{
		if(cbabort)cbabort();
	}

	return prgbar;
}

function es_monoq(view){

	var mq=monoq_setup();

	var ctrl={
		abort:()=>{
			mq.abort();
		},
		stage:(req,cbdone=null,cbdrop=null,user={})=>{
			var act=mq.push(
			(user)=>{
				if(cbdone)cbdone(user);
			},
			(user)=>{
				req.abort();
				if(cbdrop)cbdrop(user);
			},user);

			var prgbar=es_progress(view,()=>{
				ctrl.abort();
			});

			engine_launch(()=>{
				if(act.end)return false;
				if(req.end)return false;
				prgbar.value=req.progress();
				return true;
			},null,null);

			var stg={
				abort:()=>{
					act.abort();
				},
				show:(content)=>{
					if(act.end)return false;
					view.innerHTML='';
					view.append(content);
					act.finish();
					return true;
				},
			}
			return stg;
		},
	}
	return ctrl;
}

function es_init(){

	es_client=http_controller({
		secure:false,
		base:'',
		limit:5,
		interval:100,
	});

	tsvproc={
		ID:xsv_proc_string('id'),
		Platform:xsv_proc_string('systemName'),
		Path:{
			key:'path',
			export:(row,key)=>{
				var v=row[key];
				if(!v)return '';
				return v.substring(16+row.systemName.length);
			},
			import:(row,key,val)=>{
				// for index 
				// don't import 
				return true;
			},
		},
		Powered:xsv_proc_string('arcadesystemname'),
		Caption:xsv_proc_string('name'),
		Title:xsv_proc_string('title'),
		Sortable:xsv_proc_string('sortname'),
		Family:xsv_proc_string('family'),
		Rating:{
			key:'rating',
			export:(row,key)=>{
				var v=row[key];
				if(!v)return '';
				var n=Math.floor(v*5+0.5);
				return n;
			},
			import:(row,key,val)=>{
				var n=parseInt(val);
				if(n>5)n=5;
				row[key]=ratingscore[n];
				return true;
			},
		},
		Runa:xsv_proc_bool('runable',{import_true:'true',import_false:'false'}),
		Favo:xsv_proc_bool('favorite',{import_true:'true',import_false:'false'}),
		Hide:xsv_proc_bool('hidden',{import_true:'true',import_false:'false'}),
		Kids:xsv_proc_bool('kidgame',{import_true:'true',import_false:'false'}),
		Reg:xsv_proc_string('region'),
		Lang:xsv_proc_string('lang'),
		Date:xsv_proc_string('releasedate'),
		Developer:xsv_proc_string('developer'),
		Publisher:xsv_proc_string('publisher'),
		Players:xsv_proc_string('players'),
	}

	es_resource.star0=es_client.makeurl('/resources/star_unfilled.svg');
	es_resource.star1=es_client.makeurl('/resources/star_filled.svg');
}

const es_client_ready=true;