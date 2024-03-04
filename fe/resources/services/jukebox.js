// † EmulationStation NullPopPoCustom † //
// Jukebox //

ipl_styles.load('jukebox.css');
ipl_modules.load('mediatype.js');
ipl_modules.load('es_client.js');

function jukebox_stop(ctrl){

	if(ctrl.autoplay){
		ctrl.autoplay.abort();
		ctrl.autoplay=null;
	}
}

function jukebox_auto(ctrl,delay,exec){

	jukebox_stop(ctrl);

	var t={
		abf:false,
		toid:setTimeout(()=>{
			if(t.abf)return;
			t.abf=true;
			if(exec)exec();
		},delay),
		abort:()=>{
			if(t.abf)return;
			t.abf=true;
			clearTimeout(t.toid);
		}
	}
	ctrl.autoplay=t;
}

function jukebox_play(ctrl,capt,url,play,onend){

	ctrl.view_capt.innerHTML=capt;
	ctrl.view_player.innerHTML='';
	ctrl.player=null;

	switch(getMajorMediaType(url)){
		case 'video':
		ctrl.player=quickhtml({
			target:ctrl.view_player,
			tag:'video',
			attr:{controls:'controls'},
			style:{'max-width':'100%'},
			sub:[quickhtml({tag:'source',attr:{src:url}})
		]});
		ctrl.player.onerror=()=>{
			if(onend)onend();
		}
		ctrl.player.onended=(ev)=>{
			if(onend)onend();
		}
		if(play)ctrl.player.setAttribute('autoplay','autoplay');
		break;

		case 'audio':
		ctrl.player=quickhtml({
			target:ctrl.view_player,
			tag:'audio',
			attr:{controls:'controls'},
			sub:[quickhtml({tag:'source',attr:{src:url}})
		]});
		ctrl.player.onerror=()=>{
			if(onend)onend();
		}
		ctrl.player.onended=(ev)=>{
			if(onend)onend();
		}
		if(play)ctrl.player.setAttribute('autoplay','autoplay');
		break;

		default:
		quickhtml({
			target:ctrl.view_player,
			tag:'div',
			sub:['(Unknown Type)']
		});
		if(onend)onend();
	}
}

function jukebox_start(ctrl,info,depth){

	ctrl.view_capt.innerHTML='Now Loading...';

	var cur=-1;
	info.dirs.sort((a,b)=>{return (a<b)?-1:1});
	info.files.sort((a,b)=>{return (a<b)?-1:1});

	var trs=[]
	var show=(idx,play)=>{
		jukebox_stop(ctrl);
		if(cur>=0)trs[cur].setAttribute('class','jukebox_list_tr');
		if(idx<0)return;
		cur=idx;
		trs[idx].setAttribute('class','jukebox_list_tr_cur');

		var name=info.files[idx].substring(2);
		var url=info.base+name;
		jukebox_play(ctrl,name,url,play,change);
	}

	var dirs=info.dirs;
	if(depth>0)dirs.unshift('..');
	safearrayiter(dirs,(name)=>{
		if(name!='..')name=name.substring(2);
		var btn=quickhtml({
			target:ctrl.view_dirsel,
			tag:'button',
			sub:[name]
		});
		btn.onclick=()=>{
			var url=info.base+name+'/';
			jukebox_load(ctrl,url,depth+((name=='..')?-1:+1));
		}
		return true;
	});

	var max=info.files.length;
	if(max<1){
		ctrl.view_capt.innerHTML='(empty)';
		return;
	}

	var playmode='';
	var selnext=()=>{}
	var change=()=>{selnext();}
	var selmode=(mode)=>{
		if(mode==playmode)return false;
		if(playmode)ctrl.view_btns['ss_'+playmode].setAttribute('class','jukebox_mode_off');
		playmode=mode;
		ctrl.view_btns['ss_'+playmode].setAttribute('class','jukebox_mode_on');
		return true;
	}
	ctrl.view_btns.ss_off.onclick=()=>{
		if(!selmode('off'))return;
		jukebox_stop(ctrl);
		selnext=()=>{}
	}
	ctrl.view_btns.ss_rep.onclick=()=>{
		if(!selmode('rep'))return;
		selnext=()=>{
			var next=cur;
			jukebox_auto(ctrl,3000,()=>{show(next,true);});
		}
		if(cur>=0 && !ctrl.isplaying())show(cur,true);
	}
	ctrl.view_btns.ss_seq.onclick=()=>{
		if(!selmode('seq'))return;
		selnext=()=>{
			var next=(cur+1)%max;
			jukebox_auto(ctrl,3000,()=>{show(next,true);});
		}
		if(!ctrl.isplaying())show((cur<0)?0:cur,true);
	}
	ctrl.view_btns.ss_rnd.onclick=()=>{
		if(!selmode('rnd'))return;
		selnext=()=>{
			var next=Math.floor(Math.random()*max);
			jukebox_auto(ctrl,3000,()=>{show(next,true);});
		}
		if(!ctrl.isplaying())selnext();
	}
	ctrl.view_btns.ss_off.click();

	var tbl=quickhtml({
		target:ctrl.view_list,
		tag:'table',
		attr:{class:'jukebox_list_tbl',align:'center'},
	});
	safeobjectiter(info.files,(idx,path)=>{
		path=path.substring(2);
		var tr=quickhtml({
			target:tbl,
			tag:'tr',
			attr:{class:'jukebox_list_tr'},
		});
		trs.push(tr);
		var btntray=quickhtml({
			target:tr,
			tag:'td',
		});
		quickhtml({
			target:tr,
			tag:'td',
			sub:[path]
		});
		var btn=quickhtml({
			target:btntray,
			tag:'button',
			sub:['Play']
		});
		btn.onclick=()=>{show(idx,true);}
		return true;
	});

	var max=info.files.length;
	if(max>0){
		ctrl.view_btns.left.onclick=()=>{
			cur=(cur+max-1)%max;
			show(cur,false);
		}
		ctrl.view_btns.right.onclick=()=>{
			cur=(cur+1)%max;
			show(cur,false);
		}
	}
	else{
		ctrl.view_capt.innerHTML='(empty)';
	}
}

function jukebox_load(ctrl,url,depth){

	jukebox_abort(ctrl);

	ctrl.loading=es_client.get_json(url,
	(info)=>{
		ctrl.loading=null;
		jukebox_start(ctrl,info,depth);
	},
	(err)=>{
		ctrl.loading=null;
	});
}

function jukebox_abort(ctrl){

	jukebox_stop(ctrl);

	ctrl.player=null;
	ctrl.view_player.innerHTML='';
	ctrl.view_dirsel.innerHTML='';
	ctrl.view_list.innerHTML='';
	ctrl.view_btns.left.onclick=()=>{}
	ctrl.view_btns.right.onclick=()=>{}
	ctrl.view_btns.ss_off.onclick=()=>{}
	ctrl.view_btns.ss_rep.onclick=()=>{}
	ctrl.view_btns.ss_seq.onclick=()=>{}
	ctrl.view_btns.ss_rnd.onclick=()=>{}
	ctrl.view_btns.ss_off.setAttribute('class','jukebox_mode_on');
	ctrl.view_btns.ss_rep.setAttribute('class','jukebox_mode_off');
	ctrl.view_btns.ss_seq.setAttribute('class','jukebox_mode_off');
	ctrl.view_btns.ss_rnd.setAttribute('class','jukebox_mode_off');

	if(ctrl.loading){
		ctrl.loading.abort();
		ctrl.loading=null;
	}
}

function jukebox_build(ctrl){

	ctrl.view_head=quickhtml({
		target:ctrl.view,
		tag:'div',
		attr:{class:'jukebox_head'},
	});
	ctrl.view_tool=quickhtml({
		target:ctrl.view_head,
		tag:'div',
		attr:{class:'jukebox_tool'},
	});
	ctrl.view_capt=quickhtml({
		target:ctrl.view_tool,
		tag:'div',
		attr:{class:'jukebox_capt'},
	});
	ctrl.view_btnbar=quickhtml({
		target:ctrl.view_tool,
		tag:'div',
		attr:{class:'jukebox_btnbar'},
	});
	ctrl.view_btns={
		ss_off:quickhtml({
			target:ctrl.view_btnbar,
			tag:'button',
			attr:{class:'jukebox_mode_off'},
			sub:['Off']
		}),
		ss_rep:quickhtml({
			target:ctrl.view_btnbar,
			tag:'button',
			attr:{class:'jukebox_mode_off'},
			sub:['Rep']
		}),
		ss_seq:quickhtml({
			target:ctrl.view_btnbar,
			tag:'button',
			attr:{class:'jukebox_mode_off'},
			sub:['Seq']
		}),
		ss_rnd:quickhtml({
			target:ctrl.view_btnbar,
			tag:'button',
			attr:{class:'jukebox_mode_off'},
			sub:['Rnd']
		}),
		left:quickhtml({
			target:ctrl.view_btnbar,
			tag:'button',
			attr:{class:'jukebox_btn'},
			sub:['←']
		}),
		right:quickhtml({
			target:ctrl.view_btnbar,
			tag:'button',
			attr:{class:'jukebox_btn'},
			sub:['→']
		}),
		quit:quickhtml({
			target:ctrl.view_btnbar,
			tag:'button',
			attr:{class:'jukebox_btn'},
			sub:['×']
		}),
	}
	ctrl.view_player=quickhtml({
		target:ctrl.view,
		tag:'div',
		attr:{class:'jukebox_player'},
	});
	ctrl.view_dirsel=quickhtml({
		target:ctrl.view,
		tag:'div',
		attr:{class:'jukebox_dir'},
	});
	ctrl.view_body=quickhtml({
		target:ctrl.view,
		tag:'div',
		attr:{class:'jukebox_body'},
	});
	ctrl.view_list=quickhtml({
		target:ctrl.view_body,
		tag:'div',
		attr:{class:'jukebox_list'},
	});

	ctrl.view_btns.quit.onclick=()=>{
		ctrl.view.close();
	}
}

function jukebox_setup(target,opt={}){

	var ctrl={
		context:null,
		player:null,
		loading:null,
		autoplay:null,
		view:quickhtml({
			target:target,
			tag:'dialog',
			attr:{class:'jukebox_dialog'},
		}),
		open:(url)=>{
			ctrl.view.showModal();
			if(url==ctrl.context)return;
			ctrl.context=url;
			jukebox_load(ctrl,url,0);
		},
		reopen:(url)=>{
			ctrl.view.showModal();
		},
		isplaying:()=>{
			if(!ctrl.player)return false;
			return !ctrl.player.paused;
		},
	}

	jukebox_build(ctrl);
	return ctrl;
}

const jukebox_ready=true;
