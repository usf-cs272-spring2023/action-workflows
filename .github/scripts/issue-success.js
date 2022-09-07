// updates the issue comment with the successful request
module.exports = async ({github, context, core}) => {
  // try {
    const comment_id = process.env.COMMENT_ID;
    const results = JSON.parse(process.env.RESULTS);


  //   let message = `:octocat: @${ context.actor }, there are one or more problems with your request:\n\n`;


  //   // add error messages if there are any
  //   for (const property in json) {
  //     if (json[property]?.outputs?.error_messages != undefined) {
  //       message += json[property].outputs.error_messages;
  //     }
  //   }

  //   // add message footer
  //   message += `\n:warning: You must address these problems and then re-open this issue. See [run #${context.runNumber} (id ${context.runId})](https://github.com/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}) for details.`;

  //   // update issue comment
  //   // const updated = await github.rest.issues.updateComment({
  //   //   owner: context.repo.owner,
  //   //   repo: context.repo.repo,
  //   //   comment_id: comment_id,
  //   //   body: message
  //   // });
  // }
  // catch (error) {
  //   core.info(`${error.name}: ${error.message}`);
  //   core.setFailed(`Unable to update comment for issue #${context?.payload?.issue?.number}.`);
  // }

  try {
    const labels = JSON.parse(results.verify_request.outputs.labels);
    const assignees = ['mtquach2', 'par5ul1', 'igentle292'];
    const milestone_id = results.verify_request.outputs.milestone_id;

    const updated = await github.rest.issues.update({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: context.payload.issue.number,
      labels: labels,
      assignees: assignees,
      milestone: milestone_id,
      state: 'open'
    });

    core.info(`Updated issue #${context?.payload?.issue?.number} with successful request.`);
  }
  catch (error) {
    core.info(`${error.name}: ${error.message}`);

    core.startGroup('Outputting context...');
    core.info(JSON.stringify(context));
    core.endGroup();

    core.setFailed(`Unable to update results for issue #${context?.payload?.issue?.number}.`);
  }  
};