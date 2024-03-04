// † EmulationStation NullPopPoCustom † //
// GUI main //

ipl_modules.load('htmlut.js');
ipl_modules.load('es_client.js');
ipl_modules.load('metaedit.js');
ipl_modules.load('slideshow.js');
ipl_modules.load('jukebox.js');

const gamelist_pagenation=200;
var gamelist_sortid=0;

const system_grouping={
	'byname':{
		capt:'by Name',
		sort:(a,b)=>{return (a.fullname<b.fullname)?-1:1},
		group:null,
	},
	'played':{
		capt:'Played Games',
		sort:(a,b)=>{return (a.playedGames>b.playedGames)?-1:1},
		group:null,
	},
	'haven':{
		capt:'Haven Games',
		sort:(a,b)=>{return (a.totalGames>b.totalGames)?-1:1},
		group:null,
	},
	'byyear':{
		capt:'by Year',
		sort:null,
		group:(dst,hw)=>{
			var k=hw.releaseYear??'_unknown_';
			if(dst[k])dst[k].push(hw);
			else dst[k]=[hw]
		},
	},
	'type':{
		capt:'System Types',
		sort:null,
		group:(dst,hw)=>{
			var k=hw.hardwareType??'_unknown_';
			if(dst[k])dst[k].push(hw);
			else dst[k]=[hw]
		},
	},
	'manufacturer':{
		capt:'Manufacturers',
		sort:null,
		group:(dst,hw)=>{
			var k=hw.manufacturer??'_unknown_';
			if(dst[k])dst[k].push(hw);
			else dst[k]=[hw]
		},
	},
}

function showPageBar(target,main,sdata,page){

	var pagebar=quickhtml({
		target:target,
		tag:'div',
	});
	if(gamelist_pagenation && es_caps.PartialGameList){
		var pages=Math.ceil(sdata.visibleGames/gamelist_pagenation);
		safestepiter(0,pages,1,(i)=>{
			var btn=quickhtml({
				target:pagebar,
				tag:'button',
				sub:[i+1]
			});
			if(i==page)btn.disabled=true;
			else btn.onclick=()=>{updateGameList(main,sdata,i);}
		});
	}
	if(es_caps.GameSorts){
		var idxs=[]
		var sel=quickhtml({
			target:pagebar,
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
			updateGameList(main,sdata,page);
		}
	}
}

function showMetaDialog(target,gdata,cbclose){

	target.innerHTML='';
	var top=quickhtml({
		target:target,
		tag:'div',
		attr:{class:'metaedit_top_right'},
	});
	var btn=quickhtml({
		target:top,
		tag:'button',
		attr:{class:'metaedit_dialog_close'},
		sub:['X']
	});
	btn.onclick=()=>{
		target.close();
		if(cbclose)cbclose();
	}
	target.append(metaedit(gdata));
	target.showModal();
}

function updateGameList(main,sdata,page=0){

	var sname=sdata.name;

	var pgsuf='';
	if(gamelist_pagenation>0 && es_caps.PartialGameList){
		pgsuf='_partial/'+(page*gamelist_pagenation)+'/'+gamelist_pagenation+'/'+gamelist_sortid;
	}

	var stg=main.monoq.stage(es_client.get_json('/systems/'+sname+'/games'+pgsuf,
	(ginfo)=>{
		var div=quickhtml({tag:'div',attr:{class:'gamelisview'}});

		quickhtml({
			target:div,
			tag:'div',
			sub:[quickhtml({
				tag:'img',
				attr:{src:sdata.logo,alt:sdata.fullname,class:'systemicon'},
			})],
		});

		var dialog_meta=quickhtml({
			target:div,
			tag:'dialog',
			attr:{class:'metaedit_dialog'},
		});
		var dialog_docs=quickhtml({
			target:div,
			tag:'dialog',
			attr:{class:'docs_dialog'},
		});

		var toolbar=quickhtml({
			target:div,
			tag:'div',
		});
		quickhtml({
			target:toolbar,
			tag:'button',
			sub:['Export']
		}).onclick=()=>{
			es_games_export(toolbar).exec(sdata);
		}
		es_games_import(toolbar).seton(toolbar,sdata);

		showPageBar(div,main,sdata,page);

		var tbl=quickhtml({
			target:div,
			tag:'table',
			attr:{class:'gamelist_table',align:'center'},
		});
		var tr=quickhtml({
			target:tbl,
			tag:'tr',
			attr:{class:'gamelist_thr'},
		});
		var cols={
			'Name':{'style':'str','view':(gdata,vset)=>gdata.name},
			'System':{'style':'str','view':(gdata,vset)=>gdata.systemName},
			'Count':{'style':'num','view':(gdata,vset)=>gdata.playcount},
			'Total Time':{'style':'num','view':(gdata,vset)=>es_seconds(gdata.gametime??'')},
			'Last Played':{'style':'num','view':(gdata,vset)=>es_datetime(gdata.lastplayed??'')},
			'Rating':{'style':'str','view':(gdata,vset)=>{
				return vset.stars.view;
			}},
			'Etc':{'style':'str','view':(gdata,vset)=>{
				var tdv=quickhtml({tag:'div'});
				var btns=quickhtml({target:tdv,tag:'div'});
				var note=quickhtml({target:tdv,tag:'div'});

				btns.append(vset.favobtn.view);
				btns.append(vset.hidebtn.view);
				quickhtml({
					target:btns,
					tag:'button',
					sub:['Meta']
				}).onclick=()=>{
					showMetaDialog(dialog_meta,gdata,()=>{
						vset.favobtn.lock(booleanize(gdata.favorite));
						vset.hidebtn.lock(booleanize(gdata.hidden));
						vset.stars.set(gdata.rating);
					});
				}
				if(booleanize(gdata.jukeboxAvailable)){
					quickhtml({
						target:btns,
						tag:'button',
						sub:['Mus']
					}).onclick=()=>{
						var url='/systems/'+gdata.systemName+'/games/'+gdata.id;
						main.jukebox.open(url+'/res/jukebox/');
					}
				}
				if(booleanize(gdata.slideshowAvailable)){
					quickhtml({
						target:btns,
						tag:'button',
						sub:['Pic']
					}).onclick=()=>{
						var url='/systems/'+gdata.systemName+'/games/'+gdata.id;
						main.slideshow.open(url+'/res/slideshow/');
					}
				}
				if(booleanize(gdata.docsAvailable)){
					quickhtml({
						target:btns,
						tag:'button',
						sub:['Doc']
					}).onclick=()=>{
						dialog_docs.innerHTML='';
						var top=quickhtml({
							target:dialog_docs,
							tag:'div',
							attr:{class:'metaedit_top_right'},
						});
						var btn=quickhtml({
							target:top,
							tag:'button',
							attr:{class:'metaedit_dialog_close'},
							sub:['X']
						});
						btn.onclick=()=>{
							dialog_docs.close();
						}
						var url='/systems/'+gdata.systemName+'/games/'+gdata.id+'/res/';

						es_client.get_json(url+'docs.json',
						(data)=>{
							for(var k in data){
								if(k=='')continue;
								var path=encodeURI(data[k]);
								quickhtml({
									target:dialog_docs,
									tag:'div',
									sub:[quickhtml({
										tag:'a',
										attr:{target:'_blank',href:(path.indexOf(':')<0)?(url+path):path},
										sub:[k],
									})]
								});
							}
						},
						(err)=>{
							dialog_docs.append(err.toString());
						});

						dialog_docs.showModal();
					}
				}

				htmlut_confirmbutton({
					phasing:false,
					target:btns,
					target_notice:note,
					caption_first:'Launch',
					cbexec:(ctrl,view)=>{
						es_client.post_text('/launch',gdata.path);
						ctrl.show();
					},
				});
				return tdv;
			}},
		}
		for(var cc in cols){
			quickhtml({
				target:tr,
				tag:'th',
				attr:{class:'gamelist_th'},
				sub:[cc]
			});
		}

		safearrayiter(ginfo,(gdata)=>{
			var tr=quickhtml({
				target:tbl,
				attr:{class:'gamelist_tdr'},
				tag:'tr',
			});
			var vset={
				notice:quickhtml({
					tag:'td',
					attr:{colspan:cols.length,class:'gamelist_tdn'}
				}),
				stars:metaedit_stars(null,gdata.rating??0.0,(score)=>{
					var url='/systems/'+gdata.systemName+'/games/'+gdata.id;
					es_client.post_json(url,{rating:score},
						(d2)=>{
							gdata.rating=score;
						},
						(err)=>{
							vset.notice.innerHTML=err.toString();
						}
					);
				}),
				favobtn:htmlut_lockbutton({
					tag:'button',
					caption:'Favo',
					class_off:'btn_normal',
					class_on:'btn_favorite',
					init:booleanize(gdata.favorite),
					cbchange:(side)=>{
						var url='/systems/'+gdata.systemName+'/games/'+gdata.id;
						es_client.post_json(url,{favorite:side?'true':'false'},
							(d2)=>{
								vset.favobtn.lock(side);
								gdata.favorite=side?'true':'false';
							},
							(err)=>{
								vset.notice.innerHTML=err.toString();
							}
						);
					},
				}),
				hidebtn:htmlut_lockbutton({
					tag:'button',
					caption:'Hide',
					class_off:'btn_normal',
					class_on:'btn_hidden',
					init:booleanize(gdata.hidden),
					cbchange:(side)=>{
						var url='/systems/'+gdata.systemName+'/games/'+gdata.id;
						es_client.post_json(url,{hidden:side?'true':'false'},
							(d2)=>{
								vset.hidebtn.lock(side);
								gdata.hidden=side?'true':'false';
							},
							(err)=>{
								vset.notice.innerHTML=err.toString();
							}
						);
					},
				}),
			}
			for(var cc in cols){
				var col=cols[cc];
				quickhtml({
					target:tr,
					tag:'td',
					attr:{class:'gamelist_td_'+col.style},
					sub:[col.view(gdata,vset)]
				});
			}
			quickhtml({
				target:tbl,
				tag:'tr',
				sub:[vset.notice]
			});
		});

		showPageBar(div,main,sdata,page);
		stg.show(div);
	},
	(err)=>{
		stg.show(err.toString());
	}));
}

function showRunning(target,main,sinfo,gdata){

	var dialog_meta=quickhtml({
		target:target,
		tag:'dialog',
		attr:{class:'metaedit_dialog'},
	});

	var box=quickhtml({
		target:target,
		tag:'div',
		attr:{class:'currentgame'},
	});

	quickhtml({
		target:box,
		tag:'div',
		attr:{class:'curgamecaption'},
		sub:['Now Playing']
	});

	var sname=gdata.systemName;
	if(sinfo[sname])sname=sinfo[sname].fullname;
	quickhtml({
		target:box,
		tag:'div',
		attr:{class:'systemcaption'},
		sub:[sname]
	});
	quickhtml({
		target:box,
		tag:'div',
		attr:{class:'gamecaption'},
		sub:[gdata.name]
	});

	var toolbar=quickhtml({
		target:box,
		tag:'div',
	});
	var confirmebar=quickhtml({
		target:box,
		tag:'div',
	});
	var noticebar=quickhtml({
		target:box,
		tag:'div',
	});
	var metabar=quickhtml({
		target:box,
		tag:'div',
	});

	var detailbtn=quickhtml({
		target:toolbar,
		tag:'button',
		sub:['Meta']
	}).onclick=()=>{
		showMetaDialog(dialog_meta,gdata,null);
	}
	if(booleanize(gdata.jukeboxAvailable)){
		var detailbtn=quickhtml({
			target:toolbar,
			tag:'button',
			sub:['Mus']
		});
	}
	if(booleanize(gdata.slideshowAvailable)){
		var detailbtn=quickhtml({
			target:toolbar,
			tag:'button',
			sub:['Pic']
		});
	}
	if(booleanize(gdata.docsAvailable)){
		var detailbtn=quickhtml({
			target:toolbar,
			tag:'button',
			sub:['Doc']
		});
	}

	var termbtn=htmlut_confirmbutton({
		phasing:false,
		target:toolbar,
		target_notice:confirmebar,
		caption_first:'Terminate',
		cbexec:(ctrl,view)=>{
			main.monoq.stage(es_client.get_text('/emukill',
				(data)=>{
					updateHome(main,sinfo);
				},
				(err)=>{
					ctrl.show();
					noticebar.innerHTML='';
					quickhtml({
						target:noticebar,
						tag:'div',
						sub:[err.toString()]
					});
				}));
		},
	});

	var url=null;
	if(gdata.marquee)url=gdata.marquee;
	else if(gdata.thumb)url=gdata.thumb;
	else if(gdata.image)url=gdata.image;
	else if(gdata.ingameshot)url=gdata.ingameshot;
	else if(gdata.titleshot)url=gdata.titleshot;

	if(url){
		quickhtml({
			target:box,
			tag:'img',
			attr:{src:url,class:'gamethumb'},
		})
	}
}

function showIdling(target,main){

	var box=quickhtml({
		target:target,
		tag:'div',
		attr:{class:'currentgame'},
	});

	quickhtml({
		target:box,
		tag:'div',
		attr:{class:'curgamecaption'},
		sub:['...Now Idling...']
	});

	var toolbar=quickhtml({
		target:box,
		tag:'div',
	});
	var confirmebar=quickhtml({
		target:box,
		tag:'div',
	});
	var noticebar=quickhtml({
		target:box,
		tag:'div',
	});

	var musbtn=quickhtml({
		target:toolbar,
		tag:'button',
		sub:['Music']
	});
	musbtn.onclick=()=>{
		main.jukebox.open('/music');
	}

	var splbtn=quickhtml({
		target:toolbar,
		tag:'button',
		sub:['Splash']
	});
	splbtn.onclick=()=>{
		main.slideshow.open('/splash');
	}

	var rstbtn=htmlut_confirmbutton({
		phasing:false,
		target:toolbar,
		target_notice:confirmebar,
		caption_first:'Restart',
		cbexec:(ctrl,view)=>{
			es_client.get_text('/restart',
				(data)=>{
					ctrl.show();
					noticebar.innerHTML='';
					quickhtml({
						target:noticebar,
						tag:'div',
						sub:['Restarting accepted']
					});
				},
				(err)=>{
					ctrl.show();
					noticebar.innerHTML='';
					quickhtml({
						target:noticebar,
						tag:'div',
						sub:[err.toString()]
					});
				});
		},
	});

	var quitbtn=htmlut_confirmbutton({
		phasing:false,
		target:toolbar,
		target_notice:confirmebar,
		caption_first:'Quit',
		cbexec:(ctrl,view)=>{
			es_client.get_text('/quit',
				(data)=>{
					ctrl.show();
					noticebar.innerHTML='';
					quickhtml({
						target:noticebar,
						tag:'div',
						sub:['Quitting accepted']
					});
				},
				(err)=>{
					ctrl.show();
					noticebar.innerHTML='';
					quickhtml({
						target:noticebar,
						tag:'div',
						sub:[err.toString()]
					});
				});
		},
	});

	var msgbox=quickhtml({
		target:box,
		tag:'textarea',
	});

	var msgbtns=quickhtml({
		target:box,
		tag:'div',
	});
	var notibtn=quickhtml({
		target:msgbtns,
		tag:'button',
		sub:['Notify']
	});
	notibtn.onclick=()=>{
		es_client.post_text('/notify',msgbox.value);
	}
	var msgbtn=quickhtml({
		target:msgbtns,
		tag:'button',
		sub:['Message']
	});
	msgbtn.onclick=()=>{
		es_client.post_text('/messagebox',msgbox.value);
	}
}

function updateHome(main,sinfo){

	var stg=main.monoq.stage(es_client.get_json('/runningGame',
	(gdata)=>{
		var div=quickhtml({
			tag:'div',
			attr:{class:'homeview'},
		});

		quickhtml({
			target:div,
			tag:'div',
			attr:{class:'homecaption'},
			sub:['Batocera.linux']
		});
		quickhtml({
			target:div,
			tag:'div',
			attr:{class:'secondcaption'},
			sub:[es_caps.Version?es_caps.Version:'']
		});

		if(gdata.id)showRunning(div,main,sinfo,gdata);
		else showIdling(div,main);

		stg.show(div);
	},
	(err)=>{
		stg.show(err.toString());
	},{cbgate:(res)=>{
		switch(res.status){
			case 200: return null;
			default:
			var j=null;
			try{
				return (res)=>JSON.parse(res.body);
			}
			catch(e){
				throw res;
			}
		}
	}}));
}

function updateSystemList(main,ctrl,data){

	var div=quickhtml({
		tag:'div',
		attr:{class:'syslist'}
	});
	var div_c=quickhtml({
		target:div,
		tag:'div',
		attr:{class:'syscollection'}
	});
	var div_s=quickhtml({
		target:div,
		tag:'div',
		attr:{class:'syshardware'}
	});
	var div_h=quickhtml({
		target:div,
		tag:'div',
		attr:{class:'syshardware'}
	});

	var st_all=null;
	var st_favo=null;
	var st_ss=null;
	var st_col=[]
	var st_hw=[]

	for(var st of data){
		if(st.name=='all')st_all=st;
		else if(st.name=='favorites')st_favo=st;
		else if(st.name=='imageviewer')st_ss=st;
		else if(booleanize(st.collecton))st_col.push(st);
		else st_hw.push(st);
	}

	ctrl.syssel=htmlut_radioset({
		tag:'div',
		class_off:'card_others',
		class_on:'card_selected',
		cbselect:(prev,next)=>{
			updateGameList(main,ctrl.sysinfo[next]);
		},
	});

	if(st_all)div.append(ctrl.syssel.add(st_all.name,st_all.fullname).view);
	if(st_favo)div.append(ctrl.syssel.add(st_favo.name,st_favo.fullname).view);

	if(st_col.count>0){
		quickhtml({
			target:div,
			tag:'div',
			attr:{class:'cardgroup'},
			sub:['Collection']
		});
		for(var st of st_col)div.append(ctrl.syssel.add(st.name,st.fullname).view);
	}

	ctrl.grpsel=htmlut_selectset({
		target:div,
		init:ctrl.sysorder,
		cbchange:(prev,next)=>{
			system_order=next;
		},
	});
	safeobjectiter(system_grouping,(k,t)=>{
		ctrl.grpsel.add(k,t.capt,(prev,next)=>{
			if(k==ctrl.sysorder)return;
			ctrl.sysorder=k;
			replace(t);
		});
	});

	var btn_renew=quickhtml({
		target:div,
		tag:'button',
		sub:['Renew']
	});
	btn_renew.onclick=()=>{
		ctrl.renew();
	}

	var grpsort=quickhtml({
		target:div,
		tag:'div',
	});

	var replace=(t)=>{
		var hws={}
		if(t.sort)ctrl.cursort=t.sort;
		st_hw.sort(ctrl.cursort);
		if(t.group){
			for(var hw of st_hw)t.group(hws,hw);
		}
		else{
			hws={'':st_hw}
		}

		grpsort.innerHTML='';
		for(var cate in hws){
			quickhtml({
				target:grpsort,
				tag:'div',
				attr:{class:'cardgroup'},
				sub:[cate?cate:'System']
			});
			for(var hw of hws[cate]){
				grpsort.append(ctrl.syssel.add(hw.name,hw.fullname).view);
			}
		}
	}
	replace(system_grouping[ctrl.sysorder]);
	return div;
}

function setupToolBox(main){

	var ctrl={
		view:quickhtml({
			target:main.leftpane.view,
			tag:'div',
			attr:{class:'toolbox'}
		}),
	}

	ctrl.btn_home=quickhtml({
		target:ctrl.view,
		tag:'button',
		attr:{class:'toolbtn'},
		sub:['Home']
	});

	ctrl.btn_screenshot=quickhtml({
		target:ctrl.view,
		tag:'button',
		attr:{class:'toolbtn'},
		sub:['SS']
	});
	ctrl.btn_screenshot.onclick=()=>{
		main.slideshow.open('/screenshots');
	}

	ctrl.btn_jukebox=quickhtml({
		target:ctrl.view,
		tag:'button',
		attr:{class:'toolbtn'},
		sub:['♪']
	});
	ctrl.btn_jukebox.onclick=()=>{
		main.jukebox.reopen();
	}

	return ctrl;
}

function setupSysBox(main){

	var ctrl={
		view:quickhtml({
			target:main.leftpane.view,
			tag:'div',
			attr:{class:'sysbox'}
		}),
		sysorder:'byname',
		sysinfo:null,
		syssel:null,
		grpsel:null,
		cursort:system_grouping['byname'].sort,

		renew:(cbdone)=>{
			var stg=mq.stage(es_client.get_json('/systems',
			(data)=>{
				ctrl.sysinfo={}
				for(var sd of data)ctrl.sysinfo[sd.name]=sd;
				stg.show(updateSystemList(main,ctrl,data));
				if(cbdone)cbdone();
			},
			(err)=>{
				stg.show(err.toString());
			}));
		},
	}

	var mq=es_monoq(ctrl.view);
	return ctrl;
}

function setupSideBar(main){

	var ctrl={
		toolbox:setupToolBox(main),
		sysbox:setupSysBox(main),
	}

	ctrl.toolbox.btn_home.onclick=()=>{
		ctrl.sysbox.syssel.unselect();
		updateHome(main,ctrl.sysbox.sysinfo);
	}

	return ctrl;
}

function setupLeftPane(main){

	var ctrl={
		view:quickhtml({
			target:main.view,
			tag:'div',
			attr:{class:'leftpane'},
		}),
	}

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

function runESNC(view){

	es_init();

	var main={
		requesting:null,
		
		view:quickhtml({
			tag:'div',
			attr:{class:'mainboard'},
		}),

		abort:()=>{
			if(!main.requesting)return;
			main.requesting.abort();
			main.requesting=null;
		}
	}


	view.innerHTML='';
	view.append(main.view);
	main.view.innreHTML='';

	main.leftpane=setupLeftPane(main);
	main.rightpane=setupRightPane(main);
	main.monoq=es_monoq(main.rightpane.view),
	main.slideshow=slideshow_setup(main.view);
	main.jukebox=jukebox_setup(main.view);

	es_client.get_json('/caps',
	(data)=>{
		if(!data.Flags)data.Flags=es_caps.Flags;
		if(!data.Texts)data.Texts=es_caps.Texts;
		if(!data.Videos)data.Videos=es_caps.Videos;
		if(!data.Images)data.Images=es_caps.Images;
		es_caps=data;
		main.sidebar=setupSideBar(main);
		main.sidebar.sysbox.renew((data)=>{
			updateHome(main,main.sidebar.sysbox.sysinfo);
		});
	},
	(err)=>{
		main.rightpane.view.innerHTML=err.toString();
	});
}

const esnc_ready=true;
