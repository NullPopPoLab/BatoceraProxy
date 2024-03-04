// † EmulationStation NullPopPoCustom † //
// API test //

ipl_modules.load('objview.js');
ipl_modules.load('metaedit.js');
ipl_modules.load('htmlut.js');
ipl_modules.load('es_client.js');
ipl_modules.load('mediatype.js');
ipl_modules.load('langsel.js');
ipl_modules.load('genres.js');
ipl_modules.load('confirming.js');
ipl_modules.load('mediaview.js');
ipl_modules.load('slideshow.js');
ipl_modules.load('jukebox.js');

const gamelist_pagenation=200;

var gamelist_sortid=0;

function crumbview(src,dst=null){

	var div=dst?dst:quickhtml({tag:'div'});
	safeobjectiter(src,(k,v)=>{
		var btn=quickhtml({
			target:div,
			tag:'button',
			sub:[k]
		});
		if(v){
			btn.onclick=v;
		}
		else{
			btn.setAttribute('disabled','disabled');
		}
		return true;
	});
	return div;
}

function callGet(main,path){

	var stg=main.monoq.stage(es_client.get_text(path,
	(data)=>{
		stg.show('Done');
	},
	(err)=>{
		stg.show(objview(err.getSource()));
	}));
}

function getText(main,path){

	var stg=main.monoq.stage(es_client.get_text(path,
	(data)=>{
		stg.show(data);
	},
	(err)=>{
		stg.show(objview(err.getSource()));
	}));
}

function callGetJSON(main,path,opt={}){

	var stg=main.monoq.stage(es_client.get_json(path,
	(data)=>{
		stg.show(objview(data));
	},
	(err)=>{
		stg.show(objview(err.getSource()));
	},opt));
}

function callGetCaps(main){

	var stg=main.monoq.stage(es_client.get_json('/caps',
	(data)=>{
		if(!data.Flags)data.Flags=es_caps.Flags;
		if(!data.Texts)data.Texts=es_caps.Texts;
		if(!data.Videos)data.Videos=es_caps.Videos;
		if(!data.Images)data.Images=es_caps.Images;
		es_caps=data;
		stg.show(objview(data));
	},
	(err)=>{
		stg.show(objview(err.getSource()));
	}));
}

function getAGame(main,sdata,gid){

	var sname=sdata.name;

	var url='/systems/'+sname+'/games/'+gid;
	var stg=main.monoq.stage(es_client.get_json(url,
	(data)=>{
		var div=quickhtml({tag:'div'});
		var crumb={}
		crumb['Systems']=()=>{callGetSystems(main);}
		crumb[sname]=()=>{callGetASystem(main,sname);}
		crumb['Games']=()=>{callGetGames(main,sdata);}
		if(booleanize(data.slideshowAvailable)){
			crumb['slideshow']=()=>{
				main.slideshow.open(url+'/res/slideshow/');
			}
		}
		if(booleanize(data.jukeboxAvailable)){
			crumb['jukebox']=()=>{
				main.jukebox.open(url+'/res/jukebox/');
			}
		}
		if(booleanize(data.docsAvailable)){
			crumb['document']=()=>{
			}
		}
		crumb['launch']=()=>{
			es_client.post_text('/launch',data.path);
		}
		crumbview(crumb,div);
		if(sname=='imageviewer'){
			div.append(quickhtml({
				tag:'fieldset',
				sub:[
					quickhtml({tag:'legend',sub:['Image']}),
					mediaview(es_client.makeurl(data.path.substring(9))),
				]
			}));
		}
		else{
			div.append(metaedit(data));
		}
		stg.show(div);
	},
	(err)=>{
		stg.show(objview(err.getSource()));
	}));
}

function callGetGames(main,sdata,page=0){

	var sname=sdata.name;

	var pgsuf='';
	if(gamelist_pagenation && es_caps.PartialGameList){
		pgsuf='_partial/'+(page*gamelist_pagenation)+'/'+gamelist_pagenation+'/'+gamelist_sortid;
	}

	var stg=main.monoq.stage(es_client.get_json('/systems/'+sname+'/games'+pgsuf,
	(data)=>{
		var div=quickhtml({tag:'div'});
		var div1=quickhtml({tag:'div',target:div});
		var crumb={}
		crumb['Systems']=()=>{callGetSystems(main);}
		crumb[sname]=()=>{callGetASystem(main,sname);}
		crumb['Export']=()=>{es_games_export(main.rightpane.view).exec(sdata);}
		crumbview(crumb,div1);

		es_games_import(div1).seton(div1,sdata);

		var div2=quickhtml({tag:'div',target:div});
		if(gamelist_pagenation && es_caps.PartialGameList){
			crumb={}
			var pages=Math.ceil(sdata.visibleGames/gamelist_pagenation);
			safestepiter(0,pages,1,(i)=>{
				crumb[i+1]=(i==page)?null:()=>{callGetGames(main,sdata,i);}
				return true;
			});
			crumbview(crumb,div2);
		}

		if(es_caps.GameSorts){
			var idxs=[]
			var sel=quickhtml({
				target:div2,
				tag:'select',
			});
			for(var i in es_caps.GameSorts){
				idxs.push(i);
				var attr={value:i}
				if(i==gamelist_sortid)attr.selected='selected';
				var opt=quickhtml({
					target:sel,
					tag:'option',
					attr:attr,
					sub:[es_caps.GameSorts[i]]
				});
			}
			sel.onchange=()=>{
				gamelist_sortid=idxs[sel.selectedIndex];
				callGetGames(main,sdata,page);
			}
		}

		safearrayiter(data,(gt)=>{
			var ov=objview(gt);
			var lg=quickhtml({target:ov,tag:'legend'});
			var btn=quickhtml({target:lg,tag:'button',sub:[gt.name]});
			btn.onclick=()=>getAGame(main,sdata,gt.id);
			div2.append(ov);
			return true;
		});

		stg.show(div);
	},
	(err)=>{
		stg.show(objview(err.getSource()));
	}));
}

function callGetScreenshots(main){

	var url='/screenshots';
	main.slideshow.open(url);
}

function callGetASystem(main,sname){

	var stg=main.monoq.stage(es_client.get_json('/systems/'+sname,
	(data)=>{
		var div=quickhtml({tag:'div'});
		crumbview({
			'Systems':()=>{callGetSystems(main);},
			'Games':()=>{callGetGames(main,data);},
		},div);
		div.append(objview(data,sname));
		div.append(quickhtml({
			tag:'fieldset',
			sub:[
				quickhtml({tag:'legend',sub:['Logo']}),
				quickhtml({
					tag:'img',
					attr:{src:es_client.makeurl('/systems/'+sname+'/logo')},
					style:{'max-width':'100%'},
				})
			]
		}));
		stg.show(div);
	},
	(err)=>{
		stg.show(objview(err.getSource()));
	}));
}

function callGetSystems(main){

	var stg=main.monoq.stage(es_client.get_json('/systems',
	(data)=>{
		var div=quickhtml({tag:'div'});
		safearrayiter(data,(st)=>{
			var ov=objview(st);
			var lg=quickhtml({target:ov,tag:'legend'});
			var btn=quickhtml({target:lg,tag:'button',sub:[st.name]});
			btn.onclick=()=>callGetASystem(main,st.name);
			div.append(ov);
			return true;
		});
		stg.show(div);
	},
	(err)=>{
		stg.show(objview(err.getSource()));
	}));
}

function callNotify(main){

	var btn_n=quickhtml({tag:'button',sub:['Notify']});
	var btn_m=quickhtml({tag:'button',sub:['Message']});
	var form_n=quickhtml({tag:'input',attr:{type:'text'}});
	var form_m=quickhtml({tag:'textarea'});

	btn_n.onclick=()=>{
		es_client.post_text('/notify',form_n.value);
	}
	btn_m.onclick=()=>{
		es_client.post_text('/messagebox',form_m.value);
	}

	quickhtml({
		target:main.rightpane.view,
		tag:'fieldset',
		sub:[
			quickhtml({tag:'legend',sub:[btn_n]}),
			form_n
		]
	});

	quickhtml({
		target:main.rightpane.view,
		tag:'fieldset',
		sub:[
			quickhtml({tag:'legend',sub:[btn_m]}),
			form_m
		]
	});
}

function setupLeftPane(main){

	var ctrl={
		view:quickhtml({
			target:main.view,
			tag:'div',
			attr:{class:'leftpane'},
		}),
	}

	var testlist=[
		{caption:'Capability',func:()=>callGetCaps(main)},
		{caption:'Systems',func:()=>callGetSystems(main)},
		{caption:'Screenshots',func:()=>callGetScreenshots(main)},
		{caption:'Splash',func:()=>{main.slideshow.open('/splash');}},
		{caption:'Music',func:()=>{main.jukebox.open('/music');}},
		{caption:'JukeBox',func:()=>{main.jukebox.reopen();}},
		{caption:'RunningGame',func:()=>{
			return callGetJSON(main,'/runningGame',{
				cbgate:(res)=>{
					switch(res.status){
						case 200: return null;
						default:
						var j=null;
						try{
							j=JSON.parse(res.body);
						}
						catch(e){
							throw res;
						}
						throw j;
					}
				}
			});
		}},
		{caption:'ReloadGames',func:()=>callGet(main,'/reloadgames')},
		{caption:'Notify',func:()=>callNotify(main)},
		{caption:'EmuKill',func:()=>callGet(main,'/emukill')},
		{caption:'Restart',func:()=>callGet(main,'/restart')},
		{caption:'Quit',func:()=>callGet(main,'/quit')},
	]

	safearrayiter(testlist,(t)=>{
		var d1=quickhtml({
			target:ctrl.view,
			tag:'div'
		});
		var btn=quickhtml({
			target:d1,
			tag:'button',
			sub:[t.caption],
		});
		btn.onclick=t.func;
		return true;
	});

	return ctrl;
}

function setupRightPane(main){

	var ctrl={
		view:quickhtml({
			target:main.view,
			tag:'div',
			attr:{class:'rightpane'},
		})
	}

	return ctrl;
}

function runAPITest(view){

	es_init();

	var main={
		view:quickhtml({
			tag:'div',
			attr:{class:'mainboard'},
		}),
	}

	view.innerHTML='';
	view.append(main.view);
	main.view.innreHTML='';

	main.leftpane=setupLeftPane(main);
	main.rightpane=setupRightPane(main);
	main.monoq=es_monoq(main.rightpane.view),
	main.slideshow=slideshow_setup(main.view);
	main.jukebox=jukebox_setup(main.view);
}

const apitest_ready=true;
