// † EmulationStation NullPopPoCustom † //
// required: 1stkit.js 

ipl_styles.load('objview.css');

function objview(data,name=null){

	var fs=quickhtml({
		tag:'fieldset',
		attr:{class:'objview_field'},
	});

	if(name){
		var cs=quickhtml({
			target:fs,
			tag:'legend',
			attr:{class:'objview_caption'},
			sub:[name]
		});
	}

	for(var k in data){
		var v=data[k];
		if(typeof v==='object'){
			fs.append(objview(v,k));
		}
		else{
			var ks=quickhtml({
				target:fs,
				tag:'div',
				attr:{class:'objview_key'},
				sub:[''+k]
			});

			var vs=quickhtml({
				target:ks,
				tag:'div',
				attr:{class:'objview_value'},
				sub:[''+v]
			});
		}
	}

	return fs;
}

const objview_ready=true;

