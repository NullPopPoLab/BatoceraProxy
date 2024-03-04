// † EmulationStation NullPopPoCustom † //
// genres view //

var genres_xml=ipl_resources_xml.load('resources/genres.xml');
ipl_modules.load('langsel.js');
ipl_styles.load('genres.css');

var genres_lang='en';
var genres_work=null;

function genres_work_setup_genres(genres){

	for(var g of genres.children){
		if(g.tagName!='genre')continue;
		var t={id:null,parent:null,path:null,ctl:null,sub:{},capt:{},alt:[]}
		for(var el of g.children){
			if(el.tagName=='id'){
				t.id=el.innerHTML;
			}
			else if(el.tagName=='parent'){
				t.parent=el.innerHTML;
			}
			else if(el.tagName=='altname'){
				t.alt.push(el.innerHTML);
			}
			else if(el.tagName.substring(0,4)=='nom_'){
				t.capt[el.tagName.substring(4)]=el.innerHTML;
			}
		}
		if(!t.id){
			console.error('Unindexed genre: '+JSON.stringify(t));
			continue;
		}
		if(genres_work.flat[t.id]){
			console.error('Genre ID already exists: '+t.id);
			continue;
		}
		if(!t.capt.en){
			console.warn('Unnamed genre: '+t.id);
		}
		else{
			t.path=t.capt.en;
		}
		genres_work.flat[t.id]=t;
	}

	for(var id in genres_work.flat){
		var t=genres_work.flat[id];
		var p=null
		if(t.parent!==null){
			p=genres_work.flat[t.parent];
			if(!p)console.warn('Parent missing: '+t.parent);
			else if(p.parent!==null){
				console.warn('Too deep genre layer: .../'+p.id+'/'+id);
				p=null;
			}
			if(p){
				t.path=p.path+' / '+t.path;
				p.sub[id]=t;
			}
			else{
				genres_work.tree[id]=t;
			}
		}
		else{
			genres_work.tree[id]=t;
		}

		if(t.path){
			if(genres_work.rlu[t.path]){
				console.error('Path already exists: '+t.path);
				continue;
			}
			genres_work.rlu[t.path]=t;
		}
	}
}

function genres_work_setup(xml){

	if(genres_work)return;
	genres_work={flat:{},rlu:{},tree:{}}
	for(var el of xml.children){
		if(el.tagName!='genres')continue;
		genres_work_setup_genres(el);
	}
}

function genres_view(board,src,cbdone,cbcancel,opt={}){

	board.innerHTML='';

	var xml=genres_xml.getInstance();
	genres_work_setup(xml);

	var toolbar=quickhtml({
		target:board,
		attr:{class:'genres_toolbar'},
		tag:'div',
	});

	var langsel=langsel_setup(toolbar,opt.langs,genres_lang,(sel)=>{
		genres_lang=sel;
		for(var id in genres_work.flat){
			var t=genres_work.flat[id];
			if(!t.ctl)continue;
			t.ctl.set_caption(t.capt[sel]??t.capt.en);
		}
	},{
		class_select:'genres_langsel',
	});

	var opt_close={
		target:toolbar,
		caption:'X',
		class_buton:'genres_button_close',
		cbexec:(ctl)=>{
			cbcancel();
			ctl.unlock();
			board.close();
		}
	}
	var btn_close=htmlut_safebutton(opt_close);

	var dl=quickhtml({
		target:board,
		tag:'dl',
		attr:{class:'genres_dl'},
	});

	safeobjectiter(genres_work.tree,(pg)=>{
		var pt=genres_work.tree[pg];
		var dt=quickhtml({
			target:dl,
			tag:'dt',
			attr:{class:'genres_dt'},
		});
		var dd=quickhtml({
			target:dl,
			tag:'dd',
			attr:{class:'genres_dd'},
		});

		pt.ctl=htmlut_lockbutton({
			target:dt,
			init:booleanize(src[pt.id]),
			caption:pt.capt[genres_lang]??pt.capt.en,
			class_off:'genres_unlocked',
			class_on:'genres_locked',
		});

		safeobjectiter(pt.sub,(sg)=>{
			var st=pt.sub[sg];

			st.ctl=htmlut_lockbutton({
				target:dd,
				init:booleanize(src[st.id]),
				caption:st.capt[genres_lang]??st.capt.en,
				class_off:'genres_unlocked',
				class_on:'genres_locked',
			});
			return true;
		});
		return true;
	});

	var footer=quickhtml({
		target:board,
		tag:'div',
		attr:{class:'genres_footer'},
	});

	var opt_ok={
		target:footer,
		caption:'OK',
		class_buton:'genres_button_ok',
		cbexec:(ctl)=>{
			var dst={}
			for(var id in genres_work.flat){
				var t=genres_work.flat[id];
				if(t.ctl.is_locked())dst[id]=true;
			}
			cbdone(dst);
			ctl.unlock();
			board.close();
		}
	}
	var btn_ok=htmlut_safebutton(opt_ok);

	var opt_cancel={
		target:footer,
		caption:'Cancel',
		class_buton:'genres_button_cancel',
		cbexec:(ctl)=>{
			cbcancel();
			ctl.unlock();
			board.close();
		}
	}
	var btn_cancel=htmlut_safebutton(opt_cancel);
}

function genres_setup(target,opt={}){

	var ctrl={
		view:quickhtml({
			target:target,
			tag:'dialog',
			attr:{class:'genres_dialog'},
		}),
		open:(src,cbdone,cbcancel)=>{
			genres_view(ctrl.view,src,cbdone,cbcancel,opt);
			ctrl.view.showModal();
		}
	}
	return ctrl;
}

const genres_ready=true;
