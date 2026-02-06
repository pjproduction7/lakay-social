(async ()=>{
  const owner='pjproduction7';
  const repo='lakay-social';
  const branch='feature/refactor-ui';
  try{
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/runs?branch=${branch}&per_page=1`);
    const j = await res.json();
    if(!(j.workflow_runs && j.workflow_runs.length>0)) return console.log('No runs found');
    const run = j.workflow_runs[0];
    console.log(`Run id: ${run.id} name: ${run.name} status: ${run.status} conclusion: ${run.conclusion} url: ${run.html_url}`);
    const r2 = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/runs/${run.id}/jobs`);
    const jobs = await r2.json();
    if(!(jobs.jobs && jobs.jobs.length>0)) return console.log('No jobs info');
    for(const job of jobs.jobs){
      console.log(`Job: ${job.name} id:${job.id} status:${job.status} conclusion:${job.conclusion}`);
      console.log(`  logs_url: ${job.logs_url}`);
    }
  }catch(e){console.error('Error',e.message)}
})();