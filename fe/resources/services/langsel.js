// † EmulationStation NullPopPoCustom † //
// language seletor //

function langsel_setup(target,langs,current,cbchg,opt={}){

	var qht_select={
		target:target,
		tag:'select',
		attr:{},
	}
	if(opt.class_select)qht_select.attr.class=opt.class_select;
	var ctl_select={
		view:quickhtml(qht_select),
		option:[]
	}
	for(var n in langs){
		var ctl_option={
			key:n,
			view:quickhtml({
				target:ctl_select.view,
				tag:'option',
				attr:{value:n},
				sub:[langs[n]],
			}),
		}
		if(n==current)ctl_option.view.setAttribute('selected','selected');
		ctl_select.option.push(ctl_option);
	}
	ctl_select.view.onchange=()=>{
		var idx=ctl_select.view.selectedIndex;
		var ctl_option=ctl_select.option[idx];
		if(!ctl_option)return;
		var n=ctl_option.key;
		if(n==current)return;
		current=n;
		if(cbchg)cbchg(n);
	}
	return ctl_select;
}

const langsel_ready=true;
