(async ()=>{
  const owner='pjproduction7';
  const repo='lakay-social';
  const branch='feature/refactor-ui';
  const max=40; const interval=15000;
  for(let i=1;i<=max;i++){
    try{
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/runs?branch=${branch}&per_page=5`);
      const j = await res.json();
      if(j.workflow_runs && j.workflow_runs.length>0){
        const run = j.workflow_runs[0];
        console.log(`[${i}] Run: ${run.name} #${run.run_number} status=${run.status} conclusion=${run.conclusion} url=${run.html_url}`);
        if(run.status === 'completed'){
          console.log(`COMPLETED ${run.conclusion}`);
          process.exit(run.conclusion === 'success' ? 0 : 1);
        }
      } else {
        console.log(`[${i}] No runs yet`);
      }
    } catch(e){
      console.log(`[${i}] Error: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, interval));
  }
  console.log('TIMEOUT waiting for workflow to complete');
  process.exit(2);
})();