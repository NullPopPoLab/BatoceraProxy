// † EmulationStation NullPopPoCustom † //
// xSV codec //

const tsv_default={intercell:"\t",interline:"\n",quote:'"'}
const csv_default={intercell:',',interline:"\n",quote:'"'}
const ssv_default={intercell:' ',interline:"\n",quote:'"'}

function xsv_proc_string(key){
	return {
		key:key,
		export:(row,key)=>{
			return row[key]??'';
		},
		import:(row,key,val)=>{
			row[key]=''+val;
			return true;
		},
	}
}

function xsv_proc_bool(key,opt={}){
	return {
		key:key,
		export:(row,key)=>{
			return booleanize(row[key])?
				opt.export_true??1:
				opt.export_false??0;
		},
		import:(row,key,val)=>{
			row[key]=booleanize(val)?
				opt.import_true??true:
				opt.import_false??false;
			return true;
		},
	}
}

function xsv_proc_int(key){
	return {
		key:key,
		export:(row,key)=>{
			return row[key]??0;
		},
		import:(row,key,val)=>{
			row[key]=parseInt(val);
			return true;
		},
	}
}

function xsv_proc_float(key){
	return {
		key:key,
		export:(row,key)=>{
			return row[key]??0.0;
		},
		import:(row,key,val)=>{
			row[key]=parseFloat(val);
			return true;
		},
	}
}

function xsv_export_byline(row,proc,opt=tsv_default){

	const delim=new RegExp('('+rxescape(opt.intercell)+'|'+rxescape(opt.interline)+'|'+rxescape(opt.quote)+')','g');

	var d=[]
	for(var k in proc){
		var p=proc[k];
		var s=''+p.export(row,p.key);
		if(s.match(delim)){
			s=opt.quote+s.replace(opt.quote,opt.quote+opt.quote)+opt.quote;
		}
		d.push(s);
	}
	return d.join(opt.intercell);
}

function xsv_import_byline(row,proc=null,cols=null,opt=tsv_default){

	if(!row)return cols?{}:[];
	var a=row.split(opt.intercell);
	if(proc===null)return a;
	if(cols===null)return a;

	var t={}
	for(var k in cols){
		var p=proc[k];
		if(!p)continue;
		if(!p.import(t,p.key,a[cols[k]]))break;
	}

	return t;
}

function xsv_export_full(data,proc,opt=tsv_default){

	var lines=[]
	var cols=[]
	for(var k in proc)cols.push(k);
	lines.push(cols.join(opt.intercell));

	for(var row of data){
		lines.push(xsv_export_byline(row,proc,opt));
	}
	return lines.join(opt.interline);
}

function xsv_import_full(src,proc=null,cbkey=null,opt=tsv_default){

	var lines=src.split(opt.interline);
	if(lines.length<2){
		console.log('no enough lines');
		return cbkey?{}:[];
	}

	var cols={}
	var ha=xsv_import_byline(lines.shift().trimEnd(),proc,null,opt);
	for(var i in ha)cols[ha[i]]=i;

	var data=cbkey?{}:[]
	for(var s of lines){
		var t=xsv_import_byline(s,proc,cols,opt);
		if(t===null)continue;
		if(!cbkey){
			data.push(t);
			continue;
		}

		var k=cbkey(t);
		if(k===null)continue;
		data[k]=t;
	}

	return data;
}

const xsv_ready=true;
