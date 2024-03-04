// † EmulationStation NullPopPoCustom † //
// media view //

function mediaview(url,type=null){

	if(!type)type=getMajorMediaType(url);
	switch(type){
		case 'image':
		return quickhtml({
			tag:'img',
			attr:{src:url},
			style:{'max-width':'100%'},
		});

		case 'video':
		return quickhtml({
			tag:'video',
			attr:{controls:'controls',autoplay:'autoplay'},
			style:{'max-width':'100%'},
			sub:[quickhtml({tag:'source',attr:{src:url}})
		]});

		case 'audio':
		return quickhtml({
			tag:'audio',
			attr:{controls:'controls',autoplay:'autoplay'},
			sub:[quickhtml({tag:'source',attr:{src:url}})
		]});
	}

	return quickhtml({
		tag: 'div',
		sub:['Unknown type for '+url]
	});
}


const mediaview_ready=true;
