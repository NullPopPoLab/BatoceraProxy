// † EmulationStation NullPopPoCustom † //
// meta editor //

ipl_modules.load('genres.js');
ipl_modules.load('mediaview.js');

const ratingscore=['0','0.2','0.4','0.6','0.8','1']

var metaset={
	id:{capt:'ID'},
	path:{capt:'Path'},
	systemName:{capt:'System'},
	playcount:{capt:'Play Count'},
	lastplayed:{capt:'Last Played Time',view:metaedit_row_datetime_fixed},
	gametime:{capt:'Played Game Time',view:metaedit_row_seconds_fixed},
	docsAvailable:{capt:'Has Documents',view:metaedit_row_yesno_fixed},
	slideshowAvailable:{capt:'Has Slideshow',view:metaedit_row_yesno_fixed},
	jukeboxAvailable:{capt:'Has Jukebox',view:metaedit_row_yesno_fixed},
	arcadesystemname:{capt:'Powered by',view:metaedit_row_line},
	name:{capt:'Captional Title',view:metaedit_row_line},
	title:{capt:'Formal Title',view:metaedit_row_line},
	sortname:{capt:'Sortable Title',view:metaedit_row_line},
	family:{capt:'Family',view:metaedit_row_line},
	desc:{capt:'Description',view:metaedit_row_text},
	rating:{capt:'Rating',type:'rating',view:metaedit_row_rating},
	region:{capt:'Region',view:metaedit_row_line},
	lang:{capt:'Language',view:metaedit_row_line},
	releasedate:{capt:'Release Date',view:metaedit_row_date},
	developer:{capt:'Developer',view:metaedit_row_line},
	publisher:{capt:'Publisher',view:metaedit_row_line},
	genres:{capt:'Genres',view:metaedit_row_genre},
	players:{capt:'Players',view:metaedit_row_line},
}

function metaedit_seconds(val){
	var h=Math.floor(val/3600);
	val-=h*3600;
	var m=Math.floor(val/60);
	val-=m*60;
	var s=Math.floor(val);
	val-=s;
	var v=''+h+':'+zerofill(m,2)+':'+zerofill(s,2);
	if(val)v+=(''+val).substring(1);
	return v;
}

function metaedit_submit_button(row,data,cbbuild){

	var opt={
		target:row.edit,
		caption:'Submit',
		cbexec:(ctrl)=>{
			if(!cbbuild){
				row.msg.innerHTML='No way.';
				ctrl.unlock();
			}
			else{
				row.msg.innerHTML='Wait for it...';

				var dst={}
				if(!cbbuild(dst)){
					row.msg.innerHTML='Invalid';
					ctrl.unlock();
					return;
				}

				var sname=data['systemName'];
				var gid=data['id'];
				var url='/systems/'+sname+'/games/'+gid;
				es_client.post_json(url,dst,
					(d2)=>{
						row.msg.innerHTML='OK';
						ctrl.unlock();
						for(var k in dst)data[k]=dst[k];
					},
					(err)=>{
						row.msg.innerHTML=err.toString();
						ctrl.unlock();
					}
				);
			}
		}
	}
	return htmlut_safebutton(opt);
}

function metaedit_upload_button(target,msg,data,name,filter,cbdone){

	var opt={
		target:target,
		filter:filter,
		caption_select:'Upload',
		cbselect:(ctrl,files)=>{
			var path=files[0].name;
//			msg.innerHTML=path;
			ctrl.confirm();
		},
		cbcancel:(ctrl,files)=>{
			msg.innerHTML='';
		},
		cbexec:(ctrl,files)=>{
			msg.innerHTML='Wait for it...';

			var sname=data['systemName'];
			var gid=data['id'];
			var url='/systems/'+sname+'/games/'+gid+'/media/'+name;
			es_client.post_file(url,true,files[0],
				(d2)=>{
					msg.innerHTML='OK';
					data[name]=url;
					cbdone();
					ctrl.show();
				},
				(err)=>{
					msg.innerHTML=err.toString();
					ctrl.show();
				}
			);
		},
	}
	return htmlut_filebutton(opt);
}

function metaedit_delete_button(target,msg,data,name,cbdone){

	var opt={
		visible:!!data[name]??false,
		phasing:true,
		target:target,
		caption_first:'Delete',
		cbexec:(ctrl)=>{
			msg.innerHTML='Wait for it...';

			var sname=data['systemName'];
			var gid=data['id'];
			if(es_caps.DeleteMethod){
				var url='/systems/'+sname+'/games/'+gid+'/media/'+name;
				es_client.delete(url,
					(d2)=>{
						msg.innerHTML='OK';
						data[name]=null;
						cbdone();
						ctrl.show();
					},
					(err)=>{
						msg.innerHTML=err.toString();
						ctrl.show();
					}
				);
			}
			else{
				var url='/systems/'+sname+'/games/'+gid+'/remove_media/'+name;
				es_client.post_text(url,'',
					(d2)=>{
						msg.innerHTML='OK';
						data[name]=null;
						cbdone();
						ctrl.show();
					},
					(err)=>{
						msg.innerHTML=err.toString();
						ctrl.show();
					}
				);
			}
		}
	}
	return htmlut_confirmbutton(opt);
}

function metaedit_genres_button(row,data,name,dialog,cbdone){

	var opt={
		target:row.edit,
		caption:'Select',
		cbexec:(ctrl)=>{
			var src={}
			var csv=data['genres'];
			if(csv)for(var n of csv.split(',')){
				src[n]=true;
			}
			dialog.open(src,(dst)=>{
				var gn=[]
				var gs=[]
				for(var id in dst){
					gn.push(id);
					gs.push(genres_work.flat[id].path??'');
				}
				data['genre']=gs.join(', ');
				data['genres']=gn.join(',');
				if(cbdone)cbdone();
				ctrl.unlock();
			},()=>{
				ctrl.unlock();
			});
		}
	}
	return htmlut_safebutton(opt);
}

function metaedit_row_common(capt,data,name,outside){

	var row={
		capt:quickhtml({tag:'td',sub:[capt]}),
		val:quickhtml({tag:'td'}),
		edit:quickhtml({tag:'td'}),
		msg:quickhtml({tag:'td'}),
	}
	row.view=quickhtml({tag:'tr',sub:[row.capt,row.val,row.edit,row.msg]});
	return row;
}

function metaedit_row_fixed(capt,data,name,outside){

	var row=metaedit_row_common(capt,data,name,outside);
	var val=data[name]??null;
	if(val)row.val.append(val);
	return row;
}

function metaedit_row_seconds_fixed(capt,data,name,outside){

	var row=metaedit_row_common(capt,data,name,outside);
	row.val.append(es_seconds(data[name]??''));
	return row;
}

function metaedit_row_datetime_fixed(capt,data,name,outside){

	var row=metaedit_row_common(capt,data,name,outside);
	row.val.append(es_datetime(data[name]??''));
	return row;
}

function metaedit_row_yesno_fixed(capt,data,name,outside){

	var row=metaedit_row_common(capt,data,name,outside);
	row.val.append(booleanize(data[name]??null)?'Yes':'No');
	return row;
}

function metaedit_row_yesno_select(capt,data,name,outside){

	var row=metaedit_row_common(capt,data,name,outside);
	var val=booleanize(data[name]??null);

	var span=quickhtml({
		target:row.val,
		tag:'span',
		style:'display:inline-block',
	});
	var label0=quickhtml({target:span,tag:'label'});
	span.append(' ');
	var label1=quickhtml({target:span,tag:'label'});

	var radio0=quickhtml({
		target:label0,
		tag:'input',
		attr:{type:'radio'}
	});
	label0.append('No');
	label1.append('Yes');
	var radio1=quickhtml({
		target:label1,
		tag:'input',
		attr:{type:'radio'}
	});
	if(val)radio1.checked=true;
	else radio0.checked=true;

	var busy=false;
	radio0.onclick=()=>{
		if(busy)return;
		busy=true;
		val=false;
		radio1.checked=!radio0.checked;
		busy=false;
	}
	radio1.onclick=()=>{
		if(busy)return;
		busy=true;
		val=true;
		radio0.checked=!radio1.checked;
		busy=false;
	}

	metaedit_submit_button(row,data,(dst)=>{
		dst[name]=val?'true':'false';
		return true;
	});

	return row;
}

function metaedit_row_line(capt,data,name,outside){

	var row=metaedit_row_common(capt,data,name,outside);
	var val=data[name]??'';

	var inp=quickhtml({target:row.val,tag:'input',attr:{type:'text',value:val}});
	metaedit_submit_button(row,data,(dst)=>{
		dst[name]=inp.value;
		return true;
	});

	return row;
}

function metaedit_row_date(capt,data,name,outside){

	var row=metaedit_row_common(capt,data,name,outside);
	var val=es_date(data[name]??'');

	var inp=quickhtml({target:row.val,tag:'input',attr:{type:'text',value:val}});
	metaedit_submit_button(row,data,(dst)=>{
		var date=es_date_short(inp.value);
		if(!date)return false;
		dst[name]=date;
		return true;
	});

	return row;
}

function metaedit_row_text(capt,data,name,outside){

	var row=metaedit_row_common(capt,data,name,outside);
	var val=data[name]??'';

	var inp=quickhtml({target:row.val,tag:'textarea',sub:[val]});
	metaedit_submit_button(row,data,(dst)=>{
		dst[name]=inp.value;
		return true;
	});

	return row;
}

function metaedit_stars(target,score,cbchg=null){

	var stars=Math.floor(score*5+0.5);

	var inp=quickhtml({
		tag:'span',
		attr:{title:score},
		style:{display:'inline-block'},
	});

	var mark=[]
	var repaint=()=>{
		for(var i=0;i<5;++i){
			mark[i].setAttribute('title',score);
			mark[i].setAttribute('src',
				((i<stars)?es_resource.star1:es_resource.star0));
		}
	}

	safestepiter(0,5,1,(i)=>{
		mark[i]=quickhtml({
			target:inp,
			tag:'img',
			attr:{src:((i<stars)?es_resource.star1:es_resource.star0)},
		});
		mark[i].onclick=()=>{
			stars=(stars==1 && i==0)?0:(i+1);
			score=ratingscore[stars]
			repaint();
			if(cbchg)cbchg(score);
		}
		return true;
	});

	if(target)target.append(inp);

	var ctrl={
		view:inp,
		set:(v)=>{
			score=v;
			stars=Math.floor(score*5+0.5);
			repaint();
		},
	}

	return ctrl;
}

function metaedit_row_rating(capt,data,name,outside){

	var row=metaedit_row_common(capt,data,name,outside);
	var val=data[name]??'';

	var score=data[name]??0;
	metaedit_stars(row.val,score,(v)=>{score=v;});

	metaedit_submit_button(row,data,(dst)=>{
		dst[name]=score;
		return true;
	});

	return row;
}

function metaedit_row_genre(capt,data,name,outside){

	var row=metaedit_row_common(capt,data,name,outside);
	var updview=()=>{
		row.val.innerHTML='';
		row.val.append(data['genre']??'');
	}

	var dialog=genres_setup(outside,{langs:es_caps.GenreLanguages});

	metaedit_genres_button(row,data,name,dialog,updview);
	metaedit_submit_button(row,data,(dst)=>{
		if(es_caps.SaveGenreByIDs)dst['genres']=data['genres'];
		else dst['genre']=data['genre'];
		return true;
	});

	updview();
	return row;
}

function metaedit_row_link(capt,data,name,outside){

	var row=metaedit_row_common(capt,data,name,outside);
	var updview=()=>{
		row.val.innerHTML='';
		var val=data[name]??'';
		if(val){
			quickhtml({
				target:row.val,
				tag:'a',
				attr:{target:'_blank',href:val},
				sub:['[View]']
			});
		}

		row.edit.innerHTML='';
		metaedit_delete_button(row.edit,row.msg,data,name,updview);
		metaedit_upload_button(row.edit,row.msg,data,name,filterType('text','es'),updview);
	}

	updview();

	return row;
}

function metaedit_image_toolbar(data,name,type,updview){

	var qht_edit={
		tag:'div',
	}
	var view_edit=quickhtml(qht_edit);

	var qht_msg={
		tag:'div',
	}
	var view_msg=quickhtml(qht_msg);

	var updview2=()=>{
		updview();
		view_edit.innerHTML='';
		metaedit_delete_button(view_edit,view_msg,data,name,updview2);
		metaedit_upload_button(view_edit,view_msg,data,name,filterType(type,'es'),updview2);
	}

	var qht_bar={
		tag:'div',
		sub:[
			view_msg,
			view_edit,
		]
	}
	updview2();
	return quickhtml(qht_bar);
}

function metaedit(data){

	var sname=data['systemName'];
	var gname=data['name'];
	var gid=data['id'];

	var div=quickhtml({tag:'div'});

	var tbl=quickhtml({target:div,tag:'table',attr:{border:'border'}});
	var outside=quickhtml({target:div,tag:'div'});

	safeobjectiter(metaset,(name,attr)=>{

		var row=(attr.view??metaedit_row_fixed)(attr.capt,data,name,outside);
		tbl.append(row.view);
		return true;
	});

	safeobjectiter(es_caps.Flags,(name,capt)=>{

		var row=metaedit_row_yesno_select(
			capt,data,name,(dst,val)=>{
				dst[name]=val
			});
		tbl.append(row.view);
		return true;
	});

	safeobjectiter(es_caps.Texts,(name,capt)=>{

		var row=metaedit_row_text(
			capt,data,name,(dst,val)=>{
				dst[name]=val
			});
		tbl.append(row.view);

		return true;
	});

	safeobjectiter(es_caps.Books,(name,capt)=>{

		var row=metaedit_row_link(
			capt,data,name,(dst,val)=>{
				dst[name]=val
			});
		tbl.append(row.view);
		return true;
	});

	safeobjectiter(es_caps.Videos,(name,caption)=>{

		var view=quickhtml({tag:'div'});
		var updview=()=>{
			if(data[name]){
				view.innerHTML='';
				view.append(mediaview(es_client.makeurl(data[name]),'video'));
			}
			else{
				view.innerHTML='(empty)';
			}
		}

		quickhtml({
			target:div,
			tag:'fieldset',
			sub:[
				quickhtml({tag:'legend',sub:[caption]}),
				metaedit_image_toolbar(data,name,'video',updview),
				view
			]
		});
		return true;
	});

	safeobjectiter(es_caps.Images,(name,caption)=>{

		var view=quickhtml({tag:'div'});
		var updview=()=>{
			if(data[name]){
				view.innerHTML='';
				view.append(mediaview(es_client.makeurl(data[name]),'image'));
			}
			else{
				view.innerHTML='(empty)';
			}
		}

		quickhtml({
			target:div,
			tag:'fieldset',
			sub:[
				quickhtml({tag:'legend',sub:[caption]}),
				metaedit_image_toolbar(data,name,'image',updview),
				view
			]
		});
		return true;
	});

	return div;
}

const metaedit_ready=true;
