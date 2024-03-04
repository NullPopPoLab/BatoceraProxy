// † MKKKKKS for web JS † //
// Mono Queue //

function monoq_setup(){

	const flush=()=>{
		ctrl.stage=null;
		ctrl.idx=(ctrl.idx<(1<<52))?(ctrl.idx+1):0;
	}

	var ctrl={
		stage:null,
		idx:0,

		abort:()=>{
			if(!ctrl.stage)return;
			ctrl.stage.abort();
			flush();
		},
		push:(cbdone=null,cbdrop=null,user={})=>{
			ctrl.abort();
			var act={
				idx:ctrl.idx,
				end:false,
				abort:()=>{
					if(act.end)return;
					act.end=true;
					if(cbdrop)cbdrop(user);
				},
				finish:()=>{
					if(act.end)return;
					act.end=true;
					if(act.idx!=ctrl.idx)return;
					if(cbdone)cbdone(user);
					flush();
				},
			}
			ctrl.stage=act;
			return act;
		},
	}

	return ctrl;
}

const monoq_ready=true;
