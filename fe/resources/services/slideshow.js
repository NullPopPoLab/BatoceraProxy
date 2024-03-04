// † EmulationStation NullPopPoCustom † //
// Slideshow //

ipl_styles.load('slideshow.css');
ipl_modules.load('mediatype.js');
ipl_modules.load('es_client.js');

function slideshow_stop(ctrl){

	if(ctrl.autoplay){
		ctrl.autoplay.abort();
		ctrl.autoplay=null;
	}
}

function slideshow_auto(ctrl,delay,exec){

	slideshow_stop(ctrl);

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

function slideshow_show(ctrl,capt,url,play,onend){

	ctrl.view_capt.innerHTML=capt;
	ctrl.view_canvas.innerHTML='';

	switch(getMajorMediaType(url)){
		case 'video':
		var p=quickhtml({
			target:ctrl.view_canvas,
			tag:'video',
			attr:{controls:'controls'},
			style:{'max-width':'100%'},
			sub:[quickhtml({tag:'source',attr:{src:url}})
		]});
		p.onerror=()=>{
			if(onend)onend();
		}
		p.onended=(ev)=>{
			if(onend)onend();
		}
		if(play)p.setAttribute('autoplay','autoplay');
		break;

		case 'audio':
		var p=quickhtml({
			target:ctrl.view_canvas,
			tag:'audio',
			attr:{controls:'controls'},
			sub:[quickhtml({tag:'source',attr:{src:url}})
		]});
		p.onerror=()=>{
			if(onend)onend();
		}
		p.onended=(ev)=>{
			if(onend)onend();
		}
		if(play)p.setAttribute('autoplay','autoplay');
		break;

		case 'image':
		quickhtml({
			target:ctrl.view_canvas,
			tag:'img',
			attr:{src:url},
			style:{'max-width':'100%'},
		});
		slideshow_auto(ctrl,2000,()=>{
			if(onend)onend();
		});
		break;

		default:
		quickhtml({
			target:ctrl.view_canvas,
			tag:'div',
			sub:['(Unknown Type)']
		});
	}
}

function slideshow_start(ctrl,info,depth){

	ctrl.view_capt.innerHTML='Now Loading...';

	var cur=0;
	info.dirs.sort((a,b)=>{return (a<b)?-1:1});
	info.files.sort((a,b)=>{return (a<b)?-1:1});

	var show=(idx,play)=>{
		cur=idx;
		var name=info.files[idx].substring(2);
		var url=info.base+name;
		slideshow_stop(ctrl);
		slideshow_show(ctrl,name,url,play,change);
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
			slideshow_load(ctrl,url,depth+((name=='..')?-1:+1));
		}
		return true;
	});

	var max=info.files.length;
	if(max>0){
		show(cur,false);
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
		return;
	}

	var playmode='';
	var selnext=()=>{}
	var change=()=>{selnext();}
	var selmode=(mode)=>{
		if(mode==playmode)return false;
		if(playmode)ctrl.view_btns['ss_'+playmode].setAttribute('class','slideshow_mode_off');
		playmode=mode;
		ctrl.view_btns['ss_'+playmode].setAttribute('class','slideshow_mode_on');
		return true;
	}
	ctrl.view_btns.ss_off.onclick=()=>{
		if(!selmode('off'))return;
		slideshow_stop(ctrl);
		selnext=()=>{}
	}
	ctrl.view_btns.ss_rep.onclick=()=>{
		if(!selmode('rep'))return;
		slideshow_stop(ctrl);
		selnext=()=>{
			var next=cur;
			slideshow_auto(ctrl,3000,()=>{show(next,true);});
		}
		selnext();
	}
	ctrl.view_btns.ss_seq.onclick=()=>{
		if(!selmode('seq'))return;
		slideshow_stop(ctrl);
		selnext=()=>{
			var next=(cur+1)%max;
			slideshow_auto(ctrl,3000,()=>{show(next,true);});
		}
		selnext();
	}
	ctrl.view_btns.ss_rnd.onclick=()=>{
		if(!selmode('rnd'))return;
		slideshow_stop(ctrl);
		selnext=()=>{
			var next=Math.floor(Math.random()*max);
			slideshow_auto(ctrl,3000,()=>{show(next,true);});
		}
		selnext();
	}
	ctrl.view_btns.ss_off.click();
}

function slideshow_load(ctrl,url,depth){

	slideshow_abort(ctrl);

	ctrl.loading=es_client.get_json(url,
	(info)=>{
		ctrl.loading=null;
		slideshow_start(ctrl,info,depth);
	},
	(err)=>{
		ctrl.loading=null;
	});
}

function slideshow_abort(ctrl){

	slideshow_stop(ctrl);

	ctrl.view_canvas.innerHTML='';
	ctrl.view_dirsel.innerHTML='';
	ctrl.view_btns.left.onclick=()=>{}
	ctrl.view_btns.right.onclick=()=>{}
	ctrl.view_btns.ss_off.onclick=()=>{}
	ctrl.view_btns.ss_rep.onclick=()=>{}
	ctrl.view_btns.ss_seq.onclick=()=>{}
	ctrl.view_btns.ss_rnd.onclick=()=>{}
	ctrl.view_btns.ss_off.setAttribute('class','slideshow_mode_on');
	ctrl.view_btns.ss_rep.setAttribute('class','slideshow_mode_off');
	ctrl.view_btns.ss_seq.setAttribute('class','slideshow_mode_off');
	ctrl.view_btns.ss_rnd.setAttribute('class','slideshow_mode_off');

	if(ctrl.loading){
		ctrl.loading.abort();
		ctrl.loading=null;
	}
}

function slideshow_build(ctrl){

	ctrl.view_head=quickhtml({
		target:ctrl.view,
		tag:'div',
		attr:{class:'slideshow_head'},
	});
	ctrl.view_tool=quickhtml({
		target:ctrl.view_head,
		tag:'div',
		attr:{class:'slideshow_tool'},
	});
	ctrl.view_capt=quickhtml({
		target:ctrl.view_tool,
		tag:'div',
		attr:{class:'slideshow_capt'},
	});
	ctrl.view_btnbar=quickhtml({
		target:ctrl.view_tool,
		tag:'div',
		attr:{class:'slideshow_btnbar'},
	});
	ctrl.view_btns={
		ss_off:quickhtml({
			target:ctrl.view_btnbar,
			tag:'button',
			attr:{class:'slideshow_mode_off'},
			sub:['Off']
		}),
		ss_rep:quickhtml({
			target:ctrl.view_btnbar,
			tag:'button',
			attr:{class:'slideshow_mode_off'},
			sub:['Rep']
		}),
		ss_seq:quickhtml({
			target:ctrl.view_btnbar,
			tag:'button',
			attr:{class:'slideshow_mode_off'},
			sub:['Seq']
		}),
		ss_rnd:quickhtml({
			target:ctrl.view_btnbar,
			tag:'button',
			attr:{class:'slideshow_mode_off'},
			sub:['Rnd']
		}),
		left:quickhtml({
			target:ctrl.view_btnbar,
			tag:'button',
			attr:{class:'slideshow_btn'},
			sub:['←']
		}),
		right:quickhtml({
			target:ctrl.view_btnbar,
			tag:'button',
			attr:{class:'slideshow_btn'},
			sub:['→']
		}),
		quit:quickhtml({
			target:ctrl.view_btnbar,
			tag:'button',
			attr:{class:'slideshow_btn'},
			sub:['×']
		}),
	}
	ctrl.view_body=quickhtml({
		target:ctrl.view,
		tag:'div',
		attr:{class:'slideshow_body'},
	});
	ctrl.view_dirsel=quickhtml({
		target:ctrl.view_body,
		tag:'div',
		attr:{class:'slideshow_dir'},
	});
	ctrl.view_canvas=quickhtml({
		target:ctrl.view_body,
		tag:'div',
		attr:{class:'slideshow_canvas'},
	});

	ctrl.view_btns.quit.onclick=()=>{
		slideshow_abort(ctrl);
		ctrl.view.close();
	}
}

function slideshow_setup(target,opt={}){

	var ctrl={
		loading:null,
		autoplay:null,
		view:quickhtml({
			target:target,
			tag:'dialog',
			attr:{class:'slideshow_dialog'},
		}),
		open:(url)=>{
			ctrl.view.showModal();
			slideshow_load(ctrl,url,0);
		}
	}

	slideshow_build(ctrl);
	return ctrl;
}

const slideshow_ready=true;
