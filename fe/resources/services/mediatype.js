// † EmulationStation NullPopPoCustom † //
// required: 1stkit.js 

const content_type={
	audio:{
		'.mp3':{es:'audio/mpeg',fe:'audio/mpeg'},
		'.ogg':{es:'audeo/ogg',fe:'audio/ogg'},
		'.wav':{es:'audio/wav',fe:'audio/wav'},
	},
	video:{
		'.avi':{es:'video/x-msvideo',fe:'video/x-msvideo'},
		'.mkv':{es:'video/AV1',fe:'video/AV1'},
		'.mp4':{es:'video/H264',fe:'video/H264'},
		'.webm':{es:'video/webm',fe:'video/webm'},
	},
	image:{
		'.gif':{es:'image/gif',fe:'image/gif'},
		'.jpg':{es:'image/jpeg',fe:'image/jpeg'},
		'.jpeg':{es:'image/jpeg',fe:'image/jpeg'},
		'.png':{es:'image/png',fe:'image/png'},
		'.svg':{es:'image/svg+xml',fe:'image/svg+xml'},
		'.svg+sml':{es:'image/svg+xml',fe:'image/svg+xml'},
	},
	text:{
		'.cbz':{es:'application/x-cbz',fe:'vnd.comicbook+zip'},
		'.htm':{es:null,fe:'text/html'},
		'.html':{es:null,fe:'text/html'},
		'.pdf':{es:'application/pdf',fe:'application/pdf'},
		'.txt':{es:null,fe:'text/plain'},
	},
}

function filterType(type,uc){
	var t=[]
	var reg=content_type[type]
	for(var k in reg){
		if(reg[k][uc])t.push(reg[k][uc]);
	}
	return t.join(',');
}

function getFullMediaType(path,uc){
	var p=path.lastIndexOf('.');
	var ext=(p<0)?'':path.substring(p).toLowerCase();
	if(content_type.audio[ext])return content_type.audio[ext][uc];
	if(content_type.video[ext])return content_type.video[ext][uc];
	if(content_type.image[ext])return content_type.image[ext][uc];
	if(content_type.text[ext])return content_type.text[ext][uc];
	return '';
}

function getMajorMediaType(path){
	var p=path.lastIndexOf('.');
	var ext=(p<0)?'':path.substring(p).toLowerCase();
	if(content_type.audio[ext])return 'audio';
	if(content_type.video[ext])return 'video';
	if(content_type.image[ext])return 'image';
	if(content_type.text[ext])return 'text';
	return '';
}

const mediatype_ready=true;

